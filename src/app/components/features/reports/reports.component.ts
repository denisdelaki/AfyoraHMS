import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Building2,
  Calendar,
  Download,
  Edit3,
  FilePlus2,
  FileText,
  Filter,
  FlaskConical,
  Loader2,
  LucideAngularModule,
  Package,
  Pill,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-angular';
import {
  CustomReportPayload,
  EmployeePerformance,
  InventoryDataPoint,
  MetricCard,
  ReportDataBundle,
  ReportType,
  ReportTypeOption,
  SavedReport,
  SummaryStatistic,
  TimeRange,
  TimeRangeOption,
  TopMedication,
} from '../../../models/reports.models';
import { ReportsDataService } from '../../../services/reports-data.service';
import {
  ReportConfigDialogComponent,
  ReportConfigDialogData,
} from '../../dialogs/report-config-dialog/report-config-dialog.component';

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    LucideAngularModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly reportsDataService = inject(ReportsDataService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

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
  readonly ShieldCheck = ShieldCheck;
  readonly Plus = Plus;
  readonly FilePlus2 = FilePlus2;
  readonly Play = Play;
  readonly Edit3 = Edit3;
  readonly Trash2 = Trash2;
  readonly Loader2 = Loader2;
  readonly Building2 = Building2;

  userRole = 'Admin';
  facilityId: string | number = '';
  reportTypes: ReportTypeOption[] = [];
  timeRanges: TimeRangeOption[] = [];

  selectedReport: ReportType = 'general';
  timeRange: TimeRange = '30days';
  startDate = '';
  endDate = '';
  departmentFilter = '';
  reportGenerated = true;
  isLoading = false;

  savedReports: SavedReport[] = [];

  topMedications: TopMedication[] = [];
  employeePerformance: EmployeePerformance[] = [];
  summaryStats: SummaryStatistic[] = [];

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
    this.extractUserSession();
    this.timeRanges = this.reportsDataService.getTimeRangeOptions();
    this.reportTypes = this.reportsDataService.getReportTypesForRole(
      this.userRole,
    );

    if (this.reportTypes.length > 0) {
      this.selectedReport = this.reportTypes[0].value;
    }

    this.topMedications = this.reportsDataService.getTopMedications();
    this.employeePerformance =
      this.reportsDataService.getEmployeePerformance();
    this.summaryStats = this.reportsDataService.getSummaryStats();

    this.loadSavedReports();
    this.generateReport();
  }

  private extractUserSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const rawUser = localStorage.getItem('afyora.user');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        this.userRole = parsed.role || 'Admin';
        this.facilityId =
          JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
      } catch {
        this.userRole = 'Admin';
      }
    } else {
      this.facilityId =
        JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    }
  }

  get canManageCustomReports(): boolean {
    const role = this.userRole.toLowerCase().replace(/_/g, ' ');
    return role.includes('admin') || role.includes('manager');
  }

  onSelectionChange(): void {
    this.reportGenerated = false;
  }

  generateReport(): void {
    this.isLoading = true;
    this.reportsDataService
      .fetchReportData({
        selectedReport: this.selectedReport,
        timeRange: this.timeRange,
        startDate: this.startDate,
        endDate: this.endDate,
        department: this.departmentFilter,
        facilityId: this.facilityId,
      })
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.reportData = response.data;
            if (response.data.topMedications) {
              this.topMedications = response.data.topMedications;
            }
            if (response.data.employeePerformance) {
              this.employeePerformance = response.data.employeePerformance;
            }
            if (response.data.summaryStats) {
              this.summaryStats = response.data.summaryStats;
            }
          } else {
            this.reportData = this.reportsDataService.generateBundle(
              this.timeRange,
              this.departmentFilter,
            );
          }
          this.buildMetricCards();
          this.buildCharts();
          this.reportGenerated = true;
          this.isLoading = false;
        },
        error: () => {
          this.reportData = this.reportsDataService.generateBundle(
            this.timeRange,
            this.departmentFilter,
          );
          this.buildMetricCards();
          this.buildCharts();
          this.reportGenerated = true;
          this.isLoading = false;
        },
      });
  }

  loadSavedReports(): void {
    this.reportsDataService.getSavedReports(this.facilityId).subscribe({
      next: (res) => {
        if (res.data) {
          const roleLower = this.userRole.toLowerCase();
          const isAdmin = ['admin', 'superadmin', 'manager'].includes(
            roleLower,
          );

          this.savedReports = res.data.filter(
            (report) =>
              isAdmin ||
              report.allowedRoles.some(
                (r) => r.toLowerCase() === roleLower,
              ),
          );
        }
      },
    });
  }

  openCreateReportDialog(): void {
    const dialogRef = this.dialog.open(ReportConfigDialogComponent, {
      width: '640px',
      data: { mode: 'create', userRole: this.userRole } as ReportConfigDialogData,
    });

    dialogRef.afterClosed().subscribe((payload: CustomReportPayload | undefined) => {
      if (payload) {
        this.reportsDataService.createSavedReport(payload, this.facilityId).subscribe({
          next: () => {
            this.snackBar.open(
              'Custom report configuration saved successfully!',
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['app-snackbar-success'],
              },
            );
            this.loadSavedReports();
          },
        });
      }
    });
  }

  openEditReportDialog(report: SavedReport): void {
    const dialogRef = this.dialog.open(ReportConfigDialogComponent, {
      width: '640px',
      data: {
        mode: 'edit',
        report,
        userRole: this.userRole,
      } as ReportConfigDialogData,
    });

    dialogRef.afterClosed().subscribe((payload: CustomReportPayload | undefined) => {
      if (payload) {
        this.reportsDataService
          .updateSavedReport(report.id, payload, this.facilityId)
          .subscribe({
            next: () => {
              this.snackBar.open(
                'Report configuration updated successfully!',
                'Close',
                {
                  duration: 3000,
                  horizontalPosition: 'end',
                  verticalPosition: 'top',
                  panelClass: ['app-snackbar-success'],
                },
              );
              this.loadSavedReports();
            },
          });
      }
    });
  }

  runSavedReport(report: SavedReport): void {
    this.selectedReport = report.reportType;
    this.timeRange = report.timeRange;
    if (report.department) {
      this.departmentFilter = report.department;
    }
    this.generateReport();
    this.snackBar.open(`Running saved report: ${report.title}`, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  deleteSavedReport(report: SavedReport): void {
    if (!confirm(`Are you sure you want to delete "${report.title}"?`)) {
      return;
    }

    this.reportsDataService.deleteSavedReport(report.id, this.facilityId).subscribe({
      next: () => {
        this.snackBar.open('Saved report deleted', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.loadSavedReports();
      },
    });
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

    ];

    this.patientMetrics = [

    ];

    this.pharmacyMetrics = [

    ];

    this.inventoryMetrics = [

    ];

    this.laboratoryMetrics = [];

    this.employeeMetrics = [

    ];

    this.revenueMetrics = [

    ];
  }

  private generateDateRange(): string[] {
    const dates: string[] = [];
    let end = new Date();
    let start = new Date();

    if (this.startDate && this.endDate) {
      start = new Date(this.startDate);
      end = new Date(this.endDate);
    } else {
      switch (this.timeRange) {
        case '7days':
          start.setDate(start.getDate() - 7);
          break;
        case '30days':
          start.setDate(start.getDate() - 30);
          break;
        case '3months':
          start.setDate(start.getDate() - 90);
          break;
        case '6months':
          start.setDate(start.getDate() - 180);
          break;
        case '1year':
          start.setDate(start.getDate() - 365);
          break;
        default:
          start.setDate(start.getDate() - 30);
      }
    }

    // Generate dates
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  private buildCharts(): void {
    const allDates = this.generateDateRange();

    const patientMap = new Map(this.reportData.patientData?.map(e => [e.date, e]) || []);
    this.patientChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => patientMap.get(d)?.newPatients || 0),
          label: 'New Patients',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.25)',
          fill: true,
          tension: 0.35,
        },
        {
          data: allDates.map(d => patientMap.get(d)?.returning || 0),
          label: 'Returning Patients',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.20)',
          fill: true,
          tension: 0.35,
        },
      ],
    };

    const pharmacyMap = new Map(this.reportData.pharmacyData?.map(e => [e.date, e]) || []);
    this.pharmacyChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => pharmacyMap.get(d)?.prescriptions || 0),
          label: 'Prescriptions',
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.18)',
          yAxisID: 'y',
          tension: 0.35,
        },
        {
          data: allDates.map(d => pharmacyMap.get(d)?.revenue || 0),
          label: 'Revenue ($)',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.18)',
          yAxisID: 'y1',
          tension: 0.35,
        },
      ],
    };

    this.inventoryChartData = {
      labels: (this.reportData.inventoryData || []).map((entry) => entry.category),
      datasets: [
        {
          data: (this.reportData.inventoryData || []).map((entry) => entry.value),
          label: 'Value ($)',
          backgroundColor: '#f59e0b',
          borderRadius: 6,
        },
      ],
    };

    const labMap = new Map(this.reportData.laboratoryData?.map(e => [e.date, e]) || []);
    this.laboratoryChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => labMap.get(d)?.bloodTests || 0),
          label: 'Blood Tests',
          backgroundColor: '#ef4444',
        },
        {
          data: allDates.map(d => labMap.get(d)?.xrays || 0),
          label: 'X-Rays',
          backgroundColor: '#3b82f6',
        },
        {
          data: allDates.map(d => labMap.get(d)?.mris || 0),
          label: 'MRI Scans',
          backgroundColor: '#8b5cf6',
        },
        {
          data: allDates.map(d => labMap.get(d)?.ctScans || 0),
          label: 'CT Scans',
          backgroundColor: '#14b8a6',
        },
      ],
    };

    const employeeMap = new Map(this.reportData.employeeData?.map(e => [e.date, e]) || []);
    this.employeeChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => employeeMap.get(d)?.attendance || 0),
          label: 'Attendance %',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.20)',
          fill: true,
          tension: 0.35,
        },
        {
          data: allDates.map(d => employeeMap.get(d)?.overtime || 0),
          label: 'Overtime Hours',
          borderColor: '#f59e0b',
          tension: 0.35,
        },
        {
          data: allDates.map(d => employeeMap.get(d)?.leaves || 0),
          label: 'Leaves Taken',
          borderColor: '#ef4444',
          tension: 0.35,
        },
      ],
    };

    const revenueMap = new Map(this.reportData.revenueData?.map(e => [e.date, e]) || []);
    this.revenueAreaChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => revenueMap.get(d)?.revenue || 0),
          label: 'Revenue ($)',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.20)',
          fill: true,
          tension: 0.35,
        },
        {
          data: allDates.map(d => revenueMap.get(d)?.expenses || 0),
          label: 'Expenses ($)',
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    };

    this.profitChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => revenueMap.get(d)?.profit || 0),
          label: 'Profit ($)',
          backgroundColor: '#8b5cf6',
          borderRadius: 6,
        },
      ],
    };

    this.departmentActivityChartData = {
      labels: allDates,
      datasets: [
        {
          data: allDates.map(d => patientMap.get(d)?.total || 0),
          label: 'Patients',
          borderColor: '#3b82f6',
          tension: 0.35,
        },
        {
          data: allDates.map(d => pharmacyMap.get(d)?.prescriptions || 0),
          label: 'Prescriptions',
          borderColor: '#8b5cf6',
          tension: 0.35,
        },
        {
          data: allDates.map(d => 
            (labMap.get(d)?.bloodTests || 0) + 
            (labMap.get(d)?.xrays || 0) + 
            (labMap.get(d)?.mris || 0) + 
            (labMap.get(d)?.ctScans || 0)
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

