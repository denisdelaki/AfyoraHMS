import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { Equipment } from '../models/equipment.models';
import { AddInventoryItemPayload } from '../models/inventory.models';
import { PurchaseOrder } from '../models/purchase-order.models';
import { Supply } from '../models/supply.models';
import { Vendor } from '../models/vendor.models';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly suppliesSubject = new BehaviorSubject<Supply[]>([
    {
      id: 'SUP001',
      name: 'Surgical Gloves',
      category: 'Medical Supplies',
      stock: 450,
      minStock: 200,
      unit: 'boxes',
      price: 25.0,
      vendor: 'MedSupply Co.',
      lastOrdered: '2024-02-10',
    },
    {
      id: 'SUP002',
      name: 'Syringes (10ml)',
      category: 'Medical Supplies',
      stock: 180,
      minStock: 300,
      unit: 'packs',
      price: 15.0,
      vendor: 'HealthCare Supply',
      lastOrdered: '2024-02-15',
    },
    {
      id: 'SUP003',
      name: 'Bandages',
      category: 'Medical Supplies',
      stock: 320,
      minStock: 150,
      unit: 'boxes',
      price: 12.5,
      vendor: 'MedSupply Co.',
      lastOrdered: '2024-02-18',
    },
    {
      id: 'SUP004',
      name: 'IV Drip Sets',
      category: 'Medical Supplies',
      stock: 95,
      minStock: 100,
      unit: 'sets',
      price: 8.0,
      vendor: 'IV Solutions Inc.',
      lastOrdered: '2024-02-05',
    },
  ]);
  private readonly equipmentSubject = new BehaviorSubject<Equipment[]>([
    {
      id: 'EQ001',
      name: 'X-Ray Machine',
      category: 'Radiology',
      status: 'Operational',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-04-15',
      location: 'Radiology Dept',
      purchaseDate: '2020-06-10',
    },
    {
      id: 'EQ002',
      name: 'Ultrasound Machine',
      category: 'Diagnostics',
      status: 'Operational',
      lastMaintenance: '2024-02-01',
      nextMaintenance: '2024-05-01',
      location: 'Diagnostics',
      purchaseDate: '2021-03-20',
    },
    {
      id: 'EQ003',
      name: 'ECG Monitor',
      category: 'Cardiology',
      status: 'Under Maintenance',
      lastMaintenance: '2024-02-20',
      nextMaintenance: '2024-05-20',
      location: 'Cardiology',
      purchaseDate: '2019-11-05',
    },
  ]);
  private readonly vendorsSubject = new BehaviorSubject<Vendor[]>([
    {
      id: 'VEN001',
      name: 'MedSupply Co.',
      contact: '+1 555-2001',
      email: 'sales@medsupply.com',
      rating: 4.5,
      totalOrders: 45,
    },
    {
      id: 'VEN002',
      name: 'HealthCare Supply',
      contact: '+1 555-2002',
      email: 'info@healthcaresupply.com',
      rating: 4.8,
      totalOrders: 32,
    },
    {
      id: 'VEN003',
      name: 'IV Solutions Inc.',
      contact: '+1 555-2003',
      email: 'orders@ivsolutions.com',
      rating: 4.2,
      totalOrders: 28,
    },
  ]);
  private readonly ordersSubject = new BehaviorSubject<PurchaseOrder[]>([
    {
      id: 'PO-001',
      vendor: 'MedSupply Co.',
      items: [
        { name: 'Surgical Gloves', quantity: 200, price: 25.0 },
        { name: 'Bandages', quantity: 150, price: 12.5 },
      ],
      total: 6875,
      status: 'Pending',
      orderDate: '2024-02-22',
      expectedDate: '2024-02-28',
    },
    {
      id: 'PO-002',
      vendor: 'HealthCare Supply',
      items: [{ name: 'Syringes (10ml)', quantity: 300, price: 15.0 }],
      total: 4500,
      status: 'Delivered',
      orderDate: '2024-02-15',
      expectedDate: '2024-02-20',
    },
  ]);

  constructor() {}

  getSupplies() {
    return this.suppliesSubject.asObservable();
  }

  getLowStockSupplies() {
    return this.suppliesSubject.pipe(
      map((s) => s.filter((x) => x.stock < x.minStock)),
    );
  }

  addSupply(payload: AddInventoryItemPayload) {
    const supply: Supply = {
      id: 'SUP-' + Date.now(),
      name: payload.name.trim(),
      category: payload.category.trim(),
      stock: Number(payload.stock),
      minStock: Number(payload.minStock),
      unit: payload.unit.trim(),
      price: Number(payload.price),
      vendor: payload.vendor.trim(),
      lastOrdered: new Date().toISOString().slice(0, 10),
    };

    this.suppliesSubject.next([...this.suppliesSubject.value, supply]);
  }

  getEquipment() {
    return this.equipmentSubject.asObservable();
  }

  getVendors() {
    return this.vendorsSubject.asObservable();
  }

  getOrders() {
    return this.ordersSubject.asObservable();
  }
}
