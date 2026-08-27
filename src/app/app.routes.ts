import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/auth.guard';
import { permissionGuard } from './core/permission.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: {
      seo: {
        title: 'Healthcare Management Software',
        description:
          'Afyora HMS is healthcare management software for clinics and hospitals. Manage patients, clinical records, appointments, billing, pharmacy, inventory, and reports in one workspace.',
      },
    },
    loadComponent: () =>
      import('./components/marketing/landing/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },
  {
    path: 'login',
    data: {
      seo: {
        title: 'Sign in',
        description: 'Sign in to Afyora HMS.',
        noIndex: true,
      },
    },
    loadComponent: () =>
      import('./components/authentication/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'signup',
    data: {
      seo: {
        title: 'Create your account',
        description:
          'Create an Afyora HMS account for your healthcare facility.',
        noIndex: true,
      },
    },
    loadComponent: () =>
      import('./components/authentication/signup/signup.component').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'forgot-password',
    data: {
      seo: {
        title: 'Reset your password',
        description: 'Reset your Afyora HMS password.',
        noIndex: true,
      },
    },
    loadComponent: () =>
      import('./components/authentication/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    data: {
      seo: {
        title: 'Choose a new password',
        description: 'Choose a new Afyora HMS password.',
        noIndex: true,
      },
    },
    loadComponent: () =>
      import('./components/authentication/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'onboarding',
    data: {
      seo: {
        title: 'Set up your facility',
        description: 'Set up your Afyora HMS facility workspace.',
        noIndex: true,
      },
    },
    loadComponent: () =>
      import('./components/features/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent,
      ),
  },
  {
    path: '',
    data: {
      seo: {
        title: 'Facility workspace',
        description: 'Afyora HMS facility workspace.',
        noIndex: true,
      },
    },
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () =>
      import('./components/features/side-bar/side-bar.component').then(
        (m) => m.SideBarComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/features/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/features/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path: 'patients',
        canActivate: [permissionGuard],
        data: { permission: 'patients' },
        loadComponent: () =>
          import('./components/features/patients/patients.component').then(
            (m) => m.PatientsComponent,
          ),
      },
      {
        path: 'appointments',
        canActivate: [permissionGuard],
        data: { permission: 'appointments' },
        loadComponent: () =>
          import('./components/features/appointments/appointments.component').then(
            (m) => m.AppointmentsComponent,
          ),
      },
      {
        path: 'visit-queue',
        canActivate: [permissionGuard],
        data: { permission: 'visit_queue' },
        loadComponent: () =>
          import('./components/features/visit-queue/visit-queue.component').then(
            (m) => m.VisitQueueComponent,
          ),
      },
      {
        path: 'ehr',
        canActivate: [permissionGuard],
        data: { permission: 'ehr' },
        loadComponent: () =>
          import('./components/features/ehr/ehr.component').then(
            (m) => m.EhrComponent,
          ),
      },
      {
        path: 'billing',
        canActivate: [permissionGuard],
        data: { permission: 'billing' },
        loadComponent: () =>
          import('./components/features/billing/billing.component').then(
            (m) => m.BillingComponent,
          ),
      },
      {
        path: 'inventory',
        canActivate: [permissionGuard],
        data: { permission: 'inventory' },
        loadComponent: () =>
          import('./components/features/inventory/inventory.component').then(
            (m) => m.InventoryComponent,
          ),
      },
      {
        path: 'laboratory',
        canActivate: [permissionGuard],
        data: { permission: 'laboratory' },
        loadComponent: () =>
          import('./components/features/laboratory/laboratory.component').then(
            (m) => m.LaboratoryComponent,
          ),
      },
      {
        path: 'pharmacy',
        canActivate: [permissionGuard],
        data: { permission: 'pharmacy' },
        loadComponent: () =>
          import('./components/features/pharmacy/pharmacy.component').then(
            (m) => m.PharmacyComponent,
          ),
      },
      {
        path: 'radiology',
        canActivate: [permissionGuard],
        data: { permission: 'radiology' },
        loadComponent: () =>
          import('./components/features/radiology/radiology.component').then(
            (m) => m.RadiologyComponent,
          ),
      },
      {
        path: 'reports',
        canActivate: [permissionGuard],
        data: { permission: 'reports' },
        loadComponent: () =>
          import('./components/features/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: 'employees',
        canActivate: [permissionGuard],
        data: { permission: 'employees' },
        loadComponent: () =>
          import('./components/features/employees/employees.component').then(
            (m) => m.EmployeesComponent,
          ),
      },
      {
        path: 'departments',
        canActivate: [permissionGuard],
        data: { permission: 'departments' },
        loadComponent: () =>
          import('./components/features/departments/departments.component').then(
            (m) => m.DepartmentsComponent,
          ),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { permission: 'roles', seo: { title: 'Roles & Permissions' } },
        loadComponent: () =>
          import('./components/features/roles/roles.component').then(
            (m) => m.RolesComponent,
          ),
      },
    ],
  },
];
