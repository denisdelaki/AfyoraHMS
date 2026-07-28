import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type VisitRecordFormValue = {
  date: string;
  doctor: string;
  diagnosis: string;
  prescription: string;
  amountBilled: string;
  whatHappened: string;
};

type AddVisitRecordDialogData = {
  mode: 'create' | 'edit';
  initialValue?: VisitRecordFormValue;
};

@Component({
  selector: 'app-add-visit-record-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './add-visit-record-dialog.component.html',
  styleUrl: './add-visit-record-dialog.component.css',
})
export class AddVisitRecordDialogComponent {
  readonly data = inject<AddVisitRecordDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<
      AddVisitRecordDialogComponent,
      VisitRecordFormValue | undefined
    >,
  );

  readonly visitForm = this.formBuilder.group({
    date: [
      this.data.initialValue?.date ?? this.todayDateValue(),
      [Validators.required],
    ],
    doctor: [this.data.initialValue?.doctor ?? '', [Validators.required]],
    diagnosis: [this.data.initialValue?.diagnosis ?? '', [Validators.required]],
    prescription: [
      this.data.initialValue?.prescription ?? '',
      [Validators.required],
    ],
    amountBilled: [
      this.data.initialValue?.amountBilled ?? '0.00',
      [Validators.required],
    ],
    whatHappened: [
      this.data.initialValue?.whatHappened ?? '',
      [Validators.required],
    ],
  });

  get title(): string {
    return this.data.mode === 'edit' ? 'Edit Visit Record' : 'Add Visit Record';
  }

  get submitLabel(): string {
    return this.data.mode === 'edit' ? 'Update Record' : 'Save Record';
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.visitForm.invalid) {
      this.visitForm.markAllAsTouched();
      return;
    }

    const value = this.visitForm.getRawValue();
    this.dialogRef.close({
      date: value.date ?? this.todayDateValue(),
      doctor: (value.doctor ?? '').trim(),
      diagnosis: (value.diagnosis ?? '').trim(),
      prescription: (value.prescription ?? '').trim(),
      amountBilled: String(value.amountBilled ?? '0.00').trim(),
      whatHappened: (value.whatHappened ?? '').trim(),
    });
  }

  private todayDateValue(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
