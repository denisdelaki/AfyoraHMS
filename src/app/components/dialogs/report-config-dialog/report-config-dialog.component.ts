import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideAngularModule, X, FilePlus2, Save } from 'lucide-angular';
import {
  CustomReportPayload,
  ReportTypeOption,
  SavedReport,
  TimeRangeOption,
} from '../../../models/reports.models';
import { ReportsDataService } from '../../../services/reports-data.service';

export interface ReportConfigDialogData {
  mode: 'create' | 'edit';
  report?: SavedReport;
  userRole?: string;
}

@Component({
  selector: 'app-report-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LucideAngularModule,
  ],
  templateUrl: './report-config-dialog.component.html',
  styleUrls: ['./report-config-dialog.component.css'],
})
export class ReportConfigDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ReportConfigDialogComponent>);
  private reportsDataService = inject(ReportsDataService);

  readonly X = X;
  readonly FilePlus2 = FilePlus2;
  readonly Save = Save;

  form!: FormGroup;
  reportTypes: ReportTypeOption[] = [];
  timeRanges: TimeRangeOption[] = [];

  readonly availableRoles = [
    'Admin',
    'SuperAdmin',
    'Doctor',
    'Nurse',
    'Pharmacist',
    'Lab Technician',
    'Accountant',
    'HR',
    'Receptionist',
    'Manager',
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReportConfigDialogData,
  ) {}

  ngOnInit(): void {
    this.reportTypes = this.reportsDataService.getReportTypes();
    this.timeRanges = this.reportsDataService.getTimeRangeOptions();

    const report = this.data?.report;

    this.form = this.fb.group({
      title: [report?.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [report?.description || '', [Validators.maxLength(300)]],
      reportType: [report?.reportType || 'general', [Validators.required]],
      timeRange: [report?.timeRange || '30days', [Validators.required]],
      department: [report?.department || ''],
      chartType: [report?.chartType || 'line', [Validators.required]],
      allowedRoles: [
        report?.allowedRoles || ['Admin', 'Manager'],
        [Validators.required],
      ],
    });
  }

  isRoleSelected(role: string): boolean {
    const selected: string[] = this.form.get('allowedRoles')?.value || [];
    return selected.includes(role);
  }

  toggleRole(role: string): void {
    const selected: string[] = [...(this.form.get('allowedRoles')?.value || [])];
    const index = selected.indexOf(role);

    if (index !== -1) {
      selected.splice(index, 1);
    } else {
      selected.push(role);
    }

    this.form.patchValue({ allowedRoles: selected });
    this.form.get('allowedRoles')?.markAsDirty();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CustomReportPayload = this.form.value;
    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
