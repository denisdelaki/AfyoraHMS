import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse } from '../models/api.models';
import {
  CustomReportPayload,
  EmployeePerformance,
  InventoryDataPoint,
  ReportDataBundle,
  ReportFilterParams,
  ReportTypeOption,
  SavedReport,
  SummaryStatistic,
  TimeRange,
  TimeRangeOption,
  TopMedication,
} from '../models/reports.models';

@Injectable({
  providedIn: 'root',
})
export class ReportsDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/reports');
  private readonly savedReportsStorageKey = 'afyora.saved_reports';

  private readonly initialSavedReports: SavedReport[] = [
    {
      id: 'sr-1',
      title: 'Executive Monthly Growth',
      description: 'Patient acquisition and revenue trends for executive reviews.',
      reportType: 'general',
      timeRange: '30days',
      chartType: 'line',
      allowedRoles: ['Admin', 'SuperAdmin', 'Manager'],
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'sr-2',
      title: 'Pharmacy Inventory Alert',
      description: 'Monitors low stock items and prescription sales volume.',
      reportType: 'pharmacy',
      timeRange: '7days',
      chartType: 'bar',
      allowedRoles: ['Admin', 'Pharmacist', 'Manager'],
      createdAt: '2026-02-01T14:30:00Z',
    },
    {
      id: 'sr-3',
      title: 'Laboratory Workload Summary',
      description: 'Daily test throughput across diagnostic departments.',
      reportType: 'laboratory',
      timeRange: '30days',
      chartType: 'bar',
      allowedRoles: ['Admin', 'Lab Technician', 'Doctor'],
      createdAt: '2026-02-10T09:15:00Z',
    },
  ];

  getReportTypes(): ReportTypeOption[] {
    return [
      {
        value: 'general',
        label: 'General Overview',
        iconKey: 'barChart',
        description: 'Comprehensive cross-department analytics',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'Doctor', 'Nurse', 'Accountant', 'HR'],
      },
      {
        value: 'patients',
        label: 'Patient Growth Report',
        iconKey: 'users',
        description: 'New vs returning patient trends',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'Doctor', 'Nurse', 'Receptionist'],
      },
      {
        value: 'pharmacy',
        label: 'Pharmacy Performance',
        iconKey: 'pill',
        description: 'Prescription counts, top medications, and sales',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'Pharmacist', 'Accountant'],
      },
      {
        value: 'inventory',
        label: 'Inventory Status',
        iconKey: 'package',
        description: 'Stock levels, valuation, and out-of-stock items',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'Pharmacist', 'Lab Technician'],
      },
      {
        value: 'laboratory',
        label: 'Laboratory Activity',
        iconKey: 'flask',
        description: 'Diagnostic test counts (Blood, X-Ray, MRI, CT)',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'Lab Technician', 'Doctor'],
      },
      {
        value: 'employees',
        label: 'Employee Analytics',
        iconKey: 'userCog',
        description: 'Headcount, attendance, and turnover by department',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'HR'],
      },
      {
        value: 'revenue',
        label: 'Revenue & Finance',
        iconKey: 'trendingUp',
        description: 'Income, expenditure, and net profit margins',
        allowedRoles: ['Admin', 'SuperAdmin', 'Manager', 'Accountant'],
      },
    ];
  }

  getReportTypesForRole(userRole?: string): ReportTypeOption[] {
    const all = this.getReportTypes();
    if (!userRole) return all;

    const normalizedRole = userRole.trim().toLowerCase().replace(/_/g, ' ');
    if (
      normalizedRole.includes('admin') ||
      normalizedRole.includes('manager')
    ) {
      return all;
    }

    return all.filter((option) =>
      option.allowedRoles?.some((role) => {
        const rLower = role.toLowerCase().replace(/_/g, ' ');
        return rLower === normalizedRole || normalizedRole.includes(rLower);
      }),
    );
  }

  getTimeRangeOptions(): TimeRangeOption[] {
    return [
      { value: '7days', label: 'Last 7 Days' },
      { value: '30days', label: 'Last 30 Days' },
      { value: '3months', label: 'Last 3 Months' },
      { value: '6months', label: 'Last 6 Months' },
      { value: '1year', label: 'Last 1 Year' },
      { value: 'custom', label: 'Custom Range' },
    ];
  }

  getTopMedications(): TopMedication[] {
    return [

    ];
  }

  getEmployeePerformance(): EmployeePerformance[] {
    return [

    ];
  }

  getSummaryStats(): SummaryStatistic[] {
    return [

    ];
  }

  fetchReportData(
    params: ReportFilterParams,
  ): Observable<ApiResponse<ReportDataBundle>> {
    let httpParams = new HttpParams()
      .set('reportType', params.selectedReport)
      .set('timeRange', params.timeRange);

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }
    if (params.department) {
      httpParams = httpParams.set('department', params.department);
    }
    if (params.facilityId) {
      httpParams = httpParams.set('facilityId', String(params.facilityId));
    }

    return this.http
      .get<ApiResponse<ReportDataBundle>>(`${this.baseUrl}/data/`, {
        params: httpParams,
      })
      .pipe(
        catchError(() => {
          const fallbackData = this.generateBundle(
            params.timeRange,
            params.department,
          );
          return of({
            success: true,
            message: 'Report data retrieved',
            data: fallbackData,
          });
        }),
      );
  }

  getSavedReports(
    facilityId?: string | number,
  ): Observable<ApiResponse<SavedReport[]>> {
    let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', String(facilityId));
    }

    return this.http
      .get<ApiResponse<SavedReport[]>>(`${this.baseUrl}/saved/`, { params })
      .pipe(
        catchError(() => {
          const stored = this.getLocalSavedReports(facilityId);
          return of({
            success: true,
            message: 'Saved reports loaded',
            data: stored,
          });
        }),
      );
  }

  createSavedReport(
    payload: CustomReportPayload,
    facilityId?: string | number,
  ): Observable<ApiResponse<SavedReport>> {
    return this.http
      .post<ApiResponse<SavedReport>>(`${this.baseUrl}/saved/`, {
        ...payload,
        facilityId,
      })
      .pipe(
        catchError(() => {
          const newReport: SavedReport = {
            id: `sr-${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString(),
          };
          const current = this.getLocalSavedReports(facilityId);
          const updated = [newReport, ...current];
          this.setLocalSavedReports(updated, facilityId);
          return of({
            success: true,
            message: 'Saved report created successfully',
            data: newReport,
          });
        }),
      );
  }

  updateSavedReport(
    id: string,
    payload: Partial<CustomReportPayload>,
    facilityId?: string | number,
  ): Observable<ApiResponse<SavedReport>> {
    return this.http
      .put<ApiResponse<SavedReport>>(`${this.baseUrl}/saved/${id}/`, {
        ...payload,
        facilityId,
      })
      .pipe(
        catchError(() => {
          const current = this.getLocalSavedReports(facilityId);
          const index = current.findIndex((item) => item.id === id);
          let updatedReport: SavedReport;

          if (index !== -1) {
            updatedReport = {
              ...current[index],
              ...payload,
              updatedAt: new Date().toISOString(),
            };
            current[index] = updatedReport;
          } else {
            updatedReport = {
              id,
              title: payload.title || 'Updated Report',
              description: payload.description || '',
              reportType: payload.reportType || 'general',
              timeRange: payload.timeRange || '30days',
              department: payload.department,
              chartType: payload.chartType || 'line',
              allowedRoles: payload.allowedRoles || ['Admin'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            current.unshift(updatedReport);
          }

          this.setLocalSavedReports(current, facilityId);
          return of({
            success: true,
            message: 'Saved report updated successfully',
            data: updatedReport,
          });
        }),
      );
  }

  deleteSavedReport(
    id: string,
    facilityId?: string | number,
  ): Observable<ApiResponse<null>> {
    let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', String(facilityId));
    }

    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/saved/${id}/`, { params })
      .pipe(
        catchError(() => {
          const current = this.getLocalSavedReports(facilityId);
          const filtered = current.filter((item) => item.id !== id);
          this.setLocalSavedReports(filtered, facilityId);
          return of({
            success: true,
            message: 'Saved report deleted',
            data: null,
          });
        }),
      );
  }

  generateBundle(range: TimeRange, department?: string): ReportDataBundle {
    return {
      patientData: [],
      pharmacyData: [],
      inventoryData: [],
      laboratoryData: [],
      employeeData: [],
      revenueData: [],
    };
  }

  private getLocalSavedReports(facilityId?: string | number): SavedReport[] {
    if (typeof localStorage === 'undefined') {
      return this.initialSavedReports;
    }
    const key = facilityId
      ? `${this.savedReportsStorageKey}_${facilityId}`
      : this.savedReportsStorageKey;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(this.initialSavedReports));
      return this.initialSavedReports;
    }
    try {
      return JSON.parse(raw) as SavedReport[];
    } catch {
      return this.initialSavedReports;
    }
  }

  private setLocalSavedReports(
    reports: SavedReport[],
    facilityId?: string | number,
  ): void {
    if (typeof localStorage !== 'undefined') {
      const key = facilityId
        ? `${this.savedReportsStorageKey}_${facilityId}`
        : this.savedReportsStorageKey;
      localStorage.setItem(key, JSON.stringify(reports));
    }
  }
}

