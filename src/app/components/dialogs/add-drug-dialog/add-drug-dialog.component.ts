import { formatDate } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ClinicalConcept,
  DrugCategory,
  KnhtsConceptSearchResult,
} from '../../../models';
import { KnhtsConceptSearchComponent } from '../../shared/knhts-concept-search/knhts-concept-search.component';
import { PharmacyService } from '../../../services/pharmacy.service';

export type AddDrugPayload = {
  name: string;
  code?: string;
  system?: string;
  categoryId: number;
  stock: number;
  minStock: number;
  price: number;
  expiryDate: string;
  manufacturer: string;
};

@Component({
  selector: 'app-add-drug-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    KnhtsConceptSearchComponent,
  ],
  templateUrl: './add-drug-dialog.component.html',
  styleUrl: './add-drug-dialog.component.css',
})
export class AddDrugDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<AddDrugDialogComponent, AddDrugPayload | undefined>,
  );
  private readonly fb = inject(FormBuilder);
  readonly data = inject(MAT_DIALOG_DATA);
  private readonly pharmacyService = inject(PharmacyService);

  readonly today = new Date();
  readonly drugCategories: DrugCategory[] = this.data?.categories || [];
  selectedConcept: ClinicalConcept | null = null;
  /** Bound search function passed to <app-knhts-concept-search> — calls the pharmacy terminology endpoint */
  readonly drugSearchFn = (term: string) =>
    this.pharmacyService.searchDrugTerminology(term);

  readonly drugForm = this.fb.group({
    categoryId: [null as number | null, [Validators.required]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    minStock: [null as number | null, [Validators.required, Validators.min(0)]],
    price: [null as number | null, [Validators.required, Validators.min(0)]],
    expiryDate: ['', [Validators.required]],
    manufacturer: ['', [Validators.required]],
  });

  onConceptSelected(concept: ClinicalConcept | null): void {
    this.selectedConcept = concept;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAddToCatalog(): void {
    if (this.drugForm.invalid) {
      this.drugForm.markAllAsTouched();
      return;
    }

    const conceptName =
      this.selectedConcept?.display ||
      this.selectedConcept?.text ||
      this.selectedConcept?.coding?.[0]?.display ||
      '';

    const code =
      this.selectedConcept?.coding?.[0]?.code ||
      this.selectedConcept?.code ||
      '';

    const system = code
      ? this.selectedConcept?.coding?.[0]?.system ||
        this.selectedConcept?.system ||
        'KNHTS'
      : 'uncoded';

    const finalName = conceptName.trim();
    if (!finalName) {
      return;
    }

    const v = this.drugForm.getRawValue();
    this.dialogRef.close({
      name: finalName,
      code: code || '',
      system,
      categoryId: Number(v.categoryId),
      stock: Number(v.stock),
      minStock: Number(v.minStock),
      price: Number(v.price),
      expiryDate: formatDate(v.expiryDate!, 'yyyy-MM-dd', 'en-US'),
      manufacturer: v.manufacturer!.trim(),
    });
  }
}
