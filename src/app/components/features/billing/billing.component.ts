import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import {
  LucideAngularModule,
  CreditCard,
  DollarSign,
  Plus,
  Receipt,
  Search,
} from 'lucide-angular';
import { NewInvoiceDialogComponent } from '../../dialogs/new-invoice-dialog/new-invoice-dialog.component';
import {
  RecordPaymentDialogComponent,
  RecordPaymentDialogData,
} from '../../dialogs/record-payment-dialog/record-payment-dialog.component';
import {
  Invoice,
  NewInvoicePayload,
  Payment,
  RecordPaymentPayload,
} from '../../../models/billing.models';
import { MatIcon } from '@angular/material/icon';
import {
  SendInvoiceReminderRequest,
  SmsService,
} from '../../../services/sms.service';
import { finalize } from 'rxjs';

type BillingTab = 'invoices' | 'payments';

@Component({
  selector: 'app-billing',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    LucideAngularModule,
    MatIcon,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css',
})
export class BillingComponent {
  private readonly dialog = inject(MatDialog);
  private readonly smsService = inject(SmsService);

  readonly Search = Search;
  readonly Plus = Plus;
  readonly DollarSign = DollarSign;
  readonly Receipt = Receipt;
  readonly CreditCard = CreditCard;

  searchTerm = '';
  activeTab: BillingTab = 'invoices';
  private readonly sendingReminderInvoiceIds = new Set<string>();
  private readonly reminderStatusByInvoiceId = new Map<
    string,
    'sent' | 'failed'
  >();

  invoices: Invoice[] = [
    {
      id: 'INV-001',
      patient: 'John Smith',
      patientId: 'P001',
      date: '2024-02-24',
      items: [
        { service: 'Consultation', amount: 150 },
        { service: 'Lab Tests', amount: 250 },
        { service: 'Medications', amount: 85 },
      ],
      subtotal: 485,
      tax: 48.5,
      total: 533.5,
      status: 'Paid',
      paymentMethod: 'Credit Card',
      insurance: { company: 'BlueCross', coverage: 70, claim: 'CLM-12345' },
    },
    {
      id: 'INV-002',
      patient: 'Sarah Johnson',
      patientId: 'P002',
      date: '2024-02-23',
      items: [
        { service: 'Surgery', amount: 5000 },
        { service: 'Hospital Stay (3 days)', amount: 1500 },
        { service: 'Medications', amount: 320 },
      ],
      subtotal: 6820,
      tax: 682,
      total: 7502,
      status: 'Pending',
      paymentMethod: null,
      insurance: { company: 'Aetna', coverage: 80, claim: 'CLM-12346' },
    },
    {
      id: 'INV-003',
      patient: 'Michael Brown',
      patientId: 'P003',
      date: '2024-02-22',
      items: [
        { service: 'X-Ray', amount: 200 },
        { service: 'Consultation', amount: 150 },
      ],
      subtotal: 350,
      tax: 35,
      total: 385,
      status: 'Overdue',
      paymentMethod: null,
      insurance: null,
    },
  ];

  payments: Payment[] = [
    {
      id: 'PAY-001',
      invoice: 'INV-001',
      patient: 'John Smith',
      amount: 533.5,
      method: 'Credit Card',
      date: '2024-02-24',
      status: 'Completed',
    },
    {
      id: 'PAY-002',
      invoice: 'INV-004',
      patient: 'Emma Davis',
      amount: 250,
      method: 'Cash',
      date: '2024-02-23',
      status: 'Completed',
    },
  ];

  get filteredInvoices(): Invoice[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.invoices;
    }

