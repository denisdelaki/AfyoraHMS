import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import {
  Activity,
  Calendar,
  ClipboardList,
  DollarSign,
  FlaskConical,
  LucideAngularModule,
  LucideIconData,
  Package,
  Scan,
  UserCheck,
  Users,
} from 'lucide-angular';
import {
  AppointmentsService,
  DashboardService,
  LaboratoryService,
  PharmacyService,
  RadiologyService,
  BillingService,
  PatientsService,
} from '../../../services';
import { EmployeeService } from '../../../services/employee.service';
import {
  DashboardOverview,
  DashboardStat,
  Drug,
  LabRequest,
  Prescription,
  RadiologyOrder,
} from '../../../models';
import { DepartmentService } from '../../../services/department.service';
import { TransformIdsPipe } from '../../../shared/pipes/transform-ids.pipe';

type DashboardStatUi = DashboardStat & { icon: LucideIconData };
type StoredUser = {
  id?: string | number;
  fullName?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  facility?: string | number;
  department?: string;
};
type DashboardProfile = {
  label: string;
  summary: string;
  showFacilityOverview: boolean;
  showAppointments: boolean;
  showLabs: boolean;
  showPharmacy: boolean;
  showRadiology: boolean;
  showTeam: boolean;
  showBilling?: boolean;
  showEmployees?: boolean;
  showPatientSummary?: boolean;
};
type WorkItem = { id: string; title: string; detail: string; status: string };
type DashboardAction = {
  title: string;
  description: string;
  link: string;
  icon: LucideIconData;
};
type ProfileOptions = Omit<DashboardProfile, 'label'>;

