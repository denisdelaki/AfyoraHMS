import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
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

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterLink, RouterOutlet, LucideAngularModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent {
  readonly Menu = Menu;
  readonly X = X;
  readonly Hospital = Hospital;
  readonly LogOut = LogOut;

  sidebarOpen = false;

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

  constructor(private router: Router) {}

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  logout(): void {
    this.closeSidebar();
    this.router.navigate(['/login']);
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
