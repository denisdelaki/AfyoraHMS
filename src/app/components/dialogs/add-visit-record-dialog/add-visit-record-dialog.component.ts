import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Drug, QueueDestination } from '../../../models';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { PharmacyService } from '../../../services/pharmacy.service';
import { DhaAfyaConnectService } from '../../../services/dha-afyaconnect.service';
import { DHAPrescription } from '../../../models/dha-connect.models';
import { ClinicalConcept } from '../../../models';
import { KnhtsConceptSearchComponent } from '../../shared/knhts-concept-search/knhts-concept-search.component';

export type PrescriptionDrug = {
  id: string;
  name: string;
  quantity: number;
  dosage: string;
};

export type PrescriptionEntry = {
  id?: string;
  drugs: PrescriptionDrug[];
  status: 'Pending' | 'Dispensed';
  date: string;
  dhaPrescriptionCode?: string;
  dhaStatus?: string;
  dhaVerified?: boolean;
  dhaConsentToken?: string;
};

export type VisitRecordFormValue = {
  date: string;
  doctor: string;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisSystem?: string;
  diagnosisText?: string;
  prescriptions: PrescriptionEntry[];
  amountBilled: string;
  whatHappened: string;
  nextDestination?: QueueDestination;
};

export type DoctorOption = {
  id: string;
  name: string;
};

type AddVisitRecordDialogData = {
  mode: 'create' | 'edit';
  doctors: DoctorOption[];
  initialValue?: Partial<VisitRecordFormValue>;
  nextDestinations?: QueueDestination[];
  patientId?: string;
  patientName?: string;
  patientNationalId?: string;
  consentToken?: string;
};

