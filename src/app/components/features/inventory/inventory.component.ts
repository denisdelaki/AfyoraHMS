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
import { combineLatest, map, startWith } from 'rxjs';
import { AddItemDialogComponent } from '../../dialogs/add-item-dialog/add-item-dialog.component';
import { AddInventoryItemPayload } from '../../../models/inventory.models';
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
    AsyncPipe,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent {
  private dialog = inject(MatDialog);
  private inventoryService = inject(InventoryService);

  supplies$ = this.inventoryService.getSupplies();
  lowStock$ = this.inventoryService.getLowStockSupplies();
  equipment$ = this.inventoryService.getEquipment();
  vendors$ = this.inventoryService.getVendors();
  orders$ = this.inventoryService.getOrders();
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
    this.dialog
      .open(AddItemDialogComponent, { width: '720px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((result: AddInventoryItemPayload | undefined) => {
        if (result?.type === 'Supply') {
          this.inventoryService.addSupply(result);
        }
      });
  }

  trackById(index: number, item: any) {
    return item.id;
  }
}
