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
  AlertTriangle,
  Package,
  Plus,
  Search,
} from 'lucide-angular';
import {
  AddDrugDialogComponent,
  AddDrugPayload,
} from '../../dialogs/add-drug-dialog/add-drug-dialog.component';
import { MatIcon } from '@angular/material/icon';

type PharmacyTab = 'catalog' | 'prescriptions' | 'alerts';

type Drug = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  expiryDate: string;
  manufacturer: string;
};

type PrescriptionDrug = {
  name: string;
  quantity: number;
  dosage: string;
};

type Prescription = {
  id: string;
  patient: string;
  patientId: string;
  doctor: string;
  drugs: PrescriptionDrug[];
  status: 'Pending' | 'Dispensed';
  date: string;
};

@Component({
  selector: 'app-pharmacy',
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
  templateUrl: './pharmacy.component.html',
  styleUrl: './pharmacy.component.css',
})
export class PharmacyComponent {
  private readonly dialog = inject(MatDialog);

  readonly Search = Search;
  readonly Plus = Plus;
  readonly Package = Package;
  readonly AlertTriangle = AlertTriangle;

  searchTerm = '';
  activeTab: PharmacyTab = 'catalog';

  drugs: Drug[] = [
    {
      id: 'D001',
      name: 'Amlodipine',
      category: 'Cardiovascular',
      stock: 450,
      minStock: 100,
      price: 12.5,
      expiryDate: '2025-06-15',
      manufacturer: 'PharmaCorp',
    },
    {
      id: 'D002',
      name: 'Lisinopril',
      category: 'Cardiovascular',
      stock: 380,
      minStock: 100,
      price: 15,
      expiryDate: '2025-08-20',
      manufacturer: 'MedLife',
    },
    {
      id: 'D003',
      name: 'Metformin',
      category: 'Diabetes',
      stock: 85,
      minStock: 100,
      price: 8.5,
      expiryDate: '2024-12-30',
      manufacturer: 'HealthGen',
    },
    {
      id: 'D004',
      name: 'Amoxicillin',
      category: 'Antibiotic',
      stock: 320,
      minStock: 150,
      price: 18,
      expiryDate: '2025-03-15',
      manufacturer: 'BioPharm',
    },
    {
      id: 'D005',
      name: 'Ibuprofen',
      category: 'Pain Relief',
      stock: 45,
      minStock: 100,
      price: 6.5,
      expiryDate: '2024-11-20',
      manufacturer: 'PharmaCorp',
    },
  ];

  prescriptions: Prescription[] = [
    {
      id: 'RX001',
      patient: 'John Smith',
      patientId: 'P001',
      doctor: 'Dr. Emily Chen',
      drugs: [
        { name: 'Amlodipine 5mg', quantity: 30, dosage: 'Once daily' },
        { name: 'Lisinopril 10mg', quantity: 30, dosage: 'Once daily' },
      ],
      status: 'Pending',
      date: '2024-02-24',
    },
    {
      id: 'RX002',
      patient: 'Sarah Johnson',
      patientId: 'P002',
      doctor: 'Dr. James Wilson',
      drugs: [
        {
          name: 'Amoxicillin 500mg',
          quantity: 21,
          dosage: 'Three times daily',
        },
      ],
      status: 'Dispensed',
      date: '2024-02-23',
    },
  ];

  get filteredDrugs(): Drug[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.drugs;
    }

    return this.drugs.filter(
      (drug) =>
        drug.name.toLowerCase().includes(term) ||
        drug.category.toLowerCase().includes(term),
    );
  }

  get lowStockDrugs(): Drug[] {
    return this.drugs.filter((drug) => drug.stock < drug.minStock);
  }

  get expiringDrugs(): Drug[] {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    return this.drugs.filter((drug) => {
      const expiryDate = new Date(drug.expiryDate);
      return expiryDate <= threeMonthsFromNow;
    });
  }

  setActiveTab(tab: PharmacyTab): void {
    this.activeTab = tab;
  }

  openAddDrugDialog(): void {
    const dialogRef = this.dialog.open(AddDrugDialogComponent, {
      width: '90vw',
      maxWidth: '760px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.addDrugToCatalog(result);
    });
  }

  addDrugToCatalog(newDrug: AddDrugPayload): void {
    const nextId = `D${String(this.drugs.length + 1).padStart(3, '0')}`;

    this.drugs = [
      {
        id: nextId,
        ...newDrug,
      },
      ...this.drugs,
    ];
  }

  dispensePrescription(prescriptionId: string): void {
    this.prescriptions = this.prescriptions.map((prescription) => {
      if (prescription.id !== prescriptionId) {
        return prescription;
      }

      return {
        ...prescription,
        status: 'Dispensed',
      };
    });
  }
}
