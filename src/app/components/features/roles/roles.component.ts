import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit2, Trash2, Shield, ChevronDown, ChevronUp, X, Check, Save, Users, AlertTriangle } from 'lucide-angular';
import { RolesService, FacilityRole, CreateRolePayload } from '../../../services/roles.service';
import { EmployeeService } from '../../../services/employee.service';
import { ALL_MODULES, ModuleKey, PermissionsMap } from '../../../core/permissions.service';

const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard_overview: 'Dashboard Overview',
  patients:           'Patients',
  appointments:       'Appointments',
  visit_queue:        'Visit Queue',
  ehr:                'EHR (Records)',
  pharmacy:           'Pharmacy',
  laboratory:         'Laboratory',
  radiology:          'Radiology',
  billing:            'Billing',
  inventory:          'Inventory',
  reports:            'Reports',
  employees:          'Employees',
  departments:        'Departments',
  roles:              'Roles & Permissions',
};

const MODULE_GROUPS: { label: string; modules: ModuleKey[] }[] = [
  { label: 'Clinical',       modules: ['patients', 'appointments', 'visit_queue', 'ehr'] },
  { label: 'Diagnostics',    modules: ['laboratory', 'radiology'] },
  { label: 'Pharmacy',       modules: ['pharmacy', 'inventory'] },
  { label: 'Finance',        modules: ['billing', 'reports'] },
  { label: 'Administration', modules: ['employees', 'departments', 'dashboard_overview', 'roles'] },
];

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css',
})
export class RolesComponent implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly employeeService = inject(EmployeeService);

  readonly Plus = Plus;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly Shield = Shield;
  readonly X = X;
  readonly Check = Check;
  readonly Save = Save;
  readonly Users = Users;
  readonly AlertTriangle = AlertTriangle;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  readonly allModules = ALL_MODULES;
  readonly moduleLabels = MODULE_LABELS;
  readonly moduleGroups = MODULE_GROUPS;

  roles = signal<FacilityRole[]>([]);
  employees = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  // Modal state
  showModal = signal(false);
  isEditing = signal(false);
  editingRoleId = signal<number | null>(null);

  // Form state
  formName = '';
  formDescription = '';
  formPermissions: Record<string, boolean> = {};

  // Assign role modal
  showAssignModal = signal(false);
  assigningRole = signal<FacilityRole | null>(null);
  selectedEmployeeId = '';
  assignLoading = signal(false);
  assignError = signal('');
  assignSuccess = signal('');

  // Delete confirmation
  showDeleteConfirm = signal(false);
  deletingRole = signal<FacilityRole | null>(null);

  // Expanded role detail
  expandedRoleId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadRoles();
    this.loadEmployees();
  }

  private loadRoles(): void {
    this.loading.set(true);
    this.rolesService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load roles.');
        this.loading.set(false);
      },
    });
  }

  private loadEmployees(): void {
    const facilityId = this.getFacilityId();
    if (!facilityId) return;
    this.employeeService.fetchEmployees(facilityId).subscribe({
      next: (employees) => this.employees.set(employees),
      error: () => {},
    });
  }

  private getFacilityId(): string {
    try {
      const user = JSON.parse(localStorage.getItem('afyora.user') || '{}');
      return String(user?.facility ?? '');
    } catch {
      return '';
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingRoleId.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formPermissions = Object.fromEntries(ALL_MODULES.map(m => [m, false]));
    this.error.set('');
    this.showModal.set(true);
  }

  openEditModal(role: FacilityRole): void {
    this.isEditing.set(true);
    this.editingRoleId.set(role.id);
    this.formName = role.name;
    this.formDescription = role.description;
    this.formPermissions = { ...Object.fromEntries(ALL_MODULES.map(m => [m, false])), ...role.permissions };
    this.error.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.error.set('');
  }

  togglePermission(module: string): void {
    this.formPermissions[module] = !this.formPermissions[module];
  }

  toggleGroupPermissions(group: { modules: ModuleKey[] }): void {
    const allOn = group.modules.every(m => this.formPermissions[m]);
    group.modules.forEach(m => this.formPermissions[m] = !allOn);
  }

  isGroupAllOn(group: { modules: ModuleKey[] }): boolean {
    return group.modules.every(m => this.formPermissions[m]);
  }

  isGroupPartial(group: { modules: ModuleKey[] }): boolean {
    const count = group.modules.filter(m => this.formPermissions[m]).length;
    return count > 0 && count < group.modules.length;
  }

  enabledCount(): number {
    return Object.values(this.formPermissions).filter(Boolean).length;
  }

  saveRole(): void {
    if (!this.formName.trim()) {
      this.error.set('Role name is required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const payload: CreateRolePayload = {
      name: this.formName.trim(),
      description: this.formDescription.trim(),
      permissions: this.formPermissions as PermissionsMap,
    };

    const op$ = this.isEditing() && this.editingRoleId()
      ? this.rolesService.updateRole(this.editingRoleId()!, payload)
      : this.rolesService.createRole(payload);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.loadRoles();
      },
      error: (err) => {
        this.saving.set(false);
        const detail = err?.error?.name?.[0] || err?.error?.detail || 'Failed to save role.';
        this.error.set(detail);
      },
    });
  }

  confirmDelete(role: FacilityRole): void {
    this.deletingRole.set(role);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deletingRole.set(null);
  }

  deleteRole(): void {
    const role = this.deletingRole();
    if (!role) return;
    this.rolesService.deleteRole(role.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.deletingRole.set(null);
        this.loadRoles();
      },
      error: () => {
        this.showDeleteConfirm.set(false);
      },
    });
  }

  openAssignModal(role: FacilityRole): void {
    this.assigningRole.set(role);
    this.selectedEmployeeId = '';
    this.assignError.set('');
    this.assignSuccess.set('');
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.assigningRole.set(null);
  }

  assignRole(): void {
    const role = this.assigningRole();
    if (!role || !this.selectedEmployeeId) return;
    this.assignLoading.set(true);
    this.assignError.set('');
    this.assignSuccess.set('');
    this.rolesService.assignRole(role.id, { employee_id: this.selectedEmployeeId }).subscribe({
      next: () => {
        this.assignLoading.set(false);
        this.assignSuccess.set(`Role "${role.name}" assigned successfully.`);
        this.selectedEmployeeId = '';
        this.loadRoles();
      },
      error: (err) => {
        this.assignLoading.set(false);
        this.assignError.set(err?.error?.error || 'Failed to assign role.');
      },
    });
  }

  toggleExpand(roleId: number): void {
    this.expandedRoleId.set(this.expandedRoleId() === roleId ? null : roleId);
  }

  isExpanded(roleId: number): boolean {
    return this.expandedRoleId() === roleId;
  }

  enabledModules(role: FacilityRole): string[] {
    return ALL_MODULES.filter(m => role.permissions?.[m]);
  }

  getModuleLabel(m: string): string {
    return MODULE_LABELS[m as ModuleKey] ?? m;
  }
}
