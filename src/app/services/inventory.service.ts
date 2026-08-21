import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Equipment } from '../models/equipment.models';
import { AddInventoryItemPayload } from '../models/inventory.models';
import { PurchaseOrder } from '../models/purchase-order.models';
import { Supply } from '../models/supply.models';
import { Vendor } from '../models/vendor.models';
import { apiUrl } from '../core/api.config';
import { ApiResponse, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/inventory');
  private readonly facilityStorageKeys = [
    'afyora.facilityId',
    'afyora.organizationId',
  ];
  private readonly tokenStorageKeys = [
    'afyora.accessToken',
    'accessToken',
    'access_token',
    'token',
  ];

  constructor() { }

  getSupplies(facilityId: string | number): Observable<Supply[]> {
    const params = this.buildFacilityParams(facilityId);
    return this.http
      .get<ApiResponse<Supply[]>>(`${this.baseUrl}/supplies/`, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => this.normalizeList(res.results || [])));
  }

  getLowStockSupplies(facilityId: string | number): Observable<Supply[]> {
    return this.getSupplies(facilityId).pipe(
      map((supplies) => supplies.filter((s) => s.stock < s.minStock))
    );
  }

  addSupply(payload: AddInventoryItemPayload, facilityId: string | number): Observable<Supply> {
    const params = this.buildFacilityParams(facilityId);
    const body = {
      name: payload.name.trim(),
      category: payload.category.trim(),
      stock: Number(payload.stock),
      minStock: Number(payload.minStock),
      unit: payload.unit?.trim() || '',
      price: Number(payload.price),
      vendor: payload.vendor
    };
    return this.http
      .post<ApiResponse<Supply>>(`${this.baseUrl}/supplies/`, body, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => res.data));
  }

  updateSupply(id: string | number, payload: AddInventoryItemPayload, facilityId: string | number): Observable<Supply> {
    const params = this.buildFacilityParams(facilityId);
    const body = {
      name: payload.name.trim(),
      category: payload.category.trim(),
      stock: Number(payload.stock),
      minStock: Number(payload.minStock),
      unit: payload.unit?.trim(),
      price: Number(payload.price),
      vendor: payload.vendor
    };
    return this.http
      .put<ApiResponse<Supply>>(`${this.baseUrl}/supplies/${id}/`, body, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => res.data));
  }

  getEquipment(facilityId: string | number): Observable<Equipment[]> {
    const params = this.buildFacilityParams(facilityId);
    return this.http
      .get<ApiResponse<Equipment[]>>(`${this.baseUrl}/equipment/`, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => this.normalizeList(res.results || [])));
  }

  addEquipment(payload: AddInventoryItemPayload, facilityId: string | number): Observable<Equipment> {
    const params = this.buildFacilityParams(facilityId);
    const body = {
      name: payload.name.trim(),
      category: payload.category.trim(),
      status: payload.status,
      location: payload.location?.trim(),
      lastMaintenance: payload.lastMaintenance || null,
      nextMaintenance: payload.nextMaintenance || null,
      purchaseDate: payload.purchaseDate || null
    };
    return this.http
      .post<ApiResponse<Equipment>>(`${this.baseUrl}/equipment/`, body, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => res.data));
  }

  updateEquipment(id: string | number, payload: AddInventoryItemPayload, facilityId: string | number): Observable<Equipment> {
    const params = this.buildFacilityParams(facilityId);
    const body = {
      name: payload.name.trim(),
      category: payload.category.trim(),
      status: payload.status,
      location: payload.location?.trim(),
      lastMaintenance: payload.lastMaintenance || null,
      nextMaintenance: payload.nextMaintenance || null,
      purchaseDate: payload.purchaseDate || null
    };
    return this.http
      .put<ApiResponse<Equipment>>(`${this.baseUrl}/equipment/${id}/`, body, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => res.data));
  }

  getVendors(facilityId: string | number): Observable<Vendor[]> {
    const params = this.buildFacilityParams(facilityId);
    return this.http
      .get<ApiResponse<Vendor[]>>(`${this.baseUrl}/vendors/`, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => this.normalizeList(res.results || [])));
  }

  addVendor(payload: Partial<Vendor>, facilityId: string | number): Observable<Vendor> {
    const params = this.buildFacilityParams(facilityId);
    return this.http
      .post<ApiResponse<Vendor>>(`${this.baseUrl}/vendors/`, payload, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => res.data || (res as any))); // Fallback for differing formats
  }

  updateVendor(id: string, payload: Partial<Vendor>, facilityId: string | number): Observable<Vendor> {
    const params = this.buildFacilityParams(facilityId);
    return this.http
      .put<ApiResponse<Vendor>>(`${this.baseUrl}/vendors/${id}/`, payload, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => res.data || (res as any)));
  }

  getOrders(facilityId: string | number): Observable<PurchaseOrder[]> {
    const params = this.buildFacilityParams(facilityId);
    return this.http
      .get<ApiResponse<PurchaseOrder[]>>(`${this.baseUrl}/orders/`, {
        headers: this.buildAuthHeaders(),
        params,
      })
      .pipe(map((res) => this.normalizeList(res.results || [])));
  }

  reorderLowStock(facilityId: string | number): Observable<any> {
    const params = this.buildFacilityParams(facilityId);
    return this.http.post(
      `${this.baseUrl}/supplies/reorder_low_stock/`,
      {},
      { headers: this.buildAuthHeaders(), params }
    );
  }

  printSupplyReport(facilityId: string | number): Observable<Blob> {
    const params = this.buildFacilityParams(facilityId);
    return this.http.get(`${this.baseUrl}/supplies/supply_report/`, {
      headers: this.buildAuthHeaders(),
      params,
      responseType: 'blob',
    });
  }

  private normalizeList<T>(payload: T[] | PaginatedResponse<T>): T[] {
    console.log("payload", payload)
    return Array.isArray(payload) ? payload : (payload as PaginatedResponse<T>).items || (payload as any).results || [];
  }

  private buildFacilityParams(facilityId?: string | number): HttpParams {
    if (facilityId === null || facilityId === undefined || `${facilityId}`.trim() === '') {
      return new HttpParams();
    }
    return new HttpParams().set('facility', String(facilityId));
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.getAccessTokenFromStorage();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private getAccessTokenFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    for (const key of this.tokenStorageKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim().length > 0) {
        return value;
      }
    }
    return null;
  }
}
