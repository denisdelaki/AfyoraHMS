import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  Filter,
  FlaskConical,
  LucideAngularModule,
  Package,
  Pill,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-angular';
import {
  EmployeePerformance,
  InventoryDataPoint,
  MetricCard,
  ReportDataBundle,
  ReportType,
  ReportTypeOption,
  SummaryStatistic,
  TimeRange,
  TimeRangeOption,
  TopMedication,
} from '../../../models/reports.models';
import { ReportsDataService } from '../../../services/reports-data.service';

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    LucideAngularModule,
    MatSnackBarModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly reportsDataService = inject(ReportsDataService);
  private readonly snackBar = inject(MatSnackBar);

  readonly Filter = Filter;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly TrendingUp = TrendingUp;
  readonly Pill = Pill;
  readonly Package = Package;
  readonly FlaskConical = FlaskConical;
  readonly UserCog = UserCog;
  readonly BarChart3 = BarChart3;

  readonly reportTypes: ReportTypeOption[] =
    this.reportsDataService.getReportTypes();
  readonly timeRanges: TimeRangeOption[] =
    this.reportsDataService.getTimeRangeOptions();

  selectedReport: ReportType = 'general';
  timeRange: TimeRange = '30days';
  startDate = '';
  endDate = '';
  reportGenerated = true;

  topMedications: TopMedication[] = this.reportsDataService.getTopMedications();
  employeePerformance: EmployeePerformance[] =
    this.reportsDataService.getEmployeePerformance();
  summaryStats: SummaryStatistic[] = this.reportsDataService.getSummaryStats();

  reportData!: ReportDataBundle;

  generalMetrics: MetricCard[] = [];
  patientMetrics: MetricCard[] = [];
  pharmacyMetrics: MetricCard[] = [];
  inventoryMetrics: MetricCard[] = [];
  laboratoryMetrics: MetricCard[] = [];
  employeeMetrics: MetricCard[] = [];
  revenueMetrics: MetricCard[] = [];

  patientChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  pharmacyChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  inventoryChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };
  laboratoryChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };
  employeeChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  revenueAreaChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  profitChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };
  departmentActivityChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };

  readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };

  ngOnInit(): void {
    this.generateReport();
  }

  onSelectionChange(): void {
    this.reportGenerated = false;
  }

  generateReport(): void {
    this.reportData = this.reportsDataService.generateBundle(this.timeRange);
    this.buildMetricCards();
    this.buildCharts();
    this.reportGenerated = true;
  }

  exportReport(): void {
    if (!this.reportData) {
      this.generateReport();
    }

    const workbook = XLSX.utils.book_new();
    const summaryRows = this.summaryStats.map((row) => ({
      Category: row.category,
      'Current Value': row.currentValue,
      'Previous Period': row.previousPeriod,
      Change: row.change,
      Status: row.status,
    }));

    this.appendSheet(workbook, 'Summary', summaryRows);

    if (
      this.selectedReport === 'general' ||
      this.selectedReport === 'patients'
    ) {
      this.appendSheet(workbook, 'Patients', this.reportData.patientData);
    }

    if (
      this.selectedReport === 'general' ||
      this.selectedReport === 'pharmacy'
    ) {
      this.appendSheet(workbook, 'Pharmacy', this.reportData.pharmacyData);
      this.appendSheet(
        workbook,
        'Top Medications',
        this.topMedications.map((item) => ({
          Medication: item.name,
          Dispensed: item.dispensed,
          Revenue: item.revenue,
          'Average Price': Number((item.revenue / item.dispensed).toFixed(2)),
        })),
      );
    }

    if (
      this.selectedReport === 'general' ||
      this.selectedReport === 'inventory'
    ) {
      this.appendSheet(workbook, 'Inventory', this.reportData.inventoryData);
    }

    if (
      this.selectedReport === 'general' ||
      this.selectedReport === 'laboratory'
    ) {
      this.appendSheet(workbook, 'Laboratory', this.reportData.laboratoryData);
    }

    if (
      this.selectedReport === 'general' ||
      this.selectedReport === 'employees'
    ) {
      this.appendSheet(workbook, 'Employees', this.reportData.employeeData);
      this.appendSheet(
        workbook,
        'Department Stats',
        this.employeePerformance.map((item) => ({
          Department: item.department,
          Headcount: item.headcount,
          'Average Salary': item.avgSalary,
          Turnover: item.turnover,
        })),
      );
    }

    if (
      this.selectedReport === 'general' ||
      this.selectedReport === 'revenue'
    ) {
      this.appendSheet(workbook, 'Revenue', this.reportData.revenueData);
    }

    const fileName = `${this.selectedReport}-report-${this.getDateStamp()}.xlsx`;

    try {
      XLSX.writeFile(workbook, fileName);
      this.snackBar.open(`Report exported: ${fileName}`, 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['app-snackbar-success'],
      });
    } catch {
      this.snackBar.open(
        'Failed to export report. Please try again.',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['app-snackbar-error'],
        },
      );
    }
  }

  private appendSheet<T extends object>(
    workbook: XLSX.WorkBook,
    name: string,
    rows: T[],
  ): void {
    const safeRows: object[] = rows.length
      ? [...rows]
      : [{ Message: 'No data available' }];
    const worksheet = XLSX.utils.json_to_sheet(safeRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
  }

  private getDateStamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}`;
  }

  getTimeRangeLabel(): string {
    if (this.timeRange === 'custom') {
      if (!this.startDate || !this.endDate) {
        return 'Custom Date Range';
      }
      return `${this.startDate} to ${this.endDate}`;
    }

    const map: Record<Exclude<TimeRange, 'custom'>, string> = {
      '7days': 'Last 7 Days',
      '30days': 'Last 30 Days',
      '3months': 'Last 3 Months',
      '6months': 'Last 6 Months',
      '1year': 'Last 1 Year',
    };

    return map[this.timeRange as Exclude<TimeRange, 'custom'>];
  }

  getStatusClass(status: SummaryStatistic['status']): string {
    if (status === 'Excellent' || status === 'Good') {
      return 'bg-green-100 text-green-700';
    }
    if (status === 'Stable') {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-orange-100 text-orange-700';
  }

  getIconByKey(iconKey: ReportTypeOption['iconKey'] | MetricCard['iconKey']) {
    const iconMap = {
      barChart: this.BarChart3,
      users: this.Users,
      pill: this.Pill,
      package: this.Package,
      flask: this.FlaskConical,
      userCog: this.UserCog,
      trendingUp: this.TrendingUp,
    };

    return iconMap[iconKey as keyof typeof iconMap];
  }

  private buildMetricCards(): void {
    this.generalMetrics = [
      {
        title: 'Patients',
        value: '3,842',
        change: '+12.5%',
        iconKey: 'users',
        accentClass: 'text-blue-500',
      },
      {
        title: 'Revenue',
        value: '$3.2M',
        change: '+22.5%',
        iconKey: 'trendingUp',
        accentClass: 'text-green-500',
      },
      {
        title: 'Pharmacy',
        value: '$285K',
        change: '+15.2%',
        iconKey: 'pill',
        accentClass: 'text-purple-500',
      },
      {
        title: 'Inventory',
        value: '$545K',
        iconKey: 'package',
        accentClass: 'text-yellow-500',
      },
      {
        title: 'Lab Tests',
        value: '2,630',
        iconKey: 'flask',
        accentClass: 'text-teal-500',
      },
      {
        title: 'Staff',
        value: '265',
        iconKey: 'userCog',
        accentClass: 'text-indigo-500',
      },
    ];

    this.patientMetrics = [
      {
        title: 'Total Patients',
        value: '3,842',
        change: '+12.5%',
        iconKey: 'users',
        accentClass: 'text-blue-500',
      },
      {
        title: 'New Patients',
        value: '892',
        change: '+18.3%',
        iconKey: 'trendingUp',
        accentClass: 'text-green-500',
      },
      {
        title: 'Returning',
        value: '2,950',
        change: '+10.2%',
        iconKey: 'users',
        accentClass: 'text-purple-500',
      },
    ];

    this.pharmacyMetrics = [
      {
        title: 'Revenue',
        value: '$285K',
        change: '+15.2%',
        iconKey: 'trendingUp',
        accentClass: 'text-green-500',
      },
      {
        title: 'Prescriptions',
        value: '4,520',
        change: '+8.7%',
        iconKey: 'pill',
        accentClass: 'text-purple-500',
      },
      {
        title: 'Refills',
        value: '1,450',
        change: '+5.3%',
        iconKey: 'pill',
        accentClass: 'text-blue-500',
      },
    ];

    this.inventoryMetrics = [
      {
        title: 'Total Value',
        value: '$545K',
        iconKey: 'package',
        accentClass: 'text-yellow-500',
      },
      {
        title: 'In Stock',
        value: '1,270',
        iconKey: 'package',
        accentClass: 'text-green-500',
      },
      {
        title: 'Low Stock',
        value: '57',
        iconKey: 'package',
        accentClass: 'text-orange-500',
      },
      {
        title: 'Out of Stock',
        value: '18',
        iconKey: 'package',
        accentClass: 'text-red-500',
      },
    ];

    this.laboratoryMetrics = [
      {
        title: 'Blood Tests',
        value: '1,240',
        iconKey: 'flask',
        accentClass: 'text-red-500',
      },
      {
        title: 'X-Rays',
        value: '685',
        iconKey: 'flask',
        accentClass: 'text-blue-500',
      },
      {
        title: 'MRI Scans',
        value: '285',
        iconKey: 'flask',
        accentClass: 'text-purple-500',
      },
      {
        title: 'CT Scans',
        value: '420',
        iconKey: 'flask',
        accentClass: 'text-teal-500',
      },
    ];

    this.employeeMetrics = [
      {
        title: 'Total Employees',
        value: '265',
        iconKey: 'userCog',
        accentClass: 'text-blue-500',
      },
      {
        title: 'Avg. Attendance',
        value: '96.5%',
        iconKey: 'trendingUp',
        accentClass: 'text-green-500',
      },
      {
        title: 'Turnover Rate',
        value: '10.6%',
        iconKey: 'userCog',
        accentClass: 'text-orange-500',
      },
    ];

    this.revenueMetrics = [
      {
        title: 'Total Revenue',
        value: '$3.2M',
        change: '+22.5%',
        iconKey: 'trendingUp',
        accentClass: 'text-green-500',
      },
      {
        title: 'Total Expenses',
        value: '$2.1M',
        change: '+8.3%',
        iconKey: 'trendingUp',
        accentClass: 'text-blue-500',
      },
      {
        title: 'Net Profit',
        value: '$1.1M',
        change: '+45.8%',
        iconKey: 'trendingUp',
        accentClass: 'text-purple-500',
      },
    ];
  }

  private buildCharts(): void {
    const labels = this.reportData.patientData.map((entry) => entry.date);

    this.patientChartData = {
      labels,
      datasets: [
        {
          data: this.reportData.patientData.map((entry) => entry.newPatients),
          label: 'New Patients',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.25)',
          fill: true,
          tension: 0.35,
        },
        {
          data: this.reportData.patientData.map((entry) => entry.returning),
          label: 'Returning Patients',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.20)',
          fill: true,
          tension: 0.35,
        },
      ],
    };

    this.pharmacyChartData = {
      labels: this.reportData.pharmacyData.map((entry) => entry.date),
      datasets: [
        {
          data: this.reportData.pharmacyData.map(
            (entry) => entry.prescriptions,
          ),
          label: 'Prescriptions',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.18)',
          yAxisID: 'y',
          tension: 0.35,
        },
        {
          data: this.reportData.pharmacyData.map((entry) => entry.revenue),
          label: 'Revenue ($)',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.18)',
          yAxisID: 'y1',
          tension: 0.35,
        },
      ],
    };

    this.inventoryChartData = {
      labels: this.reportData.inventoryData.map((entry) => entry.category),
      datasets: [
        {
          data: this.reportData.inventoryData.map((entry) => entry.value),
          label: 'Value ($)',
          backgroundColor: '#f59e0b',
          borderRadius: 6,
        },
      ],
    };

    this.laboratoryChartData = {
      labels: this.reportData.laboratoryData.map((entry) => entry.date),
      datasets: [
        {
          data: this.reportData.laboratoryData.map((entry) => entry.bloodTests),
          label: 'Blood Tests',
          backgroundColor: '#ef4444',
        },
        {
          data: this.reportData.laboratoryData.map((entry) => entry.xrays),
          label: 'X-Rays',
          backgroundColor: '#3b82f6',
        },
        {
          data: this.reportData.laboratoryData.map((entry) => entry.mris),
          label: 'MRI Scans',
          backgroundColor: '#8b5cf6',
        },
        {
          data: this.reportData.laboratoryData.map((entry) => entry.ctScans),
          label: 'CT Scans',
          backgroundColor: '#14b8a6',
        },
      ],
    };

    this.employeeChartData = {
      labels: this.reportData.employeeData.map((entry) => entry.date),
      datasets: [
        {
          data: this.reportData.employeeData.map((entry) => entry.attendance),
          label: 'Attendance %',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.20)',
          fill: true,
          tension: 0.35,
        },
        {
          data: this.reportData.employeeData.map((entry) => entry.overtime),
          label: 'Overtime Hours',
          borderColor: '#f59e0b',
          tension: 0.35,
        },
        {
          data: this.reportData.employeeData.map((entry) => entry.leaves),
          label: 'Leaves Taken',
          borderColor: '#ef4444',
          tension: 0.35,
        },
      ],
    };

    this.revenueAreaChartData = {
      labels: this.reportData.revenueData.map((entry) => entry.date),
      datasets: [
        {
          data: this.reportData.revenueData.map((entry) => entry.revenue),
          label: 'Revenue ($)',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.20)',
          fill: true,
          tension: 0.35,
        },
        {
          data: this.reportData.revenueData.map((entry) => entry.expenses),
          label: 'Expenses ($)',
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    };

    this.profitChartData = {
      labels: this.reportData.revenueData.map((entry) => entry.date),
      datasets: [
        {
          data: this.reportData.revenueData.map((entry) => entry.profit),
          label: 'Profit ($)',
          backgroundColor: '#8b5cf6',
          borderRadius: 6,
        },
      ],
    };

    this.departmentActivityChartData = {
      labels,
      datasets: [
        {
          data: this.reportData.patientData.map((entry) => entry.total),
          label: 'Patients',
          borderColor: '#3b82f6',
          tension: 0.35,
        },
        {
          data: this.reportData.pharmacyData.map(
            (entry) => entry.prescriptions,
          ),
          label: 'Prescriptions',
          borderColor: '#8b5cf6',
          tension: 0.35,
        },
        {
          data: this.reportData.laboratoryData.map(
            (entry) => entry.bloodTests + entry.xrays,
          ),
          label: 'Lab Tests',
          borderColor: '#14b8a6',
          tension: 0.35,
        },
      ],
    };
  }

  get inventoryData(): InventoryDataPoint[] {
    return this.reportData.inventoryData;
  }
}
