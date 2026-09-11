import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-drug-category-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './manage-drug-category-dialog.component.html',
  styleUrl: './manage-drug-category-dialog.component.css'
})
export class ManageDrugCategoryDialogComponent {
  form: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ManageDrugCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { category: any } | null
  ) {
    this.isEditMode = !!data?.category;
    this.form = this.fb.group({
      name: [data?.category?.name || '', [Validators.required, Validators.maxLength(255)]],
      description: [data?.category?.description || '']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.data?.category,
        ...this.form.value
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
