import { Injectable } from '@angular/core';
import {
  EmployeePerformance,
  InventoryDataPoint,
  ReportDataBundle,
  ReportTypeOption,
  SummaryStatistic,
  TimeRange,
  TimeRangeOption,
  TopMedication,
} from '../models/reports.models';

@Injectable({
  providedIn: 'root',
})
export class ReportsDataService {
  getReportTypes(): ReportTypeOption[] {
    return [
      { value: 'general', label: 'General Overview', iconKey: 'barChart' },
      { value: 'patients', label: 'Patient Growth Report', iconKey: 'users' },
      { value: 'pharmacy', label: 'Pharmacy Performance', iconKey: 'pill' },
      { value: 'inventory', label: 'Inventory Status', iconKey: 'package' },
      { value: 'laboratory', label: 'Laboratory Activity', iconKey: 'flask' },
      { value: 'employees', label: 'Employee Analytics', iconKey: 'userCog' },
      { value: 'revenue', label: 'Revenue & Finance', iconKey: 'trendingUp' },
    ];
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
      { name: 'Amlodipine', dispensed: 850, revenue: 10625 },
      { name: 'Lisinopril', dispensed: 720, revenue: 10800 },
      { name: 'Metformin', dispensed: 650, revenue: 5525 },
      { name: 'Amoxicillin', dispensed: 580, revenue: 10440 },
      { name: 'Ibuprofen', dispensed: 920, revenue: 5980 },
    ];
  }

  getEmployeePerformance(): EmployeePerformance[] {
    return [
      { department: 'Doctors', headcount: 45, avgSalary: 85000, turnover: 2 },
      { department: 'Nurses', headcount: 120, avgSalary: 55000, turnover: 8 },
      {
        department: 'Lab Technicians',
        headcount: 35,
        avgSalary: 45000,
        turnover: 3,
      },
      {
        department: 'Administrative',
        headcount: 25,
        avgSalary: 38000,
        turnover: 5,
      },
      {
        department: 'Support Staff',
        headcount: 40,
        avgSalary: 32000,
        turnover: 10,
      },
    ];
  }

  getSummaryStats(): SummaryStatistic[] {
    return [
      {
        category: 'Total Revenue',
        currentValue: '$3,200,000',
        previousPeriod: '$2,613,008',
        change: '+22.5%',
        status: 'Excellent',
      },
      {
        category: 'Patient Count',
        currentValue: '3,842',
        previousPeriod: '3,416',
        change: '+12.5%',
        status: 'Good',
      },
      {
        category: 'Pharmacy Sales',
        currentValue: '$285,000',
        previousPeriod: '$247,399',
        change: '+15.2%',
        status: 'Good',
      },
      {
        category: 'Lab Tests Conducted',
        currentValue: '2,630',
        previousPeriod: '2,485',
        change: '+5.8%',
        status: 'Stable',
      },
      {
        category: 'Staff Attendance',
        currentValue: '96.5%',
        previousPeriod: '95.8%',
        change: '+0.7%',
        status: 'Excellent',
      },
      {
        category: 'Inventory Turnover',
        currentValue: '4.2x',
        previousPeriod: '4.5x',
        change: '-6.7%',
        status: 'Monitor',
      },
    ];
  }

  generateBundle(range: TimeRange): ReportDataBundle {
    return {
      patientData: this.generatePatientData(range),
      pharmacyData: this.generatePharmacyData(range),
      inventoryData: this.generateInventoryData(),
      laboratoryData: this.generateLaboratoryData(range),
      employeeData: this.generateEmployeeData(range),
      revenueData: this.generateRevenueData(range),
    };
  }

  private generatePatientData(range: TimeRange) {
    return this.generateTimeSeries(range, () => ({
      newPatients: this.random(20, 70),
      returning: this.random(50, 150),
      total: this.random(70, 220),
    }));
  }

  private generatePharmacyData(range: TimeRange) {
    return this.generateTimeSeries(range, () => ({
      prescriptions: this.random(100, 300),
      revenue: this.random(5000, 20000),
      refills: this.random(20, 100),
    }));
  }

  private generateLaboratoryData(range: TimeRange) {
    return this.generateTimeSeries(range, () => ({
      bloodTests: this.random(30, 80),
      xrays: this.random(15, 45),
      mris: this.random(5, 20),
      ctScans: this.random(10, 30),
    }));
  }

  private generateEmployeeData(range: TimeRange) {
    return this.generateTimeSeries(range, () => ({
      attendance: this.random(92, 101),
      overtime: this.random(5, 25),
      leaves: this.random(2, 10),
    }));
  }

  private generateRevenueData(range: TimeRange) {
    return this.generateTimeSeries(range, () => ({
      revenue: this.random(100000, 150000),
      expenses: this.random(60000, 90000),
      profit: this.random(40000, 60000),
    }));
  }

  private generateInventoryData(): InventoryDataPoint[] {
    return [
      {
        category: 'Medical Supplies',
        inStock: 245,
        lowStock: 12,
        outOfStock: 3,
        value: 45000,
      },
      {
        category: 'Pharmaceuticals',
        inStock: 580,
        lowStock: 25,
        outOfStock: 8,
        value: 82000,
      },
      {
        category: 'Equipment',
        inStock: 125,
        lowStock: 5,
        outOfStock: 2,
        value: 350000,
      },
      {
        category: 'Surgical Instruments',
        inStock: 320,
        lowStock: 15,
        outOfStock: 5,
        value: 68000,
      },
    ];
  }

  private generateTimeSeries<T extends object>(
    range: TimeRange,
    factory: () => T,
  ): Array<{ date: string } & T> {
    const points = range === '7days' ? 7 : range === '30days' ? 30 : 12;
    const labelPrefix =
      range === '7days' || range === '30days' ? 'Day' : 'Month';

    return Array.from({ length: points }, (_, index) => ({
      date: `${labelPrefix} ${index + 1}`,
      ...factory(),
    }));
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
