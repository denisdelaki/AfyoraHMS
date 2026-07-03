import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services';
import {
  BarChart3,
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
  LogOut,
  UserCog,
  Users,
  X,
} from 'lucide-angular';

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIconData;
};

type StoredUser = {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterLink, RouterOutlet, LucideAngularModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent {
  private readonly authService = inject(AuthService);
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

  navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'EHR', href: '/ehr', icon: FileText },
    { name: 'Pharmacy', href: '/pharmacy', icon: Pill },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Employees', href: '/employees', icon: UserCog },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Laboratory', href: '/laboratory', icon: FlaskConical },
    { name: 'Radiology', href: '/radiology', icon: Scan },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

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
        formValue?: {
          adminFirstName?: string;
          adminLastName?: string;
          adminEmail?: string;
        };
      };
      const firstName = parsed.formValue?.adminFirstName ?? '';
      const lastName = parsed.formValue?.adminLastName ?? '';
      const fullName = `${firstName} ${lastName}`.trim();

      this.userName = fullName || firstName || 'User';
      this.userEmail = parsed.formValue?.adminEmail || 'No email';
      this.userInitials = this.buildInitials(firstName, lastName);
    } catch {
      this.userName = 'User';
      this.userEmail = 'No email';
      this.userInitials = 'US';
    }
  }

  private buildInitials(firstName: string, lastName: string): string {
    const first = firstName.trim().charAt(0);
    const last = lastName.trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();

    return initials || 'US';
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  logout(): void {
    this.closeSidebar();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  isActive(href: string): boolean {
    const currentPath = this.router.url.split('?')[0].split('#')[0];

    if (href === '/') {
      return currentPath === '/';
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  get formattedDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