const ROLE_PROFILES: Record<string, ProfileOptions> = {
  admin: {
    summary: 'You have a complete view of facility operations.',
    showFacilityOverview: true,
    showAppointments: true,
    showLabs: true,
    showPharmacy: true,
    showRadiology: true,
    showTeam: true,
  },
  facility_admin: {
    summary: 'You have a complete view of facility operations.',
    showFacilityOverview: true,
    showAppointments: true,
    showLabs: true,
    showPharmacy: true,
    showRadiology: true,
    showTeam: true,
  },
  manager: {
    summary: 'Monitor activity, staff coverage, and department workloads.',
    showFacilityOverview: true,
    showAppointments: true,
    showLabs: true,
    showPharmacy: true,
    showRadiology: true,
    showTeam: true,
  },
  doctor: {
    summary: 'Review your schedule and clinical work linked to your patients.',
    showFacilityOverview: false,
    showAppointments: true,
    showLabs: true,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
    showPatientSummary: true,
  },
  nurse: {
    summary: 'Focus on today’s patient schedule and your assigned shift.',
    showFacilityOverview: false,
    showAppointments: true,
    showLabs: false,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
    showPatientSummary: true,
  },
  receptionist: {
    summary: 'Register patients, schedule care, and support front-desk visits.',
    showFacilityOverview: false,
    showAppointments: true,
    showLabs: false,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
    showPatientSummary: true,
  },
  pharmacist: {
    summary: 'Monitor prescriptions, medicine stock, and your shift.',
    showFacilityOverview: false,
    showAppointments: false,
    showLabs: false,
    showPharmacy: true,
    showRadiology: false,
    showTeam: false,
  },
  lab_technician: {
    summary: 'Work through the laboratory queue and your department shift.',
    showFacilityOverview: false,
    showAppointments: false,
    showLabs: true,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
    showPatientSummary: true,
  },
  radiologist: {
    summary: 'Review imaging requests, report-ready studies, and your shift.',
    showFacilityOverview: false,
    showAppointments: false,
    showLabs: false,
    showPharmacy: false,
    showRadiology: true,
    showTeam: false,
    showPatientSummary: true,
  },
  accountant: {
    summary: 'Manage invoices, payments, and outstanding balances.',
    showFacilityOverview: false,
    showAppointments: false,
    showLabs: false,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
    showBilling: true,
  },
  hr: {
    summary:
      'Manage staff records, staffing coverage, and employee operations.',
    showFacilityOverview: false,
    showAppointments: false,
    showLabs: false,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
    showEmployees: true,
  },
  staff: {
    summary: 'Here is the work and shift information relevant to you today.',
    showFacilityOverview: false,
    showAppointments: false,
    showLabs: false,
    showPharmacy: false,
    showRadiology: false,
    showTeam: false,
  },
};

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    BaseChartDirective,
    LucideAngularModule,
    TransformIdsPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly labService = inject(LaboratoryService);
  private readonly appointmentService = inject(AppointmentsService);
  private readonly pharmacyService = inject(PharmacyService);
  private readonly radiologyService = inject(RadiologyService);
  private readonly billingService = inject(BillingService);
  private readonly patientsService = inject(PatientsService);
  private readonly employeesService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  employees: any[] = [];
  departments: any[] = [];
  labTests: any[] = [];
  patients: any[] = [];

  readonly Calendar = Calendar;
  readonly ClipboardList = ClipboardList;
  readonly UserCheck = UserCheck;
  readonly Users = Users;
  currentTimeOfDay = signal(
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  );
  facilityId: string | number = '';
  userName = 'there';
  userDepartment = 'Not assigned';
  userShift = 'Not assigned';
  role = 'staff';
  private userId = '';
  profile: DashboardProfile = {
    label: 'Team Member',
    ...ROLE_PROFILES['staff'],
  };
  stats: DashboardStatUi[] = [];
  private operationalStats: DashboardStatUi[] = [];
  private patientsOnboarded = 0;
  private patientsSeenToday = 0;
  workItems: WorkItem[] = [];
  workQueueTitle = 'My work queue';
  workQueueLink = '/dashboard';
  actions: DashboardAction[] = [];
  pharmacyPrescriptions: Prescription[] = [];
  pharmacyDrugs: Drug[] = [];
  teamOnDuty: Array<{ name: string; role: string; status: string }> = [];
  upcomingAppointments: Array<{
    time: string;
    patient: string;
    doctor: string;
    department: string;
  }> = [];
  revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };
  patientChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };
  readonly revenueChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
  };
  readonly patientChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
  };
  now: Date = new Date();
  today: string = `${this.now.getFullYear()}-${String(
    this.now.getMonth() + 1,
  ).padStart(2, '0')}-${String(this.now.getDate()).padStart(2, '0')}`;

  ngOnInit(): void {
    const user = this.readStoredUser();
    this.facilityId = user.facility ?? '';
    this.userName = this.getUserName(user) || 'there';
    this.userId = String(user.id ?? '');
    this.role = this.normalizeRole(user.role);
    this.profile = {
      label: this.roleLabel(this.role),
      ...(ROLE_PROFILES[this.role] ?? ROLE_PROFILES['staff']),
    };
    this.actions = this.getActions(this.role);
    this.userDepartment = user.department || 'Not assigned';
    this.loadDepartments();
    this.fetchAllEmployees(
      this.facilityId ? String(this.facilityId) : '',
      user,
    );
    if (this.profile.showFacilityOverview)
      this.dashboardService
        .getOverview()
        .subscribe({ next: ({ data }) => this.applyOverview(data) });
    if (this.profile.showPatientSummary) this.loadPatientSummary();
    if (this.profile.showPharmacy) this.loadPharmacyQueue();
    if (this.profile.showRadiology) this.loadRadiologyQueue();
    if (this.profile.showBilling) this.loadBillingQueue();
  }

  get hasCharts(): boolean {
    return (
      this.profile.showFacilityOverview &&
      this.revenueChartData.datasets.length > 0
    );
  }

  private loadDepartments(): void {
    this.departmentService.fetchDepartments(this.facilityId).subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: () => {
        this.departments = [];
      },
    });
  }

  private fetchAllEmployees(facilityId: string, user: StoredUser): void {
    if (!facilityId) {
      this.loadEmployeeDependentData(user);
      return;
    }
    this.employeesService.fetchEmployees(facilityId).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.loadEmployeeDependentData(user);
      },
      error: () => {
        this.loadEmployeeDependentData(user);
      },
    });
  }

  private loadEmployeeDependentData(user: StoredUser): void {
    this.loadShiftAndTeam(user);
    if (this.profile.showAppointments) this.loadAppointments(user);
    if (this.profile.showLabs) this.loadLabQueue(user);
    if (this.profile.showEmployees) this.loadEmployeeQueue();
  }

  private loadShiftAndTeam(user: StoredUser): void {
    if (!this.facilityId) return;
    const me = this.employees.find(
      (employee) =>
        String(employee.id) === String(user.id) ||
        employee.email?.toLowerCase() === user.email?.toLowerCase() ||
        employee.name?.toLowerCase() === this.userName.toLowerCase(),
    );
    this.userDepartment = me?.department || this.userDepartment;
    this.userShift = me?.shift || 'Not assigned';
    if (this.profile.showTeam)
      this.teamOnDuty = this.employees
        .filter(
          (employee) =>
            employee.shift?.toLowerCase() === this.currentShift().toLowerCase(),
        )
        .slice(0, 5)
        .map((employee) => ({
          name: employee.name,
          role: employee.role,
          status: employee.status || 'On duty',
        }));
  }

  private loadBillingQueue(): void {
    if (!this.facilityId) return;

    this.billingService.getInvoices(this.facilityId).subscribe({
      next: (response) => {
        const invoices = response.results?.items ?? response.data?.items ?? [];
        const outstanding = invoices.filter(
          (invoice) =>
            invoice.status === 'Pending' || invoice.status === 'Overdue',
        );
        this.workQueueTitle = 'Outstanding invoices';
        this.workQueueLink = '/billing';
        this.workItems = outstanding.slice(0, 5).map((invoice) => ({
          id: invoice.id,
          title: invoice.patient,
          detail: `KES ${invoice.total.toLocaleString()} · ${invoice.date}`,
          status: invoice.status,
        }));
        this.stats = [
          this.stat(
            'Paid Invoices',
            invoices.filter((invoice) => invoice.status === 'Paid').length,
            'Received payments',
            'bg-green-500',
            DollarSign,
          ),
          this.stat(
            'Outstanding Invoices',
            outstanding.length,
            'Pending or overdue',
            'bg-amber-500',
            ClipboardList,
          ),
          this.stat(
            'Outstanding Amount',
            outstanding.reduce((sum, invoice) => sum + invoice.total, 0),
            'Requires follow-up',
            'bg-red-500',
            DollarSign,
          ),
        ];
      },
      error: () => {
        this.workItems = [];
      },
    });
  }

  private loadEmployeeQueue(): void {
    if (!this.facilityId) return;

    this.workQueueTitle = 'Employee directory';
    this.workQueueLink = '/employees';
    this.workItems = this.employees.slice(0, 5).map((employee) => ({
      id: employee.id,
      title: employee.name,
      detail: `${employee.role} · ${employee.department}`,
      status: employee.status || 'Active',
    }));
    this.stats = [
      this.stat(
        'Total Employees',
        this.employees.length,
        'Staff records',
        'bg-blue-500',
        Users,
      ),
      this.stat(
        'On Duty',
        this.employees.filter(
          (employee) =>
            employee.shift?.toLowerCase() === this.currentShift().toLowerCase(),
        ).length,
        'Current shift',
        'bg-green-500',
        UserCheck,
      ),
      this.stat(
        'Departments',
        new Set(
          this.employees.map((employee) => employee.department).filter(Boolean),
        ).size,
        'Active teams',
        'bg-violet-500',
        ClipboardList,
      ),
    ];
  }

  private todayDate: Date = new Date(`${this.today}T00:00:00`);

  private loadPatientSummary(): void {
    if (!this.facilityId) return;

    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        this.patientsOnboarded = patients.length;
        this.refreshPatientStats();
      },
    });
  }

  private loadAppointments(user: StoredUser): void {
    if (!this.facilityId) return;
    this.appointmentService.getAppointments(this.facilityId).subscribe({
      next: (appointments) => {
        const currentUser = this.employees.find(
          (employee) =>
            String(employee.id) === this.userId ||
            employee.email?.toLowerCase() === user.email?.toLowerCase() ||
            employee.name?.toLowerCase() === this.userName.toLowerCase(),
        );
        const currentUserId = String(currentUser?.id ?? this.userId);
        const currentUserName = currentUser?.name ?? this.userName;
        const relevant = [
          'doctor',
          'nurse',
          'lab_technician',
          'radiologist',
        ].includes(this.role)
          ? appointments.filter(
              (appointment) =>
                (!!currentUserId &&
                  String(appointment.doctor) === currentUserId) ||
                appointment.doctor
                  ?.toLowerCase()
                  .includes(currentUserName.toLowerCase()),
            )
          : appointments;

        this.upcomingAppointments = relevant
          .filter(
            (appointment) =>
              this.appointmentDateTime(appointment) >= this.todayDate,
          )
          .sort(
            (a, b) =>
              this.appointmentDateTime(a).getTime() -
              this.appointmentDateTime(b).getTime(),
          )
          .slice(0, 5)
          .map((appointment) => ({
            time: this.formatAppointmentTime(appointment.time),
            patient: `${appointment.firstName} ${appointment.lastName}`,
            doctor: appointment.doctor,
            department: appointment.department,
          }));
        this.patientsSeenToday = relevant.filter(
          (appointment) =>
            appointment.date === this.today &&
            appointment.status === 'Completed',
        ).length;
        if (!this.profile.showFacilityOverview)
          this.setOperationalStats([
            this.stat(
              "Today's Appointments",
              this.upcomingAppointments.length,
              'Scheduled',
              'bg-blue-500',
              Calendar,
            ),
          ]);
      },
      error: () => {
        this.upcomingAppointments = [];
      },
    });
  }

  private loadLabQueue(user: StoredUser): void {
    this.labService.getRequests().subscribe((requests) => {
      this.labTests = requests;
      const currentUser = this.employees.find(
        (employee) =>
          String(employee.id) === this.userId ||
          employee.email?.toLowerCase() === user.email?.toLowerCase() ||
          employee.name?.toLowerCase() === this.userName.toLowerCase(),
      );
      const currentUserId = String(currentUser?.id ?? this.userId);
      const relevant =
        this.role.includes('doctor') || this.role.includes('lab_technician')
          ? requests.filter(
              (request) =>
                !!currentUserId && String(request.orderedBy) === currentUserId,
            )
          : requests;
      this.workQueueTitle =
        this.role === 'doctor' ? 'My lab orders' : 'Laboratory work queue';
      this.workQueueLink = '/laboratory';
      this.workItems = relevant
        .filter(
          (request) => !['Approved', 'Completed'].includes(request.status),
        )
        .slice(0, 5)
        .map((request) => this.labItem(request));
      if (!this.profile.showFacilityOverview)
        this.setOperationalStats([
          this.stat(
            'Pending Tests',
            relevant.filter((request) => request.status === 'Pending').length,
            'Awaiting work',
            'bg-amber-500',
            FlaskConical,
          ),
          this.stat(
            'In Progress',
            relevant.filter((request) => request.status === 'In Progress')
              .length,
            'Being processed',
            'bg-blue-500',
            Activity,
          ),
          this.stat(
            'Completed',
            relevant.filter((request) =>
              ['Completed', 'Approved'].includes(request.status),
            ).length,
            'Results ready',
            'bg-green-500',
            ClipboardList,
          ),
        ]);
    });
  }

  private loadPharmacyQueue(): void {
    if (!this.facilityId) return;
    this.pharmacyService
      .getPrescriptions(this.facilityId)
      .subscribe((prescriptions) => {
        this.pharmacyPrescriptions = prescriptions;
        this.workQueueTitle = 'Pending prescriptions';
        this.workQueueLink = '/pharmacy';
        this.workItems = prescriptions
          .filter((item) => item.status === 'Pending')
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            title: `Prescription ${item.id}`,
            detail: `${item.drugs.length} medicine${item.drugs.length === 1 ? '' : 's'} · ${item.date}`,
            status: item.status,
          }));
        this.applyPharmacyStats();
      });
    this.pharmacyService.getDrugs(this.facilityId).subscribe((drugs) => {
      this.pharmacyDrugs = drugs;
      this.applyPharmacyStats();
    });
  }

  private applyPharmacyStats(): void {
    this.stats = [
      this.stat(
        'Pending Prescriptions',
        this.pharmacyPrescriptions.filter((item) => item.status === 'Pending')
          .length,
        'Awaiting dispensing',
        'bg-blue-500',
        ClipboardList,
      ),
      this.stat(
        'Dispensed',
        this.pharmacyPrescriptions.filter((item) => item.status === 'Dispensed')
          .length,
        'Completed',
        'bg-green-500',
        UserCheck,
      ),
      this.stat(
        'Low Stock Items',
        this.pharmacyDrugs.filter((drug) => drug.stock <= drug.minStock).length,
        'Needs attention',
        'bg-red-500',
        Package,
      ),
    ];
  }
  private loadRadiologyQueue(): void {
    if (!this.facilityId) return;
    this.radiologyService.getOrders(this.facilityId).subscribe((orders) => {
      this.workQueueTitle = 'Imaging work queue';
      this.workQueueLink = '/radiology';
      this.workItems = orders
        .filter(
          (order) => !['Completed', 'Report Ready'].includes(order.status),
        )
        .slice(0, 5)
        .map((order) => this.radiologyItem(order));
      this.setOperationalStats([
        this.stat(
          'Pending Studies',
          orders.filter((order) => order.status === 'Pending').length,
          'Awaiting review',
          'bg-amber-500',
          Scan,
        ),
        this.stat(
          'In Progress',
          orders.filter((order) => order.status === 'In Progress').length,
          'Being processed',
          'bg-blue-500',
          Activity,
        ),
        this.stat(
          'Report Ready',
          orders.filter((order) => order.status === 'Report Ready').length,
          'Ready to finalize',
          'bg-green-500',
          ClipboardList,
        ),
      ]);
    });
  }

  private applyOverview(overview: DashboardOverview): void {
    this.stats = overview.stats.map((stat) => ({
      ...stat,
      icon: this.iconFor(stat.name),
    }));
    this.revenueChartData = {
      labels: overview.revenueData.map((item) => item.month),
      datasets: [
        {
          data: overview.revenueData.map((item) => item.revenue),
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
      labels: overview.patientData.map((item) => item.month),
      datasets: [
        {
          data: overview.patientData.map((item) => item.patients),
          label: 'Patients',
          backgroundColor: '#10b981',
          borderRadius: 4,
        },
      ],
    };
  }

  private setOperationalStats(stats: DashboardStatUi[]): void {
    this.operationalStats = stats;
    this.refreshPatientStats();
  }

  private refreshPatientStats(): void {
    if (!this.profile.showPatientSummary) {
      this.stats = this.operationalStats;
      return;
    }

    this.stats = [
      ...this.operationalStats,
      this.stat(
        'Patients Onboarded',
        this.patientsOnboarded,
        'Registered at this facility',
        'bg-violet-500',
        Users,
      ),
      this.stat(
        'Patients Seen Today',
        this.patientsSeenToday,
        'Completed appointments today',
        'bg-green-500',
        UserCheck,
      ),
    ];
  }
  private stat(
    name: string,
    value: number,
    change: string,
    color: string,
    icon: LucideIconData,
  ): DashboardStatUi {
    return { name, value: String(value), change, color, icon };
  }
  private labItem(request: LabRequest): WorkItem {
    return {
      id: request.id,
      title: request.patient,
      detail: `${request.test} · ${request.priority}`,
      status: request.status,
    };
  }
  private radiologyItem(order: RadiologyOrder): WorkItem {
    return {
      id: order.id,
      title: order.patient,
      detail: `${order.type} · ${order.priority}`,
      status: order.status,
    };
  }
  private currentShift(): string {
    const hour = new Date().getHours();
    return hour < 14 ? 'Morning' : hour >= 22 ? 'Night' : 'Evening';
  }

  private appointmentDateTime(appointment: {
    date: string;
    time: string;
  }): Date {
    return new Date(`${appointment.date}T${appointment.time || '00:00'}:00`);
  }

  private formatAppointmentTime(time: string): string {
    const [hours = '00', minutes = '00'] = time.split(':');
    return new Date(`1970-01-01T${hours}:${minutes}:00`).toLocaleTimeString(
      [],
      { hour: '2-digit', minute: '2-digit' },
    );
  }
  private iconFor(name: string): LucideIconData {
    const value = name.toLowerCase();
    if (value.includes('revenue')) return DollarSign;
    if (value.includes('stock')) return Package;
    if (value.includes('lab')) return FlaskConical;
    return Users;
  }
  private normalizeRole(role?: string): string {
    return (role || 'staff')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }
  private roleLabel(role: string): string {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  private readStoredUser(): StoredUser {
    try {
      return JSON.parse(
        localStorage.getItem('afyora.user') || '{}',
      ) as StoredUser;
    } catch {
      return {};
    }
  }
  private getUserName(user: StoredUser): string {
    return (
      user.fullName ||
      user.name ||
      `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim()
    );
  }

  private getActions(role: string): DashboardAction[] {
    const actionsByRole: Record<string, DashboardAction[]> = {
      accountant: [
        {
          title: 'Manage billing',
          description:
            'Create invoices, record payments, and follow up on balances.',
          link: '/billing',
          icon: DollarSign,
        },
        {
          title: 'View reports',
          description: 'Review financial and facility reports.',
          link: '/reports',
          icon: ClipboardList,
        },
      ],
      hr: [
        {
          title: 'Manage employees',
          description: 'Add employees and update staff records.',
          link: '/employees',
          icon: Users,
        },
        {
          title: 'Review departments',
          description: 'View teams and departmental staffing.',
          link: '/departments',
          icon: ClipboardList,
        },
      ],
      lab_technician: [
        {
          title: 'Laboratory queue',
          description: 'Process requests and enter laboratory results.',
          link: '/laboratory',
          icon: FlaskConical,
        },
        {
          title: 'View test prices',
          description: 'Check the laboratory test catalogue and prices.',
          link: '/laboratory',
          icon: DollarSign,
        },
      ],
      pharmacist: [
        {
          title: 'Dispense prescriptions',
          description: 'Review and dispense pending prescriptions.',
          link: '/pharmacy',
          icon: ClipboardList,
        },
        {
          title: 'Manage drugs',
          description: 'Maintain stock levels and medicine catalogue.',
          link: '/pharmacy',
          icon: Package,
        },
      ],
      receptionist: [
        {
          title: 'Register patient',
          description: 'Add a new patient or update patient details.',
          link: '/patients',
          icon: Users,
        },
        {
          title: 'Book appointment',
          description: 'Schedule appointments for patients.',
          link: '/patients',
          icon: Calendar,
        },
        {
          title: 'Initiate visit',
          description: 'Open a patient record and start a clinical visit.',
          link: '/patients',
          icon: ClipboardList,
        },
        {
          title: 'Lab test prices',
          description: 'Check laboratory tests and their prices.',
          link: '/laboratory',
          icon: FlaskConical,
        },
        {
          title: 'Radiology prices',
          description: 'Check imaging tests and their prices.',
          link: '/radiology',
          icon: Scan,
        },
      ],
    };

    return actionsByRole[role] ?? [];
  }
}
