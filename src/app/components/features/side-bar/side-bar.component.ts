import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services';
import { PermissionsService } from '../../../core/permissions.service';
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  FlaskConical,
  Hospital,
  LayoutDashboard,
  LucideIconData,
  LucideAngularModule,
  Menu,
  Package,
  Pill,
  Scan,
  Shield,
  Ticket,
  LogOut,
  UserCog,
  Users,
  X,
} from 'lucide-angular';

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIconData;
  permission?: string;
  adminOnly?: boolean;
};

type StoredUser = {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterLink, RouterOutlet, LucideAngularModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent {
  private readonly authService = inject(AuthService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly userStorageKey = 'afyora.user';
  private readonly onboardingDraftStorageKey = 'afyora.onboardingDraft';
  readonly Menu = Menu;
  readonly X = X;
  readonly Hospital = Hospital;
  readonly LogOut = LogOut;

  sidebarOpen = false;
  userName = 'User';
  userEmail = 'No email';
  userInitials = 'US';
  userRole = '';

  private readonly allNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users, permission: 'patients' },
    { name: 'Visit Queue', href: '/visit-queue', icon: Ticket, permission: 'visit_queue' },
    { name: 'EHR', href: '/ehr', icon: FileText, permission: 'ehr' },
    { name: 'Pharmacy', href: '/pharmacy', icon: Pill, permission: 'pharmacy' },
    { name: 'Laboratory', href: '/laboratory', icon: FlaskConical, permission: 'laboratory' },
    { name: 'Radiology', href: '/radiology', icon: Scan, permission: 'radiology' },
    { name: 'Billing', href: '/billing', icon: CreditCard, permission: 'billing' },
    { name: 'Inventory', href: '/inventory', icon: Package, permission: 'inventory' },
    { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports' },
    { name: 'Employees', href: '/employees', icon: UserCog, permission: 'employees' },
    { name: 'Departments', href: '/departments', icon: Building2, permission: 'departments' },
    { name: 'Roles', href: '/roles', icon: Shield, permission: 'roles', adminOnly: true },
  ];

  readonly navigation = computed(() => {
    const isAdmin = this.permissionsService.isFacilityAdmin();
    return this.allNavigation.filter((item) => {
      if (!item.permission) return true;
      if (isAdmin) return true;
      if (item.adminOnly) return false;
      return this.permissionsService.hasPermission(item.permission as any);
    });
  });

  constructor(private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.userStorageKey);
    if (!storedUser) {
      this.loadUserFromOnboardingDraft();
      return;
    }
    try {
      const user = JSON.parse(storedUser) as StoredUser;
      const firstName = user.first_name || user.firstName || '';
      const lastName = user.last_name || user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      this.userName = fullName || firstName || 'User';
      this.userEmail = user.email || 'No email';
      this.userInitials = this.buildInitials(firstName, lastName);
      this.userRole = user.role || '';
    } catch {
      this.loadUserFromOnboardingDraft();
    }
  }

  private loadUserFromOnboardingDraft(): void {
    const draft = localStorage.getItem(this.onboardingDraftStorageKey);
    if (!draft) {
      this.userName = 'User';
      this.userEmail = 'No email';
      this.userInitials = 'US';
      return;
    }
    try {
      const parsed = JSON.parse(draft) as {
        formValue?: { adminFirstName?: string; adminLastName?: string; adminEmail?: string };
      };
      const firstName = parsed.formValue?.adminFirstName ?? '';
      const lastName = parsed.formValue?.adminLastName ?? '';
      this.userName = `${firstName} ${lastName}`.trim() || firstName || 'User';
      this.userEmail = parsed.formValue?.adminEmail || 'No email';
      this.userInitials = this.buildInitials(firstName, lastName);
    } catch {
      this.userName = 'User';
      this.userEmail = 'No email';
      this.userInitials = 'US';
    }
  }

  private buildInitials(firstName: string, lastName: string): string {
    const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
    return initials || 'US';
  }

  closeSidebar(): void { this.sidebarOpen = false; }
  openSidebar(): void { this.sidebarOpen = true; }

  logout(): void {
    this.closeSidebar();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  isActive(href: string): boolean {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  get formattedDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
}