@Component({
  selector: 'app-add-visit-record-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    KnhtsConceptSearchComponent,
  ],
  templateUrl: './add-visit-record-dialog.component.html',
  styleUrl: './add-visit-record-dialog.component.css',
})
export class AddVisitRecordDialogComponent implements OnInit {
  readonly data = inject<AddVisitRecordDialogData>(MAT_DIALOG_DATA);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly dhaService = inject(DhaAfyaConnectService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(
    MatDialogRef<
      AddVisitRecordDialogComponent,
      VisitRecordFormValue | undefined
    >,
  );
  facilityId: string | number = '';
  drugs: Drug[] = [];

  // DHA AfyaConnect ePrescription verification state
  dhaConsentToken: string = '';
  dhaInterventionCode: string = 'INT-PHARM-01';
  dhaDoctorRegNumber: string = 'KMPDC-REG-01';
  dhaVerifying = false;
  dhaVerificationResult: DHAPrescription | null = null;
  dhaVerificationError: string | null = null;

  ngOnInit(): void {
    this.dhaConsentToken = this.data.consentToken || 'TOK-SHA-9912048';
    if (this.data.initialValue?.diagnosis) {
      this.initialConcept = {
        code: this.data.initialValue.diagnosisCode || '',
        system: this.data.initialValue.diagnosisSystem || 'KNHTS',
        text: this.data.initialValue.diagnosisText || this.data.initialValue.diagnosis,
        display: this.data.initialValue.diagnosisText || this.data.initialValue.diagnosis,
        coding: [{
          code: this.data.initialValue.diagnosisCode || '',
          system: this.data.initialValue.diagnosisSystem || 'KNHTS',
          display: this.data.initialValue.diagnosisText || this.data.initialValue.diagnosis
        }]
      };
      this.selectedConcept = this.initialConcept;
    }

    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.loadDrugs();

    this.prescriptions.valueChanges.subscribe(() => {
      this.recalculateAmountBilled();
    });

    this.recalculateAmountBilled();
  }

  private loadDrugs(): void {
    this.pharmacyService.getDrugs(this.facilityId).subscribe({
      next: (data) => {
        this.drugs = data;
        this.recalculateAmountBilled();
      },
      error: () => {},
    });
  }
  readonly visitForm = this.formBuilder.group({
    date: [
      this.data.initialValue?.date ?? this.todayDateValue(),
      [Validators.required],
    ],
    doctor: [this.data.initialValue?.doctor ?? '', [Validators.required]],
    prescriptions: this.formBuilder.array(
      (this.data.initialValue?.prescriptions ?? []).map((p) =>
        this.buildPrescriptionGroup(p),
      ),
    ),
    amountBilled: [
      this.data.initialValue?.amountBilled ?? '0.00',
      [Validators.required],
    ],
    whatHappened: [
      this.data.initialValue?.whatHappened ?? '',
      [Validators.required],
    ],
    nextDestination: [
      this.data.initialValue?.nextDestination ?? '',
      this.data.nextDestinations?.length ? [Validators.required] : [],
    ],
  });

  selectedConcept: ClinicalConcept | null = null;
  initialConcept: ClinicalConcept | undefined = undefined;

  get title(): string {
    return this.data.mode === 'edit' ? 'Edit Visit Record' : 'Add Visit Record';
  }

  get submitLabel(): string {
    return this.data.mode === 'edit' ? 'Update Record' : 'Save Record';
  }

  get prescriptions(): FormArray {
    return this.visitForm.get('prescriptions') as FormArray;
  }

  drugsArray(prescriptionIndex: number): FormArray {
    return this.prescriptions.at(prescriptionIndex).get('drugs') as FormArray;
  }

  onConceptSelected(concept: ClinicalConcept | null): void {
    this.selectedConcept = concept;
  }

  addPrescription(): void {
    this.prescriptions.push(this.buildPrescriptionGroup());
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  addDrug(prescriptionIndex: number): void {
    this.drugsArray(prescriptionIndex).push(this.buildDrugGroup());
  }

  onDrugSelectionChange(prescriptionIndex: number, drugIndex: number): void {
    const drugGroup = this.drugsArray(prescriptionIndex).at(
      drugIndex,
    ) as FormGroup;
    const selectedName = String(drugGroup.get('name')?.value ?? '').trim();

    if (!selectedName) {
      drugGroup.patchValue({ id: '' }, { emitEvent: false });
      this.recalculateAmountBilled();
      return;
    }

    const selectedDrug = this.findDrugByName(selectedName);
    if (!selectedDrug) {
      return;
    }

    if (selectedDrug.stock <= 0) {
      this.snackBar.open(
        `${selectedDrug.name} is currently out of stock.`,
        'Close',
        {
          duration: 3500,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        },
      );
      drugGroup.patchValue(
        { id: '', name: '', quantity: 1 },
        { emitEvent: false },
      );
      this.recalculateAmountBilled();
      return;
    }

    if (this.isExpired(selectedDrug.expiryDate)) {
      this.snackBar.open(
        `${selectedDrug.name} is expired and cannot be prescribed.`,
        'Close',
        {
          duration: 3500,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        },
      );
      drugGroup.patchValue(
        { id: '', name: '', quantity: 1 },
        { emitEvent: false },
      );
      this.recalculateAmountBilled();
      return;
    }

    drugGroup.patchValue({ id: selectedDrug.id }, { emitEvent: false });
    this.recalculateAmountBilled();
  }

  removeDrug(prescriptionIndex: number, drugIndex: number): void {
    this.drugsArray(prescriptionIndex).removeAt(drugIndex);
  }

  checkDhaPrescription(): void {
    const rawPrescriptions = (this.prescriptions.getRawValue() as Array<{
      drugs?: Array<{ id?: string; name?: string; quantity?: number; dosage?: string }>;
    }>) ?? [];

    const allItems: { drug_name: string; dosage: string; quantity: number }[] = [];
    for (const p of rawPrescriptions) {
      for (const d of p.drugs ?? []) {
        if (d.name && d.name.trim()) {
          allItems.push({
            drug_name: d.name.trim(),
            dosage: d.dosage?.trim() || 'As directed',
            quantity: Math.max(1, Number(d.quantity || 1)),
          });
        }
      }
    }

    if (allItems.length === 0) {
      this.snackBar.open(
        'Please add at least one drug before checking with the DHA ePrescription API.',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        },
      );
      return;
    }

    const token = this.dhaConsentToken.trim() || 'TOK-SHA-9912048';
    this.dhaVerifying = true;
    this.dhaVerificationError = null;
    this.dhaVerificationResult = null;

    this.pharmacyService
      .verifyAndCreateDhaPrescription({
        consentToken: token,
        interventionCode: this.dhaInterventionCode.trim() || 'INT-PHARM-01',
        identificationNumber: this.dhaDoctorRegNumber.trim() || 'KMPDC-REG-01',
        identificationType: 'registration_number',
        regulationBody: 'KMPDC',
        items: allItems,
      })
      .subscribe({
        next: (res) => {
          this.dhaVerifying = false;
          this.dhaVerificationResult = res;
          this.snackBar.open(
            `✓ DHA ePrescription Verified & Issued! Code: ${res.code || 'PRE-SHA-OK'}`,
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
        },
        error: (err) => {
          this.dhaVerifying = false;
          const errorMsg =
            err?.error?.error ||
            err?.error?.detail ||
            err?.message ||
            'DHA ePrescription API check failed';
          this.dhaVerificationError = errorMsg;
          this.snackBar.open(
            `DHA ePrescription Check Failed: ${errorMsg}`,
            'Close',
            {
              duration: 6000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.visitForm.invalid || !this.selectedConcept) {
      this.visitForm.markAllAsTouched();
      return;
    }

    const value = this.visitForm.getRawValue();

    if (!this.validateDrugAvailability(value.prescriptions ?? [])) {
      return;
    }

    const diagnosisCode = this.selectedConcept.coding?.[0]?.code || this.selectedConcept.code || '';
    const diagnosisSystem = this.selectedConcept.coding?.[0]?.system || this.selectedConcept.system || 'KNHTS';
    const diagnosisText = this.selectedConcept.display || this.selectedConcept.text || '';

    this.dialogRef.close({
      date: value.date ?? this.todayDateValue(),
      doctor: (value.doctor ?? '').trim(),
      diagnosis: diagnosisText,
      diagnosisCode,
      diagnosisSystem,
      diagnosisText,
      prescriptions: (value.prescriptions ?? []).map((p) => ({
        id: ((p['id'] as string) ?? '').trim() || undefined,
        drugs: (
          (p['drugs'] as {
            id: string;
            name: string;
            quantity: number;
            dosage: string;
          }[]) ?? []
        ).map((d) => ({
          id: (d['id'] as string).trim(),
          name: ((d['name'] as string) ?? '').trim(),
          quantity: Number((d['quantity'] as number) ?? 1),
          dosage: ((d['dosage'] as string) ?? '').trim(),
        })),
        status: p['status'] as 'Pending' | 'Dispensed',
        date: (p['date'] as string) ?? this.todayDateValue(),
        dhaPrescriptionCode: this.dhaVerificationResult?.code,
        dhaStatus: this.dhaVerificationResult?.status || (this.dhaVerificationResult ? 'VERIFIED' : undefined),
        dhaVerified: !!this.dhaVerificationResult,
        dhaConsentToken: this.dhaConsentToken
      })),
      amountBilled: String(value.amountBilled ?? '0.00').trim(),
      whatHappened: (value.whatHappened ?? '').trim(),
      nextDestination: (value.nextDestination as QueueDestination) || undefined,
    });
  }

  private buildPrescriptionGroup(
    initial?: Partial<PrescriptionEntry>,
  ): FormGroup {
    return this.formBuilder.group({
      id: [initial?.id ?? ''],
      date: [initial?.date ?? this.todayDateValue(), [Validators.required]],
      status: [initial?.status ?? 'Pending', [Validators.required]],
      drugs: this.formBuilder.array(
        (initial?.drugs ?? [{ name: '', quantity: 1, dosage: '' }]).map((d) =>
          this.buildDrugGroup(d),
        ),
      ),
    });
  }

  private buildDrugGroup(initial?: Partial<PrescriptionDrug>): FormGroup {
    return this.formBuilder.group({
      id: [initial?.id ?? ''],
      name: [initial?.name ?? '', [Validators.required]],
      quantity: [
        initial?.quantity ?? 1,
        [Validators.required, Validators.min(1)],
      ],
      dosage: [initial?.dosage ?? '', [Validators.required]],
    });
  }

  private todayDateValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private findDrugByName(name: string): Drug | undefined {
    const normalizedName = name.trim().toLowerCase();
    return this.drugs.find(
      (drug) => drug.name.trim().toLowerCase() === normalizedName,
    );
  }

  private isExpired(expiryDate: string): boolean {
    if (!expiryDate) {
      return false;
    }

    const parsedExpiry = new Date(expiryDate);
    if (Number.isNaN(parsedExpiry.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedExpiry.setHours(0, 0, 0, 0);
    return parsedExpiry < today;
  }

  private validateDrugAvailability(
    prescriptions: Array<{
      drugs?: Array<{ name?: string; quantity?: number }>;
    }>,
  ): boolean {
    for (const prescription of prescriptions) {
      for (const rawDrug of prescription.drugs ?? []) {
        const selectedName = String(rawDrug.name ?? '').trim();
        const requestedQuantity = Number(rawDrug.quantity ?? 0);

        if (!selectedName) {
          continue;
        }

        const catalogDrug = this.findDrugByName(selectedName);
        if (!catalogDrug) {
          continue;
        }

        if (catalogDrug.stock <= 0) {
          this.snackBar.open(
            `${catalogDrug.name} is currently out of stock.`,
            'Close',
            {
              duration: 3500,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
          return false;
        }

        if (this.isExpired(catalogDrug.expiryDate)) {
          this.snackBar.open(
            `${catalogDrug.name} is expired and cannot be prescribed.`,
            'Close',
            {
              duration: 3500,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
          return false;
        }

        if (requestedQuantity > catalogDrug.stock) {
          this.snackBar.open(
            `${catalogDrug.name} has only ${catalogDrug.stock} in stock.`,
            'Close',
            {
              duration: 3500,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
          return false;
        }
      }
    }

    return true;
  }

  private recalculateAmountBilled(): void {
    const rawPrescriptions =
      (this.prescriptions.getRawValue() as Array<{
        drugs?: Array<{ id?: string; name?: string; quantity?: number }>;
      }>) ?? [];

    let totalAmount = 0;

    for (const prescription of rawPrescriptions) {
      for (const rawDrug of prescription.drugs ?? []) {
        const quantity = Math.max(0, Number(rawDrug.quantity ?? 0));
        if (quantity <= 0) {
          continue;
        }

        const byId = String(rawDrug.id ?? '').trim();
        const byName = String(rawDrug.name ?? '')
          .trim()
          .toLowerCase();
        const matchedDrug = byId
          ? this.drugs.find((drug) => drug.id === byId)
          : this.drugs.find(
              (drug) => drug.name.trim().toLowerCase() === byName,
            );

        if (!matchedDrug) {
          continue;
        }

        totalAmount += Number(matchedDrug.price ?? 0) * quantity;
      }
    }

    this.visitForm.patchValue(
      {
        amountBilled: totalAmount.toFixed(2),
      },
      { emitEvent: false },
    );
  }
}