    return this.invoices.filter(
      (invoice) =>
        invoice.patient.toLowerCase().includes(term) ||
        invoice.id.toLowerCase().includes(term),
    );
  }

  get totalRevenue(): number {
    return this.invoices
      .filter((invoice) => invoice.status === 'Paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }

  get pendingAmount(): number {
    return this.invoices
      .filter(
        (invoice) =>
          invoice.status === 'Pending' || invoice.status === 'Overdue',
      )
      .reduce((sum, invoice) => sum + invoice.total, 0);
  }

  openNewInvoiceDialog(): void {
    const dialogRef = this.dialog.open(NewInvoiceDialogComponent, {
      width: '90vw',
      maxWidth: '760px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.createInvoiceFromPayload(result);
    });
  }

  openRecordPaymentDialog(invoice: Invoice): void {
    const dialogRef = this.dialog.open<
      RecordPaymentDialogComponent,
      RecordPaymentDialogData,
      RecordPaymentPayload
    >(RecordPaymentDialogComponent, {
      width: '500px',
      maxWidth: '92vw',
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.applyRecordedPayment(invoice.id, result);
    });
  }

  setActiveTab(index: number): void {
    this.activeTab = index === 1 ? 'payments' : 'invoices';
  }

  sendReminder(invoice: Invoice): void {
    if (this.sendingReminderInvoiceIds.has(invoice.id)) {
      return;
    }

    this.reminderStatusByInvoiceId.delete(invoice.id);
    this.sendingReminderInvoiceIds.add(invoice.id);

    const payload: SendInvoiceReminderRequest = {
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      patientName: invoice.patient,
      totalAmount: invoice.total,
      dueDate: invoice.date,
    };

    this.smsService
      .sendInvoiceReminder(payload)
      .pipe(
        finalize(() => {
          this.sendingReminderInvoiceIds.delete(invoice.id);
        }),
      )
      .subscribe({
        next: () => {
          this.reminderStatusByInvoiceId.set(invoice.id, 'sent');
        },
        error: () => {
          this.reminderStatusByInvoiceId.set(invoice.id, 'failed');
        },
      });
  }

  isReminderSending(invoiceId: string): boolean {
    return this.sendingReminderInvoiceIds.has(invoiceId);
  }

  getReminderLabel(invoiceId: string): string {
    if (this.sendingReminderInvoiceIds.has(invoiceId)) {
      return 'Sending...';
    }

    const status = this.reminderStatusByInvoiceId.get(invoiceId);
    if (status === 'sent') {
      return 'Reminder Sent';
    }

    if (status === 'failed') {
      return 'Retry Reminder';
    }

    return 'Send Reminder';
  }

  printInvoice(invoice: Invoice): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    const itemRows = invoice.items
      .map(
        (item) => `
          <tr>
            <td>${this.escapeHtml(item.service)}</td>
            <td style="text-align:right;">${this.formatCurrency(item.amount)}</td>
          </tr>
        `,
      )
      .join('');

    const insuranceSection = invoice.insurance
      ? `
        <div class="section">
          <h3>Insurance Information</h3>
          <p><strong>Company:</strong> ${this.escapeHtml(invoice.insurance.company)}</p>
          <p><strong>Coverage:</strong> ${invoice.insurance.coverage}%</p>
          <p><strong>Claim ID:</strong> ${this.escapeHtml(invoice.insurance.claim)}</p>
        </div>
      `
      : '';

    const printableHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${this.escapeHtml(invoice.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
            h1, h2, h3, p { margin: 0; }
            .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
            .meta { margin-top: 4px; color: #475569; font-size: 14px; }
            .section { margin-top: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 14px; }
            th { background: #f8fafc; text-align: left; }
            .totals td { font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>Billing Invoice</h2>
              <p class="meta">Invoice: ${this.escapeHtml(invoice.id)}</p>
            </div>
            <div>
              <p class="meta">Date: ${this.escapeHtml(invoice.date)}</p>
              <p class="meta">Status: ${this.escapeHtml(invoice.status)}</p>
            </div>
          </div>

          <div class="section">
            <p><strong>Patient:</strong> ${this.escapeHtml(invoice.patient)}</p>
            <p class="meta">Patient ID: ${this.escapeHtml(invoice.patientId)}</p>
          </div>

          <div class="section">
            <h3>Services</h3>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
                <tr class="totals">
                  <td>Subtotal</td>
                  <td style="text-align:right;">${this.formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr class="totals">
                  <td>Tax (10%)</td>
                  <td style="text-align:right;">${this.formatCurrency(invoice.tax)}</td>
                </tr>
                <tr class="totals">
                  <td>Total</td>
                  <td style="text-align:right;">${this.formatCurrency(invoice.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${insuranceSection}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  }

  private createInvoiceFromPayload(payload: NewInvoicePayload): void {
    if (!payload.items.length) {
      return;
    }

    const subtotal = payload.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const nextInvoiceNumber = this.invoices.length + 1;
    const nextPatientNumber = nextInvoiceNumber + 3;

    const newInvoice: Invoice = {
      id: `INV-${String(nextInvoiceNumber).padStart(3, '0')}`,
      patient: payload.patient,
      patientId: `P${String(nextPatientNumber).padStart(3, '0')}`,
      date: this.getTodayDate(),
      items: payload.items,
      subtotal,
      tax,
      total,
      status: 'Pending',
      paymentMethod: null,
      insurance: payload.insurance
        ? {
            company: payload.insurance.company,
            coverage: payload.insurance.coverage ?? 0,
            claim: `CLM-${Date.now().toString().slice(-5)}`,
          }
        : null,
    };

    this.invoices = [newInvoice, ...this.invoices];
  }

  private applyRecordedPayment(
    invoiceId: string,
    payload: RecordPaymentPayload,
  ): void {
    this.invoices = this.invoices.map((invoice) => {
      if (invoice.id !== invoiceId) {
        return invoice;
      }

      return {
        ...invoice,
        status: 'Paid',
        paymentMethod: payload.method,
      };
    });

    const invoice = this.invoices.find((entry) => entry.id === invoiceId);
    if (!invoice) {
      return;
    }

    const payment: Payment = {
      id: `PAY-${String(this.payments.length + 1).padStart(3, '0')}`,
      invoice: invoice.id,
      patient: invoice.patient,
      amount: payload.amount,
      method: payload.method,
      date: this.getTodayDate(),
      status: 'Completed',
    };

    this.payments = [payment, ...this.payments];
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
