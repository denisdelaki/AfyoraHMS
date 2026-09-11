import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DrugPurchaseOrder } from '../../../models';
import { PharmacyService } from '../../../services';

export interface POPreviewDialogData {
  po: DrugPurchaseOrder;
  facilityId: string | number;
}

@Component({
  selector: 'app-po-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './po-preview-dialog.component.html',
  styleUrl: './po-preview-dialog.component.css',
})
export class POPreviewDialogComponent implements OnInit {
  vendorEmail = '';
  ccEmails: string[] = [];
  isLoadingRecipients = true;
  isSendingEmail = false;

  constructor(
    private dialogRef: MatDialogRef<POPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: POPreviewDialogData,
    private pharmacyService: PharmacyService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.vendorEmail = this.data.po.vendorEmail || '';
    this.loadRecipients();
  }

  loadRecipients(): void {
    this.isLoadingRecipients = true;
    this.pharmacyService
      .getPORecipients(this.data.po.id, this.data.facilityId)
      .subscribe({
        next: (res) => {
          this.vendorEmail = res.vendor_email || this.data.po.vendorEmail || '';
          this.ccEmails = res.cc_emails || [];
          this.isLoadingRecipients = false;
        },
        error: () => {
          this.isLoadingRecipients = false;
        },
      });
  }

  downloadPDF(): void {
    this.pharmacyService
      .downloadPurchaseOrderPDF(this.data.po.id, this.data.facilityId)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `PO_${this.data.po.poNumber}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Purchase Order PDF downloaded.', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Failed to download PDF.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  sendEmail(): void {
    if (!this.vendorEmail) {
      this.snackBar.open('Vendor does not have an email address configured.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isSendingEmail = true;
    this.pharmacyService
      .sendPurchaseOrderEmail(this.data.po.id, this.data.facilityId, this.ccEmails)
      .subscribe({
        next: (res) => {
          this.isSendingEmail = false;
          this.data.po.emailSent = true;
          this.snackBar.open(res.message || 'Email sent successfully!', 'Close', {
            duration: 4000,
          });
          this.dialogRef.close(true);
        },
        error: () => {
          this.isSendingEmail = false;
          this.snackBar.open('Failed to send email.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
