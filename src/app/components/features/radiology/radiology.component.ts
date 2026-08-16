import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, combineLatest, map, startWith, switchMap, take } from 'rxjs';
import {
  CreateImagingOrderPayload,
  CreateImagingTypePayload,
  CreateRadiologyReportPayload,
  ImagingType,
  RadiologyOrder,
  RadiologyReport,
  UploadRadiologyImagesPayload,
} from '../../../models/radiology.models';
import { RadiologyService } from '../../../services/radiology.service';
import { AddRadiologyReportDialogComponent } from '../../dialogs/add-radiology-report-dialog/add-radiology-report-dialog.component';
import { ManageImagingTypeDialogComponent } from '../../dialogs/manage-imaging-type-dialog/manage-imaging-type-dialog.component';
import { NewRadiologyOrderDialogComponent } from '../../dialogs/new-radiology-order-dialog/new-radiology-order-dialog.component';
import { UploadRadiologyImagesDialogComponent } from '../../dialogs/upload-radiology-images-dialog/upload-radiology-images-dialog.component';
import { ViewRadiologyImagesDialogComponent } from '../../dialogs/view-radiology-images-dialog/view-radiology-images-dialog.component';
import { ViewRadiologyReportDialogComponent } from '../../dialogs/view-radiology-report-dialog/view-radiology-report-dialog.component';
import { PatientsService } from '../../../services';
import { Patient } from '../patients/patient.models';
import { EmployeeService } from '../../../services/employee.service';
import { Employee } from '../../../models/employee.model';

type RadiologyTab = 'orders' | 'reports' | 'catalog';

