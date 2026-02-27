import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { DashboardOverview, DashboardStat } from '../../../models';
import { DashboardService } from '../../../services';
import {
  LucideAngularModule,
  Users,
  DollarSign,
  AlertCircle,
  Package,
  FlaskConical,
  UserCheck,
  TrendingUp,
  Calendar,
} from 'lucide-angular';

type DashboardStatUi = DashboardStat & {
  icon: typeof Users;
};

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    BaseChartDirective,
    LucideAngularModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly TrendingUp = TrendingUp;
  readonly FlaskConical = FlaskConical;
  readonly UserCheck = UserCheck;
  readonly Calendar = Calendar;

  stats: DashboardStatUi[] = [
    {
      name: 'Total Patients',
      value: '1,284',
      change: '+12.5%',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Revenue (Month)',
      value: '$45,231',
      change: '+8.2%',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Bills',
      value: '23',
      change: '-3.1%',
      icon: AlertCircle,
      color: 'bg-yellow-500',
    },
    {
      name: 'Low Stock Items',
      value: '8',
      change: '+2',
      icon: Package,
      color: 'bg-red-500',
    },
  ];

  revenueData = [
    { month: 'Jan', revenue: 28000 },
    { month: 'Feb', revenue: 32000 },
    { month: 'Mar', revenue: 35000 },
    { month: 'Apr', revenue: 38000 },
    { month: 'May', revenue: 42000 },
    { month: 'Jun', revenue: 45231 },
  ];

  patientData = [
    { month: 'Jan', patients: 850 },
    { month: 'Feb', patients: 920 },
    { month: 'Mar', patients: 1050 },
    { month: 'Apr', patients: 1120 },
    { month: 'May', patients: 1200 },
    { month: 'Jun', patients: 1284 },
  ];

  pendingLabs = [
    {
      id: 'LAB001',
      patient: 'John Smith',
      test: 'Complete Blood Count',
      time: '2 hours ago',
    },
    {
      id: 'LAB002',
      patient: 'Sarah Johnson',
      test: 'Lipid Panel',
      time: '4 hours ago',
    },
    {
      id: 'LAB003',
      patient: 'Michael Brown',
      test: 'Thyroid Function',
      time: '6 hours ago',
    },
  ];

  staffOnDuty = [
    {
      name: 'Dr. Emily Chen',
      role: 'Cardiologist',
      status: 'Available',
      shift: 'Morning',
    },
    {
      name: 'Dr. James Wilson',
      role: 'Surgeon',
      status: 'In Surgery',
      shift: 'Morning',
    },
    {
      name: 'Nurse Lisa Anderson',
      role: 'ICU Nurse',
      status: 'Available',
      shift: 'Morning',
    },
    {
      name: 'Dr. Robert Taylor',
      role: 'Pediatrician',
      status: 'With Patient',
      shift: 'Morning',
    },
  ];

  upcomingAppointments = [
    {
      time: '09:00 AM',
      patient: 'Emma Davis',
      doctor: 'Dr. Chen',
      department: 'Cardiology',
    },
    {
      time: '10:30 AM',
      patient: 'Oliver Garcia',
      doctor: 'Dr. Taylor',
      department: 'Pediatrics',
    },
    {
      time: '02:00 PM',
      patient: 'Sophia Martinez',
      doctor: 'Dr. Wilson',
      department: 'Surgery',
    },
  ];

  appointmentsColumns: string[] = ['time', 'patient', 'doctor', 'department'];

  ngOnInit(): void {
    this.dashboardService.getOverview().subscribe({
      next: ({ data }) => {
        this.applyOverview(data);
      },
      error: () => {},
    });
  }

  public revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: this.revenueData.map((d) => d.month),
    datasets: [
      {
        data: this.revenueData.map((d) => d.revenue),
        label: 'Revenue',
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  public revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false } },
    },
  };

  public patientChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.patientData.map((d) => d.month),
    datasets: [
      {
        data: this.patientData.map((d) => d.patients),
        label: 'Patients',
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
    ],
  };

  public patientChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false } },
    },
  };

  private applyOverview(overview: DashboardOverview): void {
    this.stats = overview.stats.map((stat) => ({
      ...stat,
      icon: this.resolveStatIcon(stat.name),
    }));
    this.revenueData = overview.revenueData;
    this.patientData = overview.patientData;
    this.pendingLabs = overview.pendingLabs;
    this.staffOnDuty = overview.staffOnDuty;
    this.upcomingAppointments = overview.upcomingAppointments;

    this.revenueChartData = {
      labels: this.revenueData.map((entry) => entry.month),
      datasets: [
        {
          data: this.revenueData.map((entry) => entry.revenue),
          label: 'Revenue',
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
      ],
    };

    this.patientChartData = {
      labels: this.patientData.map((entry) => entry.month),
      datasets: [
        {
          data: this.patientData.map((entry) => entry.patients),
          label: 'Patients',
          backgroundColor: '#10b981',
          borderRadius: 4,
        },
      ],
    };
  }

  private resolveStatIcon(statName: string): typeof Users {
    if (statName.toLowerCase().includes('revenue')) {
      return DollarSign;
    }

    if (statName.toLowerCase().includes('bill')) {
      return AlertCircle;
    }

    if (statName.toLowerCase().includes('stock')) {
      return Package;
    }

    return Users;
  }
}
