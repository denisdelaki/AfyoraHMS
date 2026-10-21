import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { AddEmployeeDialogComponent } from '../../dialogs/add-employee-dialog/add-employee-dialog.component';
import { Employee } from '../../../models/employee.model';
import { PageRequest } from '../../../core/pagination';
import { PaginationControlsComponent } from '../../shared/pagination-controls/pagination-controls.component';
import { PermissionsService } from '../../../core/permissions.service';
import {
  LucideAngularModule,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-angular';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    LucideAngularModule,
    PaginationControlsComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css',
})
export class EmployeesComponent implements OnInit {
  totalStaff = signal(0);
  doctorsCount = signal(0);
  onDutyTodayCount = signal(0);
  monthlyPayroll = signal('0K');

  currentTimeOfDay = signal(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );
  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionsService = inject(PermissionsService);

  // Expose signal data
  employees: Employee[] = [];
  employeesPage = 1;
  employeesPageSize = 25;
  employeesTotal = 0;
  employeesLoading = false;
  shifts = this.employeeService.shifts;
  attendance = this.employeeService.attendance;
  myAttendance = this.employeeService.myAttendance;

  // React state equivalents
  searchTerm = signal('');

  // Re-export lucide icons to the template
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly Clock = Clock;

  // Computed filtered list
  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term),
    );
  });

  get canManageEmployees(): boolean {
    if (this.permissionsService.isFacilityAdmin()) return true;

    try {
      const user = JSON.parse(
        localStorage.getItem('afyora.user') || 'null',
      ) as { role?: string } | null;
      const role = user?.role?.trim().toLowerCase().replace(/[\s-]+/g, '_');
      return role === 'hr' || role === 'human_resources';
    } catch (error) {
      console.error('Unable to determine employee-management role:', error);
      return false;
    }
  }

  ngOnInit(): void {
    this.fetchEmployees();
    this.fetchAttendance();
  }

  fetchEmployees() {
    const facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.employeesLoading = true;
    this.employeeService
      .fetchEmployeesPage(
        facilityId,
        this.employeesPage,
        this.employeesPageSize,
        this.searchTerm(),
      )
      .subscribe({
      next: (result) => {
        this.employees = result.items;
        this.employeesTotal = result.total;
        this.employeeService.employees.set(result.items);

        this.setEmployeesData(result.items, result.total);
        this.employeesLoading = false;
      },
      error: (error) => {
        console.error('Failed to load employees from API.', error);
        this.employeesLoading = false;
        this.snackBar.open('Unable to load this employee page.', 'Close', {
          duration: 3500,
        });
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.employeesPage = 1;
    this.fetchEmployees();
  }

  onEmployeesPageChange(request: PageRequest): void {
    this.employeesPage = request.page;
    this.employeesPageSize = request.pageSize;
    this.fetchEmployees();
  }

  private setEmployeesData(employees: Employee[], total: number): void {
    // Computed stats
    this.totalStaff.set(total);
    this.doctorsCount.set(
      employees.filter((e) => e.role.toLowerCase().includes('doctor')).length,
    );

    const currentShift =
      this.currentTimeOfDay() < '14:00'
        ? 'Morning'
        : this.currentTimeOfDay() >= '22:00'
          ? 'Night'
          : 'Evening';
    this.onDutyTodayCount.set(
      employees.filter((e) => e.shift === currentShift).length,
    );

    const sum = employees.reduce(
      (acc, emp) => acc + Number(emp.salary ?? 0),
      0,
    );
    this.monthlyPayroll.set(sum.toString());

    //set the shifts signal
    this.employeeService.shifts.set(
      Array.from(new Set(employees.map((e) => e.shift))).map((shift) => ({
        shift,
        time: '',
        employees: employees
          .filter((e) => e.shift === shift)
          .map((e) => e.name),
      })),
    );
  }

  fetchAttendance() {
    this.employeeService.getFacilityAttendance().subscribe({
      error: (err) => console.error('Failed to load facility attendance', err),
    });
    this.employeeService.getMyAttendance().subscribe({
      error: (err) => console.error('Failed to load personal attendance', err),
    });
  }

  clockIn() {
    this.employeeService.clockIn().subscribe({
      next: () => {
        this.fetchAttendance();
      },
      error: (err) => console.error('Clock in failed', err),
    });
  }

  clockOut() {
    this.employeeService.clockOut().subscribe({
      next: () => {
        this.fetchAttendance();
      },
      error: (err) => console.error('Clock out failed', err),
    });
  }

  openAddEmployeeDialog() {
    const dialogRef = this.dialog.open(AddEmployeeDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result: Omit<Employee, 'id'>) => {
      if (result) {
        this.employeeService.addEmployee(result).subscribe({
          next: () => {
            this.fetchEmployees();
          },
          error: (error) => {
            console.error('Failed to create employee via API.', error);
          },
        });
      }
    });
  }

  openEditEmployeeDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(AddEmployeeDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: employee,
    });

    dialogRef.afterClosed().subscribe((payload: Partial<Employee> | undefined) => {
      if (!payload) return;

      this.employeeService.updateEmployee(employee.id, payload).subscribe({
        next: () => {
          this.fetchEmployees();
          this.snackBar.open('Employee updated successfully.', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error(`Failed to update employee ${employee.id}:`, error);
          this.snackBar.open('Unable to update employee.', 'Close', {
            duration: 3500,
          });
        },
      });
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!window.confirm(`Delete employee ${employee.name}? This cannot be undone.`)) {
      return;
    }

    this.employeeService.deleteEmployee(employee.id).subscribe({
      next: () => {
        this.employeesTotal = Math.max(0, this.employeesTotal - 1);
        if (this.employees.length === 1 && this.employeesPage > 1) {
          this.employeesPage--;
        }
        this.fetchEmployees();
        this.snackBar.open('Employee deleted successfully.', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error(`Failed to delete employee ${employee.id}:`, error);
        this.snackBar.open('Unable to delete employee.', 'Close', {
          duration: 3500,
        });
      },
    });
  }
}