@Component({
  selector: 'app-radiology',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './radiology.component.html',
  styleUrl: './radiology.component.css',
})
export class RadiologyComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly radiologyService = inject(RadiologyService);
  private readonly patientService = inject(PatientsService);
  private readonly employeeService = inject(EmployeeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly tabs: RadiologyTab[] = ['orders', 'reports', 'catalog'];
  activeTab: RadiologyTab = 'orders';
  facilityId = JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
  patients: Patient[] = [];
  employees: Employee[] = [];

  private readonly refreshOrders$ = new BehaviorSubject<void>(undefined);
  private readonly refreshReports$ = new BehaviorSubject<void>(undefined);
  private readonly refreshImagingTypes$ = new BehaviorSubject<void>(undefined);

  readonly imagingTypes$ = this.refreshImagingTypes$.pipe(
    switchMap(() => this.radiologyService.getImagingTypes(this.facilityId)),
  );
  readonly orders$ = this.refreshOrders$.pipe(
    switchMap(() => this.radiologyService.getOrders(this.facilityId)),
  );
  readonly reports$ = this.refreshReports$.pipe(
    switchMap(() => this.radiologyService.getReports(this.facilityId)),
  );

  ngOnInit(): void {
    this.fetchPatients(this.facilityId);
    this.fetchEmployees(this.facilityId);
  }

  private openSnackBar(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private fetchPatients(facilityId: string) {
    this.patientService.getPatients(facilityId).subscribe((patients: Patient[]) => {
      this.patients = patients;
    });
  }

  private fetchEmployees(facilityId: string) {
    this.employeeService.fetchEmployees(facilityId).subscribe((employees: Employee[]) => {
      this.employees = employees;
    });
  }

  readonly filteredOrders$ = combineLatest([
    this.orders$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([orders, term]) => {
      const normalizedTerm = term.trim().toLowerCase();
      if (!normalizedTerm) {
        return orders;
      }

      return orders.filter(
        (order) =>
          order.patient.toLowerCase().includes(normalizedTerm) ||
          order.id.toLowerCase().includes(normalizedTerm) ||
          order.type.toLowerCase().includes(normalizedTerm),
      );
    }),
  );

  readonly stats$ = this.orders$.pipe(
    map((orders) => ({
      totalOrders: orders.length,
      pending: orders.filter((order) => order.status === 'Pending').length,
      scheduled: orders.filter((order) => order.status === 'Scheduled' || order.status === 'In Progress').length,
      completed: orders.filter(
        (order) =>
          order.status === 'Completed' || order.status === 'Report Ready',
      ).length,
    })),
  );

  setActiveTab(index: number) {
    this.activeTab = this.tabs[index] ?? 'orders';
  }

  openNewOrderDialog() {
    const patients = this.patients.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` }));
    const doctors = this.employees.map(e => ({ id: e.id, name: e.name }));

    this.radiologyService
      .getImagingTypes(this.facilityId)
      .pipe(take(1))
      .subscribe((imagingTypes) => {
        this.dialog
          .open(NewRadiologyOrderDialogComponent, {
            width: '760px',
            maxWidth: '95vw',
            data: { patients: patients, doctors: doctors, imagingTypes: imagingTypes },
          })
          .afterClosed()
          .subscribe((payload: CreateImagingOrderPayload | undefined) => {
            if (payload) {
              this.radiologyService.createOrder(payload, this.facilityId).subscribe({
                next: () => {
                  this.openSnackBar('Imaging order created successfully.');
                  this.refreshOrders$.next();
                },
                error: (error) => {
                  console.error('Failed to create imaging order:', error);
                  this.openSnackBar('Failed to create imaging order.');
                },
              });
            }
          });
      });
  }

  // -------- Imaging Catalog  --------
  openAddImagingTypeDialog() {
    this.dialog
      .open(ManageImagingTypeDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((payload: CreateImagingTypePayload | undefined) => {
        if (payload) {
          this.radiologyService
            .createImagingType(payload, this.facilityId)
            .subscribe({
              next: () => {
                this.openSnackBar('Imaging type added to catalog.');
                this.refreshImagingTypes$.next();
              },
              error: (err) => {
                console.error('Failed to create imaging type:', err);
                this.openSnackBar('Failed to add imaging type.');
              },
            });
        }
      });
  }

  openEditImagingTypeDialog(type: ImagingType) {
    this.dialog
      .open(ManageImagingTypeDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'edit', type },
      })
      .afterClosed()
      .subscribe((payload: CreateImagingTypePayload | undefined) => {
        if (payload) {
          this.radiologyService
            .updateImagingType(type.id, payload)
            .subscribe({
              next: () => {
                this.openSnackBar('Imaging type updated.');
                this.refreshImagingTypes$.next();
              },
              error: (err) => {
                console.error('Failed to update imaging type:', err);
                this.openSnackBar('Failed to update imaging type.');
              },
            });
        }
      });
  }

  deleteImagingType(id: string) {
    if (!confirm('Remove this imaging type from the catalog?')) return;
    this.radiologyService.deleteImagingType(id).subscribe({
      next: () => {
        this.openSnackBar('Imaging type removed.');
        this.refreshImagingTypes$.next();
      },
      error: (err) => {
        console.error('Failed to delete imaging type:', err);
        this.openSnackBar('Failed to delete imaging type.');
      },
    });
  }

  scheduleOrder(orderId: string) {
    this.radiologyService.scheduleOrder(orderId).subscribe({
      next: () => {
        this.openSnackBar('Imaging test scheduled.');
        this.refreshOrders$.next();
      },
      error: (err) => {
        console.error('Failed to schedule order:', err);
        this.openSnackBar('Failed to schedule imaging test.');
      },
    });
  }

  openUploadImagesDialog(order: RadiologyOrder) {
    this.dialog
      .open(UploadRadiologyImagesDialogComponent, {
        width: '720px',
        maxWidth: '95vw',
        data: { order },
      })
      .afterClosed()
      .subscribe((payload: UploadRadiologyImagesPayload | undefined) => {
        if (payload) {
          this.radiologyService.uploadImages(payload, this.facilityId).subscribe({
            next: () => {
              this.openSnackBar('Scan images uploaded successfully.');
              this.refreshOrders$.next();
            },
            error: (err) => {
              console.error('Failed to upload scan images:', err);
              this.openSnackBar('Failed to upload scan images.');
            },
          });
        }
      });
  }

  openAddReportDialog(order: RadiologyOrder) {
    const radiologists = this.employees.filter(e => e.role === 'radiologist').map((e) => ({ id: e.id, name: e.name }));
    this.dialog
      .open(AddRadiologyReportDialogComponent, {
        width: '860px',
        maxWidth: '95vw',
        data: { order, radiologists },
      })
      .afterClosed()
      .subscribe((payload: CreateRadiologyReportPayload | undefined) => {
        if (payload) {
          this.radiologyService.createReport(payload, this.facilityId).subscribe({
            next: () => {
              this.openSnackBar('Radiology report added successfully.');
              this.refreshOrders$.next();
              this.refreshReports$.next();
            },
            error: (err) => {
              console.error('Failed to create report:', err);
              this.openSnackBar('Failed to save radiology report.');
            },
          });
        }
      });
  }

  openViewReportDetails(report: RadiologyReport) {
    this.radiologyService
      .getUploadedImages(this.facilityId, report.orderId)
      .pipe(take(1))
      .subscribe((images) => {
        this.dialog.open(ViewRadiologyReportDialogComponent, {
          width: '860px',
          maxWidth: '95vw',
          data: { report, images },
        });
      });
  }

  viewReport(order?: RadiologyOrder) {
    if (order) {
      this.reports$.pipe(take(1)).subscribe((reports) => {
        const matchingReport = reports.find(
          (r) => r.orderId === order.id || (r as any).orderRequestId === order.id,
        );
        if (matchingReport) {
          this.openViewReportDetails(matchingReport);
        } else {
          this.activeTab = 'reports';
          this.openSnackBar(`No formal report recorded for order ${order.id} yet.`);
        }
      });
    } else {
      this.activeTab = 'reports';
    }
  }

  printReport(report: RadiologyReport) {
    if (!report) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      this.openSnackBar('Pop-up blocked. Please allow pop-ups to print reports.');
      return;
    }

    printWindow.document.write(this.buildPrintableReportHtml(report));
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }

  async sendReportToDoctor(report: RadiologyReport) {
    if (!report) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const writeWrapped = (
        text: string | null | undefined,
        fontSize = 11,
        lineGap = 16,
        isBold = false,
      ) => {
        const safeText = String(text ?? '');
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(safeText, contentWidth);
        lines.forEach((line: string) => {
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }

          doc.text(line, margin, y);
          y += lineGap;
        });
      };

      writeWrapped('Radiology Report', 20, 24, true);
      writeWrapped(`Order ID: ${report.orderId || ''}`, 11, 16);
      writeWrapped(`Patient: ${report.patient || ''}`, 11, 16);
      writeWrapped(`Study: ${report.type || ''}`, 11, 16);
      writeWrapped(`Scan Date: ${report.scanDate || ''}`, 11, 16);
      writeWrapped(`Radiologist: ${report.radiologist || ''}`, 11, 16);
      writeWrapped(`Status: ${report.status || ''}`, 11, 18);
      y += 4;

      writeWrapped('Findings', 14, 18, true);
      writeWrapped(report.findings || '', 11, 16);
      y += 4;

      writeWrapped('Impression', 14, 18, true);
      writeWrapped(report.impression || '', 11, 16);
      y += 4;

      writeWrapped('Recommendations', 14, 18, true);
      writeWrapped(report.recommendations || '', 11, 16);

      const pdfBlob = doc.output('blob');
      const fileName = `${(report.orderId || 'report').toLowerCase()}-radiology-report.pdf`;

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);

      const subject = encodeURIComponent(`Radiology Report ${report.orderId || ''}`);
      const body = encodeURIComponent(
        `Please find attached radiology report ${report.orderId || ''} for patient ${report.patient || ''}.\n\nGenerated on: ${new Date().toLocaleString()}`,
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      this.openSnackBar('Report PDF generated and download started.');
    } catch (error) {
      console.error('Failed to send report to doctor:', error);
      this.openSnackBar('Failed to generate report PDF.');
    }
  }

  viewUploadedImages(report: RadiologyReport) {
    this.radiologyService
      .getUploadedImages(this.facilityId, report.orderId)
      .pipe(take(1))
      .subscribe((images) => {
        this.dialog.open(ViewRadiologyImagesDialogComponent, {
          width: '960px',
          maxWidth: '96vw',
          data: {
            report,
            images,
          },
        });
      });
  }

  trackByOrder(index: number, order: RadiologyOrder) {
    return order.id;
  }

  trackByReport(index: number, report: RadiologyReport) {
    return report.orderId;
  }

  trackByType(index: number, type: ImagingType) {
    return type.id;
  }

  private buildPrintableReportHtml(report: RadiologyReport) {
    return `
      <!doctype html>
      <html>
        <head>
          <title>Radiology Report - ${this.escapeHtml(report.orderId)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            h2 { margin: 16px 0 8px; font-size: 16px; }
            p { margin: 4px 0; line-height: 1.5; }
            .meta { color: #4b5563; margin-bottom: 14px; }
            .block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Radiology Report</h1>
          <p class="meta">Order: ${this.escapeHtml(report.orderId)} • Patient: ${this.escapeHtml(report.patient)}</p>
          <p><strong>Study:</strong> ${this.escapeHtml(report.type)}</p>
          <p><strong>Scan Date:</strong> ${this.escapeHtml(report.scanDate)}</p>
          <p><strong>Radiologist:</strong> ${this.escapeHtml(report.radiologist)}</p>
          <p><strong>Status:</strong> ${this.escapeHtml(report.status)}</p>

          <div class="block">
            <h2>Findings</h2>
            <p>${this.escapeHtml(report.findings)}</p>
          </div>

          <div class="block">
            <h2>Impression</h2>
            <p>${this.escapeHtml(report.impression)}</p>
          </div>

          <div class="block">
            <h2>Recommendations</h2>
            <p>${this.escapeHtml(report.recommendations)}</p>
          </div>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
