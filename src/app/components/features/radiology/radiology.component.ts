import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { combineLatest, map, startWith } from 'rxjs';
import {
  CreateImagingOrderPayload,
  CreateRadiologyReportPayload,
  ImagingType,
  RadiologyOrder,
  RadiologyReport,
  UploadRadiologyImagesPayload,
} from '../../../models/radiology.models';
import { RadiologyService } from '../../../services/radiology.service';
import { AddRadiologyReportDialogComponent } from '../../dialogs/add-radiology-report-dialog/add-radiology-report-dialog.component';
import { NewRadiologyOrderDialogComponent } from '../../dialogs/new-radiology-order-dialog/new-radiology-order-dialog.component';
import { UploadRadiologyImagesDialogComponent } from '../../dialogs/upload-radiology-images-dialog/upload-radiology-images-dialog.component';
import { ViewRadiologyImagesDialogComponent } from '../../dialogs/view-radiology-images-dialog/view-radiology-images-dialog.component';

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
    MatTabsModule,
    MatIconModule,
  ],
  templateUrl: './radiology.component.html',
  styleUrl: './radiology.component.css',
})
export class RadiologyComponent {
  private readonly dialog = inject(MatDialog);
  private readonly radiologyService = inject(RadiologyService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly tabs: RadiologyTab[] = ['orders', 'reports', 'catalog'];
  activeTab: RadiologyTab = 'orders';

  readonly imagingTypes$ = this.radiologyService.getImagingTypes();
  readonly orders$ = this.radiologyService.getOrders();
  readonly reports$ = this.radiologyService.getReports();

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
      scheduled: orders.filter((order) => order.status === 'Scheduled').length,
      completed: orders.filter(
        (order) =>
          order.status === 'Completed' || order.status === 'Report Ready',
      ).length,
    })),
  );

  setActiveTab(index: number) {
    this.activeTab = this.tabs[index] ?? 'orders';
  }

  openNewOrderDialog(imagingTypes: ImagingType[]) {
    this.dialog
      .open(NewRadiologyOrderDialogComponent, {
        width: '760px',
        maxWidth: '95vw',
        data: { imagingTypes },
      })
      .afterClosed()
      .subscribe((payload: CreateImagingOrderPayload | undefined) => {
        if (payload) {
          this.radiologyService.createOrder(payload);
        }
      });
  }

  scheduleOrder(orderId: string) {
    this.radiologyService.scheduleOrder(orderId);
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
          this.radiologyService.uploadImages(payload);
        }
      });
  }

  openAddReportDialog(order: RadiologyOrder) {
    this.dialog
      .open(AddRadiologyReportDialogComponent, {
        width: '860px',
        maxWidth: '95vw',
        data: { order },
      })
      .afterClosed()
      .subscribe((payload: CreateRadiologyReportPayload | undefined) => {
        if (payload) {
          this.radiologyService.createReport(payload);
        }
      });
  }

  viewReport() {
    this.activeTab = 'reports';
  }

  printReport(report: RadiologyReport) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
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
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const writeWrapped = (
      text: string,
      fontSize = 11,
      lineGap = 16,
      isBold = false,
    ) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, contentWidth);
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
    writeWrapped(`Order ID: ${report.orderId}`, 11, 16);
    writeWrapped(`Patient: ${report.patient}`, 11, 16);
    writeWrapped(`Study: ${report.type}`, 11, 16);
    writeWrapped(`Scan Date: ${report.scanDate}`, 11, 16);
    writeWrapped(`Radiologist: ${report.radiologist}`, 11, 16);
    writeWrapped(`Status: ${report.status}`, 11, 18);
    y += 4;

    writeWrapped('Findings', 14, 18, true);
    writeWrapped(report.findings, 11, 16);
    y += 4;

    writeWrapped('Impression', 14, 18, true);
    writeWrapped(report.impression, 11, 16);
    y += 4;

    writeWrapped('Recommendations', 14, 18, true);
    writeWrapped(report.recommendations, 11, 16);

    const pdfBlob = doc.output('blob');
    const fileName = `${report.orderId.toLowerCase()}-radiology-report.pdf`;

    const downloadUrl = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);

    const subject = encodeURIComponent(`Radiology Report ${report.orderId}`);
    const body = encodeURIComponent(
      `Please find attached radiology report ${report.orderId} for patient ${report.patient}.\n\nGenerated on: ${new Date().toLocaleString()}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }

  viewUploadedImages(report: RadiologyReport) {
    const images = this.radiologyService.getUploadedImages(report.orderId);

    this.dialog.open(ViewRadiologyImagesDialogComponent, {
      width: '960px',
      maxWidth: '96vw',
      data: {
        report,
        images,
      },
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

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
