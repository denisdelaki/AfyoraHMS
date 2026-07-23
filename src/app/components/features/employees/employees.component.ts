import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { AddEmployeeDialogComponent } from '../../dialogs/add-employee-dialog/add-employee-dialog.component';
import { Employee } from '../../../models/employee.model';
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
    LucideAngularModule,
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

  // Expose signal data
  employees: any[] = [];
  shifts = this.employeeService.shifts;
  attendance = this.employeeService.attendance;

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

  ngOnInit(): void {
    this.fetchEmployees();
  }

  fetchEmployees() {
    const facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.employeeService.fetchEmployees(facilityId).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.employeeService.employees.set(employees);

        this.setEmployeesData(employees);
      },
      error: (error) => {
        console.error(
          'Failed to load employees from API. Using local fallback data.',
          error,
        );
      },
    });
  }

  private setEmployeesData(employees: Employee[]): void {
    // Computed stats
    this.totalStaff.set(employees.length);
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
    this.monthlyPayroll.set(sum.toString() + 'K');

    //set the shifts and attendance signals
    this.employeeService.shifts.set(
      Array.from(new Set(employees.map((e) => e.shift))).map((shift) => ({
        shift,
        time: '',
        employees: employees
          .filter((e) => e.shift === shift)
          .map((e) => e.name),
      })),
    );

    this.employeeService.attendance.set(
      employees.map((e) => ({
        date: new Date().toISOString().slice(0, 10),
        employee: e.name,
        checkIn: '',
        checkOut: '',
        status: 'Present',
      })),
    );
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
}
