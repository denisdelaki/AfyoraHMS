import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { PatientsService } from '../../../services';
import { EmployeeService } from '../../../services/employee.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { Drug, DrugCategory, DrugPurchaseOrder, Prescription } from '../../../models';
import { InventoryService, PharmacyService } from '../../../services';
import { Patient } from '../patients/patient.models';
import { Employee } from '../../../models/employee.model';
import { Vendor } from '../../../models/vendor.models';
import { ManageDrugCategoryDialogComponent } from '../../dialogs/manage-drug-category-dialog/manage-drug-category-dialog.component';
import { CreateDrugPurchaseOrderDialogComponent } from '../../dialogs/create-drug-purchase-order-dialog/create-drug-purchase-order-dialog.component';
import { POPreviewDialogComponent } from '../../dialogs/po-preview-dialog/po-preview-dialog.component';

type PharmacyTab = 'catalog' | 'prescriptions' | 'alerts' | 'categories' | 'purchase-orders';

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
    MatTooltipModule,
    LucideAngularModule,
    MatIcon,
  ],
  templateUrl: './pharmacy.component.html',
  styleUrl: './pharmacy.component.css',
})
export class PharmacyComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly inventoryService = inject(InventoryService);
  private readonly patientsService = inject(PatientsService);
  private readonly employeesService = inject(EmployeeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly Search = Search;
  readonly Plus = Plus;
  readonly Package = Package;
  readonly AlertTriangle = AlertTriangle;

  searchTerm = '';
  activeTab: PharmacyTab = 'catalog';

  drugs: Drug[] = [
    // {
    //   id: 'D001',
    //   name: 'Amlodipine',
    //   category: 'Cardiovascular',
    //   stock: 450,
    //   minStock: 100,
    //   price: 12.5,
    //   expiryDate: '2025-06-15',
    //   manufacturer: 'PharmaCorp',
    // },
    // {
    //   id: 'D002',
    //   name: 'Lisinopril',
    //   category: 'Cardiovascular',
    //   stock: 380,
    //   minStock: 100,
    //   price: 15,
    //   expiryDate: '2025-08-20',
    //   manufacturer: 'MedLife',
    // },
    // {
    //   id: 'D003',
    //   name: 'Metformin',
    //   category: 'Diabetes',
    //   stock: 85,
    //   minStock: 100,
    //   price: 8.5,
    //   expiryDate: '2024-12-30',
    //   manufacturer: 'HealthGen',
    // },
    // {
    //   id: 'D004',
    //   name: 'Amoxicillin',
    //   category: 'Antibiotic',
    //   stock: 320,
    //   minStock: 150,
    //   price: 18,
    //   expiryDate: '2025-03-15',
    //   manufacturer: 'BioPharm',
    // },
    // {
    //   id: 'D005',
    //   name: 'Ibuprofen',
    //   category: 'Pain Relief',
    //   stock: 45,
    //   minStock: 100,
    //   price: 6.5,
    //   expiryDate: '2024-11-20',
    //   manufacturer: 'PharmaCorp',
    // },
  ];

  categories: DrugCategory[] = [];
  patients: Patient[] = [];
  employees: Employee[] = [];
  vendors: Vendor[] = [];
  purchaseOrders: DrugPurchaseOrder[] = [];

  prescriptions: Prescription[] = [
    // {
    //   id: 'RX001',
    //   patientId: 'P001',
    //   doctorId: 'D001',
    //   drugs: [
    //     {
    //       id: 'd001',
    //       name: 'Amlodipine 5mg',
    //       quantity: 30,
    //       dosage: 'Once daily',
    //     },
    //     {
    //       id: 'd002',
    //       name: 'Lisinopril 10mg',
    //       quantity: 30,
    //       dosage: 'Once daily',
    //     },
    //   ],
    //   status: 'Pending',
    //   date: '2024-02-24',
    // },
    // {
    //   id: 'RX002',
    //   patientId: 'P002',
    //   doctorId: 'D002',
    //   drugs: [
    //     {
    //       id: 'd004',
    //       name: 'Amoxicillin 500mg',
    //       quantity: 21,
    //       dosage: 'Three times daily',
    //     },
    //   ],
    //   status: 'Dispensed',
    //   date: '2024-02-23',
    // },
  ];
  facilityId: string | number = '';

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.loadCategories();
    this.loadDrugs();
    this.loadPrescriptions();
    this.loadPatients();
    this.loadEmployees();
    this.loadVendors();
    this.loadPurchaseOrders();
  }

  private loadCategories(): void {
    this.pharmacyService.getCategories(this.facilityId).subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        this.snackBar.open('Unable to load categories.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.categories = [];
      },
    });
  }

  private loadPatients(): void {
    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: (error) => {
        this.snackBar.open('Unable to load patients.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.patients = [];
      },
    });
  }

  private loadEmployees(): void {
    this.employeesService.fetchEmployees(this.facilityId).subscribe({
      next: (data) => {
        this.employees = data;
      },
      error: (error) => {
        this.snackBar.open('Unable to load employees.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.employees = [];
      },
    });
  }

  getPatientName(patientId: string): string {
    const patient = this.patients.find((p) => p.id === patientId);
    return patient
      ? `${patient.firstName} ${patient.lastName}`
      : 'Unknown Patient';
  }

  getDoctorName(doctorId: string): string {
    const doctor = this.employees.find((e) => e.id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  }

  get filteredDrugs(): Drug[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.availableDrugs;
    }

    return this.availableDrugs.filter(
      (drug) =>
        (drug.name || '').toLowerCase().includes(term) ||
        (drug.categoryName || '').toLowerCase().includes(term),
    );
  }

  get lowStockDrugs(): Drug[] {
    return this.availableDrugs.filter(
      (drug) => Number(drug.stock) < Number(drug.minStock),
    );
  }

  get expiringDrugs(): Drug[] {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    return this.availableDrugs.filter((drug) => {
      const expiryDate = new Date(drug.expiryDate);
      return (
        !Number.isNaN(expiryDate.getTime()) && expiryDate <= threeMonthsFromNow
      );
    });
  }

  isExpired(expiryDate: string): boolean {
    const parsedExpiry = new Date(expiryDate);
    if (Number.isNaN(parsedExpiry.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedExpiry.setHours(0, 0, 0, 0);
    return parsedExpiry < today;
  }

  getExpiryStatus(expiryDate: string): 'Expired' | 'Expiring' {
    return this.isExpired(expiryDate) ? 'Expired' : 'Expiring';
  }

  getExpiryStatusClass(expiryDate: string): string {
    return this.isExpired(expiryDate) ? 'chip-expired' : 'chip-low';
  }

  /** Ignore empty records returned by the API before the template uses them. */
  private get availableDrugs(): Drug[] {
    return this.drugs.filter((drug): drug is Drug => Boolean(drug));
  }

  setActiveTab(tab: PharmacyTab): void {
    this.activeTab = tab;
  }

  openAddDrugDialog(): void {
    const dialogRef = this.dialog.open(AddDrugDialogComponent, {
      width: '90vw',
      maxWidth: '760px',
      maxHeight: '90vh',
      data: {
        categories: this.categories,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.addDrugToCatalog(result);
    });
  }

  addDrugToCatalog(newDrug: AddDrugPayload): void {
    this.pharmacyService.createDrug(newDrug, this.facilityId).subscribe({
      next: (response) => {
        const createdDrug: Drug =
          response?.data || (response as any)?.results || response;
        if (createdDrug && createdDrug.id) {
          this.drugs = [
            createdDrug,
            ...this.drugs.filter((item) => item.id !== createdDrug.id),
          ];
        } else {
          this.loadDrugs();
        }
      },
      error: () => {
        this.addDrugToCatalogLocally(newDrug);
      },
    });
  }

  private addDrugToCatalogLocally(newDrug: AddDrugPayload): void {
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
    this.pharmacyService
      .dispensePrescription(prescriptionId, this.facilityId)
      .subscribe({
        next: (dispensed) => {
          const dispensedData: Prescription =
            (dispensed as any)?.data || (dispensed as any)?.results || dispensed;
          this.prescriptions = this.prescriptions.map((prescription) =>
            prescription.id === prescriptionId
              ? {
                  ...prescription,
                  ...dispensedData,
                  status: 'Dispensed',
                }
              : prescription,
          );
          this.snackBar.open('Prescription dispensed successfully.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        error: () => {
          this.snackBar.open('Unable to dispense prescription.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
  }

  private loadDrugs(): void {
    this.pharmacyService.getDrugs(this.facilityId).subscribe({
      next: (data) => {
        this.drugs = data.filter((drug): drug is Drug => Boolean(drug));
      },
      error: () => {},
    });
  }

  private loadPrescriptions(): void {
    this.pharmacyService.getPrescriptions(this.facilityId).subscribe({
      next: (data) => {
        this.prescriptions = data;
      },
      error: () => {},
    });
  }

  openManageCategoryDialog(category?: DrugCategory): void {
    const dialogRef = this.dialog.open(ManageDrugCategoryDialogComponent, {
      width: '90vw',
      maxWidth: '500px',
      data: { category },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      if (category) {
        this.pharmacyService
          .updateCategory(category.id, result, this.facilityId)
          .subscribe({
            next: (response) => {
              const updatedCat: DrugCategory =
                (response as any)?.data || (response as any)?.results || response;
              if (updatedCat && updatedCat.id) {
                this.categories = this.categories.map((c) =>
                  c.id === updatedCat.id ? { ...c, ...updatedCat } : c,
                );
              } else {
                this.loadCategories();
              }
              this.snackBar.open('Category updated successfully', 'Close', {
                duration: 3000,
              });
            },
            error: () =>
              this.snackBar.open('Failed to update category', 'Close', {
                duration: 3000,
              }),
          });
      } else {
        this.pharmacyService.createCategory(result, this.facilityId).subscribe({
          next: (response) => {
            const createdCat: DrugCategory =
              (response as any)?.data || (response as any)?.results || response;
            if (createdCat && createdCat.id) {
              this.categories = [
                createdCat,
                ...this.categories.filter((c) => c.id !== createdCat.id),
              ];
            } else {
              this.loadCategories();
            }
            this.snackBar.open('Category created successfully', 'Close', {
              duration: 3000,
            });
          },
          error: () =>
            this.snackBar.open('Failed to create category', 'Close', {
              duration: 3000,
            }),
        });
      }
    });
  }

  deleteCategory(categoryId: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.pharmacyService
        .deleteCategory(categoryId, this.facilityId)
        .subscribe({
          next: () => {
            this.categories = this.categories.filter((c) => c.id !== categoryId);
            this.snackBar.open('Category deleted successfully', 'Close', {
              duration: 3000,
            });
          },
          error: () =>
            this.snackBar.open('Failed to delete category', 'Close', {
              duration: 3000,
            }),
        });
    }
  }

  loadVendors(): void {
    this.inventoryService.getVendors(this.facilityId).subscribe({
      next: (vendors) => (this.vendors = vendors || []),
      error: () => (this.vendors = []),
    });
  }

  loadPurchaseOrders(): void {
    this.pharmacyService.getPurchaseOrders(this.facilityId).subscribe({
      next: (pos) => (this.purchaseOrders = pos || []),
      error: () => (this.purchaseOrders = []),
    });
  }

  openCreatePurchaseOrderDialog(defaultDrug?: Drug): void {
    const dialogRef = this.dialog.open(CreateDrugPurchaseOrderDialogComponent, {
      width: '90vw',
      maxWidth: '800px',
      data: {
        facilityId: this.facilityId,
        vendors: this.vendors,
        drugs: this.drugs,
        defaultDrug,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.pharmacyService.createPurchaseOrder(result, this.facilityId).subscribe({
        next: (createdPO) => {
          const po: DrugPurchaseOrder =
            (createdPO as any)?.data || (createdPO as any)?.results || createdPO;
          if (po && po.id) {
            this.purchaseOrders = [
              po,
              ...this.purchaseOrders.filter((item) => item.id !== po.id),
            ];
          } else {
            this.loadPurchaseOrders();
          }
          this.snackBar.open('Purchase Order created successfully', 'Close', {
            duration: 3000,
          });
          this.setActiveTab('purchase-orders');
          if (po && po.id) {
            this.openPOPreviewDialog(po);
          }
        },
        error: () =>
          this.snackBar.open('Failed to create purchase order', 'Close', {
            duration: 3000,
          }),
      });
    });
  }

  openPOPreviewDialog(po: DrugPurchaseOrder): void {
    const dialogRef = this.dialog.open(POPreviewDialogComponent, {
      width: '90vw',
      maxWidth: '850px',
      data: {
        po,
        facilityId: this.facilityId,
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadPurchaseOrders();
    });
  }

  downloadPOPDF(po: DrugPurchaseOrder): void {
    this.pharmacyService.downloadPurchaseOrderPDF(po.id, this.facilityId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PO_${po.poNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () =>
        this.snackBar.open('Failed to download PDF', 'Close', { duration: 3000 }),
    });
  }

  sendPOEmail(po: DrugPurchaseOrder): void {
    const cc = prompt('Enter additional CC email addresses (comma separated) or leave blank:');
    if (cc === null) return;
    const ccEmails = cc
      ? cc.split(',').map((e) => e.trim()).filter((e) => e.length > 0)
      : [];

    this.pharmacyService
      .sendPurchaseOrderEmail(po.id, this.facilityId, ccEmails)
      .subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Email sent successfully!', 'Close', {
            duration: 4000,
          });
          this.loadPurchaseOrders();
        },
        error: () =>
          this.snackBar.open('Failed to send purchase order email', 'Close', {
            duration: 3000,
          }),
      });
  }

  deletePO(po: DrugPurchaseOrder): void {
    if (confirm(`Are you sure you want to delete purchase order ${po.poNumber}?`)) {
      this.pharmacyService.deletePurchaseOrder(po.id, this.facilityId).subscribe({
        next: () => {
          this.purchaseOrders = this.purchaseOrders.filter((item) => item.id !== po.id);
          this.snackBar.open('Purchase Order deleted successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () =>
          this.snackBar.open('Failed to delete purchase order', 'Close', {
            duration: 3000,
          }),
      });
    }
  }
}
