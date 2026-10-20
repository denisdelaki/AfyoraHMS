import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { combineLatest, map, startWith, switchMap, throwError } from 'rxjs';
import {
  LabRequest,
  LabResult,
  LabTest,
  LabTestPayload,
  SubmitLabResultPayload,
} from '../../../models/laboratory.models';
import { LaboratoryService } from '../../../services/laboratory.service';
import { VisitQueueService } from '../../../services/visit-queue.service';
import { EnterLabResultsDialogComponent } from '../../dialogs/enter-lab-results-dialog/enter-lab-results-dialog.component';
import { ManageLabTestDialogComponent } from '../../dialogs/manage-lab-test-dialog/manage-lab-test-dialog.component';
import { NewLabOrderDialogComponent } from '../../dialogs/new-lab-order-dialog/new-lab-order-dialog.component';

type LaboratoryTab = 'requests' | 'results' | 'catalog';

@Component({
  selector: 'app-laboratory',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTabsModule,
    MatIconModule,
  ],
  templateUrl: './laboratory.component.html',
  styleUrl: './laboratory.component.css',
})
export class LaboratoryComponent implements OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly laboratoryService = inject(LaboratoryService);
  private readonly visitQueueService = inject(VisitQueueService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sanitizer = inject(DomSanitizer);

  showLabReportPreview = false;
  labReportPreviewUrl: SafeResourceUrl | null = null;
  private labReportObjectUrl: string | null = null;
  private labReportFileName = 'laboratory-report.pdf';
  @ViewChild('labReportPreviewFrame')
  private labReportPreviewFrame?: ElementRef<HTMLIFrameElement>;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly tabs: LaboratoryTab[] = ['requests', 'results', 'catalog'];
  activeTab: LaboratoryTab = 'requests';

  readonly tests$ = this.laboratoryService.getTests();
  readonly requests$ = this.laboratoryService.getRequests();
  readonly results$ = this.laboratoryService.getResults();

  readonly filteredRequests$ = combineLatest([
    this.requests$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([requests, term]) => {
      const normalizedTerm = term.trim().toLowerCase();
      if (!normalizedTerm) {
        return requests;
      }

      return requests.filter(
        (request) =>
          request.patient.toLowerCase().includes(normalizedTerm) ||
          request.id.toLowerCase().includes(normalizedTerm) ||
          request.test.toLowerCase().includes(normalizedTerm),
      );
    }),
  );

  readonly stats$ = this.requests$.pipe(
    map((requests) => ({
      totalRequests: requests.length,
      pending: requests.filter((r) => r.status === 'Pending').length,
      inProgress: requests.filter((r) => r.status === 'In Progress').length,
      completed: requests.filter(
        (r) => r.status === 'Completed' || r.status === 'Approved',
      ).length,
    })),
  );

  ngOnDestroy(): void {
    this.clearLabReportPreview();
  }

  setActiveTab(index: number) {
    this.activeTab = this.tabs[index] ?? 'requests';
  }

  openNewOrderDialog(tests: LabTest[]) {
    this.dialog
      .open(NewLabOrderDialogComponent, {
        width: '760px',
        maxWidth: '95vw',
        data: { tests },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) {
          this.laboratoryService.createOrder(payload).subscribe({
            next: () => this.openSnackBar('Lab request created successfully.'),
            error: (error) =>
              this.openSnackBar(
                this.getErrorMessage(error, 'Unable to create lab request.'),
              ),
          });
        }
      });
  }

  startTest(labId: string) {
    this.laboratoryService.startTest(labId);
  }

  openEnterResultsDialog(request: LabRequest) {
    this.dialog
      .open(EnterLabResultsDialogComponent, {
        width: '860px',
        maxWidth: '95vw',
        data: { request },
      })
      .afterClosed()
      .subscribe((payload: SubmitLabResultPayload | undefined) => {
        if (payload) {
          this.laboratoryService.submitResult(payload);
        }
      });
  }

  approveResult(labId: string) {
    this.laboratoryService.approveResult(labId);
  }

  async previewLabReport(result: LabResult): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      const bottom = pageHeight - margin - 24;
      let y = margin;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 112, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Laboratory Report', margin, 43);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text('CONFIDENTIAL CLINICAL DOCUMENT', margin, 64);
      doc.text(`Generated ${new Date().toLocaleString()}`, margin, 84);
      y = 132;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 96, 5, 5, 'FD');
      const metadata: [string, string][] = [
        ['PATIENT', result.patient],
        ['PATIENT / ORDER ID', result.labId],
        ['TEST', result.test],
        ['COMPLETED', result.completedDate],
        ['TECHNICIAN', result.technician],
        ['APPROVED BY', result.approvedBy || 'Not recorded'],
      ];
      const columnWidth = contentWidth / 2;
      metadata.forEach(([label, value], index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + 12 + column * columnWidth;
        const itemY = y + 20 + row * 28;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(label, x, itemY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(doc.splitTextToSize(value || 'Not recorded', columnWidth - 26)[0], x, itemY + 11);
      });
      y += 116;

      const writeSectionHeader = (title: string): void => {
        if (y > bottom - 30) {
          doc.addPage();
          y = margin;
        }
        doc.setFillColor(30, 64, 115);
        doc.rect(margin, y, contentWidth, 23, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(title, margin + 10, y + 15);
        doc.setTextColor(30, 41, 59);
        y += 33;
      };

      writeSectionHeader('Test parameters');
      const columns = [
        { label: 'Test', x: margin + 8, width: 160 },
        { label: 'Result', x: margin + 174, width: 90 },
        { label: 'Unit', x: margin + 270, width: 75 },
        { label: 'Reference range', x: margin + 350, width: 100 },
        { label: 'Status', x: margin + 455, width: 55 },
      ];

      const drawTableHeader = (): void => {
        doc.setFillColor(226, 232, 240);
        doc.rect(margin, y, contentWidth, 25, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        columns.forEach((column) => doc.text(column.label, column.x, y + 16));
        y += 25;
      };
      drawTableHeader();

      if (result.parameters.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('No test parameters recorded.', margin + 8, y + 18);
        y += 30;
      } else {
        result.parameters.forEach((parameter, index) => {
          if (y + 30 > bottom) {
            doc.addPage();
            y = margin;
            writeSectionHeader('Test parameters (continued)');
            drawTableHeader();
          }
          doc.setFillColor(index % 2 === 0 ? 255 : 248, 250, 252);
          doc.rect(margin, y, contentWidth, 30, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          const values = [
            parameter.name,
            parameter.value,
            parameter.unit || '—',
            parameter.range || '—',
          ];
          values.forEach((value, valueIndex) => {
            const column = columns[valueIndex];
            doc.text(
              doc.splitTextToSize(value || '—', column.width)[0],
              column.x,
              y + 18,
            );
          });
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(
            parameter.status === 'Normal' ? 4 : 185,
            parameter.status === 'Normal' ? 120 : 28,
            parameter.status === 'Normal' ? 87 : 28,
          );
          doc.text(parameter.status, columns[4].x, y + 18);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + 30, margin + contentWidth, y + 30);
          y += 30;
        });
      }

      if (result.remarks) {
        y += 18;
        writeSectionHeader('Laboratory remarks');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const remarkLines = doc.splitTextToSize(result.remarks, contentWidth);
        remarkLines.forEach((line: string) => {
          if (y > bottom) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += 14;
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('CONFIDENTIAL - For authorized care use only', margin, pageHeight - margin + 14);
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - margin + 14, {
          align: 'right',
        });
      }

      this.clearLabReportPreview();
      this.labReportObjectUrl = URL.createObjectURL(doc.output('blob'));
      this.labReportPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.labReportObjectUrl,
      );
      this.labReportFileName = `${result.patient
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || result.labId}-lab-report.pdf`;
      this.showLabReportPreview = true;
    } catch (error) {
      console.error('Failed to generate laboratory report PDF:', error);
      this.openSnackBar('Failed to generate the laboratory PDF. Please try again.');
    }
  }

  printLabReportPreview(): void {
    const previewWindow =
      this.labReportPreviewFrame?.nativeElement.contentWindow;
    if (!previewWindow) {
      this.openSnackBar('PDF preview is not ready to print. Please wait and try again.');
      return;
    }
    previewWindow.focus();
    previewWindow.print();
  }

  downloadLabReportPreview(): void {
    if (!this.labReportObjectUrl) return;
    const anchor = document.createElement('a');
    anchor.href = this.labReportObjectUrl;
    anchor.download = this.labReportFileName;
    anchor.click();
  }

  closeLabReportPreview(): void {
    this.showLabReportPreview = false;
    this.clearLabReportPreview();
  }

  private clearLabReportPreview(): void {
    if (this.labReportObjectUrl) {
      URL.revokeObjectURL(this.labReportObjectUrl);
      this.labReportObjectUrl = null;
    }
    this.labReportPreviewUrl = null;
  }

  requestRetest(labId: string) {
    this.laboratoryService.startTest(labId);
  }

  sendToDoctor(result: LabResult): void {
    const facilityId = this.getFacilityId();
    if (!facilityId) {
      this.openSnackBar('Unable to identify the current facility.');
      return;
    }

    this.laboratoryService
      .getRequestForResult(result.labId, facilityId)
      .pipe(
        switchMap((request) => {
          if (!request.ticketNumber) {
            return throwError(
              () =>
                new Error('This lab request is not linked to a visit ticket.'),
            );
          }

          return this.visitQueueService.refresh(facilityId).pipe(
            switchMap((tickets) => {
              const ticket = tickets.find(
                (item) => item.ticketNumber === request.ticketNumber,
              );
              if (!ticket) {
                return throwError(
                  () => new Error('The visit ticket could not be found.'),
                );
              }
              if (ticket.patientId !== request.patientId) {
                return throwError(
                  () =>
                    new Error(
                      'The visit ticket does not match the lab request patient.',
                    ),
                );
              }

              return this.visitQueueService
                .forwardTicket(ticket.id, 'Consultation', facilityId)
                .pipe(map(() => request));
            }),
          );
        }),
      )
      .subscribe({
        next: (request) =>
          this.openSnackBar(
            `Ticket forwarded to Consultation for the ordering clinician (${request.orderedBy}).`,
          ),
        error: (error) =>
          this.openSnackBar(
            this.getErrorMessage(
              error,
              'Unable to send the ticket to Consultation.',
            ),
          ),
      });
  }

  openCreateTestDialog(): void {
    this.dialog
      .open(ManageLabTestDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((payload: LabTestPayload | undefined) => {
        if (!payload) {
          return;
        }

        this.laboratoryService.createTest(payload).subscribe({
          next: () => {
            this.openSnackBar('Lab test created successfully.');
          },
          error: (error) => {
            this.openSnackBar(
              this.getErrorMessage(error, 'Unable to create lab test.'),
            );
          },
        });
      });
  }

  openEditTestDialog(testId: string): void {
    this.laboratoryService.getTestById(testId).subscribe({
      next: (test) => {
        this.dialog
          .open(ManageLabTestDialogComponent, {
            width: '640px',
            maxWidth: '95vw',
            data: { mode: 'edit', test },
          })
          .afterClosed()
          .subscribe((payload: LabTestPayload | undefined) => {
            if (!payload) {
              return;
            }

            this.laboratoryService.updateTest(testId, payload).subscribe({
              next: () => {
                this.openSnackBar('Lab test updated successfully.');
              },
              error: (error) => {
                this.openSnackBar(
                  this.getErrorMessage(error, 'Unable to update lab test.'),
                );
              },
            });
          });
      },
      error: (error) => {
        this.openSnackBar(
          this.getErrorMessage(error, 'Unable to load lab test.'),
        );
      },
    });
  }

  deleteTest(test: LabTest): void {
    const confirmed = window.confirm(
      `Delete ${test.name} (${test.id}) from the test catalog?`,
    );
    if (!confirmed) {
      return;
    }

    this.laboratoryService.deleteTest(test.id).subscribe({
      next: () => {
        this.openSnackBar('Lab test deleted successfully.');
      },
      error: (error) => {
        this.openSnackBar(
          this.getErrorMessage(error, 'Unable to delete lab test.'),
        );
      },
    });
  }

  trackByRequest(index: number, request: LabRequest) {
    return request.id;
  }

  trackByResult(index: number, result: LabResult) {
    return result.labId;
  }

  trackByTest(index: number, test: LabTest) {
    return test.id;
  }

  private openSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const apiError = error as {
      error?: { detail?: string; message?: string };
      message?: string;
    };

    return (
      apiError?.error?.detail ||
      apiError?.error?.message ||
      apiError?.message ||
      fallback
    );
  }

  private getFacilityId(): string {
    try {
      const user = JSON.parse(
        localStorage.getItem('afyora.user') || 'null',
      ) as { facility?: string | number } | null;
      return String(user?.facility || '');
    } catch {
      return '';
    }
  }
}
