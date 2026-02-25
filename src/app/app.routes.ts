import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/features/home/home.component').then(
        (m) => m.HomeComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/authentication/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./components/authentication/signup/signup.component').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./components/features/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent,
      ),
  },
  {
    path: 'patients',
    loadComponent: () =>
      import('./components/features/patients/patients.component').then(
        (m) => m.PatientsComponent,
      ),
  },
  {
    path: 'appointments',
    loadComponent: () =>
      import('./components/features/appointments/appointments.component').then(
        (m) => m.AppointmentsComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'ehr',
    loadComponent: () =>
      import('./components/features/ehr/ehr.component').then(
        (m) => m.EhrComponent,
      ),
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('./components/features/billing/billing.component').then(
        (m) => m.BillingComponent,
      ),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./components/features/inventory/inventory.component').then(
        (m) => m.InventoryComponent,
      ),
  },
  {
    path: 'laboratory',
    loadComponent: () =>
      import('./components/features/laboratory/laboratory.component').then(
        (m) => m.LaboratoryComponent,
      ),
  },
  {
    path: 'pharmacy',
    loadComponent: () =>
      import('./components/features/pharmacy/pharmacy.component').then(
        (m) => m.PharmacyComponent,
      ),
  },
  {
    path: 'radiology',
    loadComponent: () =>
      import('./components/features/radiology/radiology.component').then(
        (m) => m.RadiologyComponent,
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./components/features/reports/reports.component').then(
        (m) => m.ReportsComponent,
      ),
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./components/features/employees/employees.component').then(
        (m) => m.EmployeesComponent,
      ),
  },
];
