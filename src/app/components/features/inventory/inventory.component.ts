import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { combineLatest, map, startWith, BehaviorSubject, switchMap } from 'rxjs';
import { AddItemDialogComponent } from '../../dialogs/add-item-dialog/add-item-dialog.component';
import { AddVendorDialogComponent } from '../../dialogs/add-vendor-dialog/add-vendor-dialog.component';
import { AddInventoryItemPayload } from '../../../models/inventory.models';
import { Vendor } from '../../../models/vendor.models';
import { InventoryService } from '../../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    AsyncPipe,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent {
  private dialog = inject(MatDialog);
  private inventoryService = inject(InventoryService);
  private snackBar = inject(MatSnackBar);
  facilityId =
    JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
  refreshTrigger = new BehaviorSubject<void>(undefined);

  supplies$ = this.refreshTrigger.pipe(switchMap(() => this.inventoryService.getSupplies(this.facilityId)));
  lowStock$ = this.refreshTrigger.pipe(switchMap(() => this.inventoryService.getLowStockSupplies(this.facilityId)));
  equipment$ = this.refreshTrigger.pipe(switchMap(() => this.inventoryService.getEquipment(this.facilityId)));
  vendors$ = this.refreshTrigger.pipe(switchMap(() => this.inventoryService.getVendors(this.facilityId)));
  orders$ = this.refreshTrigger.pipe(switchMap(() => this.inventoryService.getOrders(this.facilityId)));

  searchControl = new FormControl('', { nonNullable: true });

  filteredSupplies$ = combineLatest([
    this.supplies$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([supplies, term]) => {
      const normalizedTerm = term.trim().toLowerCase();
      if (!normalizedTerm) {
        return supplies;
      }

      return supplies.filter(
        (supply) =>
          supply.name.toLowerCase().includes(normalizedTerm) ||
          supply.category.toLowerCase().includes(normalizedTerm),
      );
    }),
  );

  stats$ = combineLatest([
    this.supplies$,
    this.lowStock$,
    this.equipment$,
    this.vendors$,
  ]).pipe(
    map(([supplies, lowStock, equipment, vendors]) => ({
      totalItems: supplies.length,
      lowStock: lowStock.length,
      equipment: equipment.length,
      vendors: vendors.length,
    })),
  );

  openAddDialog() {
    this.inventoryService.getVendors(this.facilityId).subscribe((vendors) => {
      this.dialog
        .open(AddItemDialogComponent, {
          width: '720px',
          maxWidth: '95vw',
          data: { vendors: vendors }
        })
        .afterClosed()
        .subscribe((result: AddInventoryItemPayload | undefined) => {
          if (result) {
            if (result.type === 'Supply') {
              this.inventoryService.addSupply(result, this.facilityId).subscribe({
                next: () => {
                  this.snackBar.open('Supply added successfully', 'Close', { duration: 3000 });
                  this.refreshTrigger.next();
                },
                error: () => this.snackBar.open('Failed to add supply', 'Close', { duration: 3000 })
              });
            } else if (result.type === 'Equipment') {
              this.inventoryService.addEquipment(result, this.facilityId).subscribe({
                next: () => {
                  this.snackBar.open('Equipment added successfully', 'Close', { duration: 3000 });
                  this.refreshTrigger.next();
                },
                error: () => this.snackBar.open('Failed to add equipment', 'Close', { duration: 3000 })
              });
            }
          }
      });
    });
  }

  editItem(item: any, type: 'Supply' | 'Equipment') {
    this.inventoryService.getVendors(this.facilityId).subscribe((vendors) => {
      this.dialog
        .open(AddItemDialogComponent, {
          width: '720px',
          maxWidth: '95vw',
          data: { vendors: vendors, item: item, type: type }
        })
        .afterClosed()
        .subscribe((result: AddInventoryItemPayload | undefined) => {
          if (result) {
            if (type === 'Supply') {
              this.inventoryService.updateSupply(item.id, result, this.facilityId).subscribe({
                next: () => {
                  this.snackBar.open('Supply updated successfully', 'Close', { duration: 3000 });
                  this.refreshTrigger.next();
                },
                error: () => this.snackBar.open('Failed to update supply', 'Close', { duration: 3000 })
              });
            } else if (type === 'Equipment') {
              this.inventoryService.updateEquipment(item.id, result, this.facilityId).subscribe({
                next: () => {
                  this.snackBar.open('Equipment updated successfully', 'Close', { duration: 3000 });
                  this.refreshTrigger.next();
                },
                error: () => this.snackBar.open('Failed to update equipment', 'Close', { duration: 3000 })
              });
            }
          }
      });
    });
  }

  openAddVendorDialog(vendor?: Vendor) {
    this.dialog
      .open(AddVendorDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
        data: { vendor }
      })
      .afterClosed()
      .subscribe((result: Partial<Vendor> | undefined) => {
        if (result) {
          const obs$ = vendor
            ? this.inventoryService.updateVendor(vendor.id, result, this.facilityId)
            : this.inventoryService.addVendor(result, this.facilityId);

          obs$.subscribe({
            next: () => {
              this.snackBar.open(`Vendor ${vendor ? 'updated' : 'added'} successfully`, 'Close', { duration: 3000 });
              this.refreshTrigger.next();
            },
            error: () => this.snackBar.open(`Failed to ${vendor ? 'update' : 'add'} vendor`, 'Close', { duration: 3000 })
          });
        }
      });
  }

  reorderLowStock() {
    this.inventoryService.reorderLowStock(this.facilityId).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Successfully created purchase orders', 'Close', { duration: 5000 });
        this.refreshTrigger.next();
      },
      error: () => this.snackBar.open('Failed to reorder low stock', 'Close', { duration: 3000 })
    });
  }

  printSupplyReport() {
    this.inventoryService.printSupplyReport(this.facilityId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Supply_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Failed to generate report', 'Close', { duration: 3000 })
    });
  }

  trackById(index: number, item: any) {
    return item.id;
  }
}
