import { Component, inject, computed, signal } from '@angular/core';
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
export class EmployeesComponent {
  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);

  // Expose signal data
  employees = this.employeeService.employees;
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
    return this.employees().filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term),
    );
  });

  // Computed stats
  totalStaff = computed(() => this.employees().length);
  doctorsCount = computed(
    () => this.employees().filter((e) => e.role.includes('Dr.')).length,
  );
  onDutyTodayCount = computed(
    () => this.employees().filter((e) => e.shift === 'Morning').length,
  );
  monthlyPayroll = computed(() => {
    const sum = this.employees().reduce((acc, emp) => acc + emp.salary, 0);
    return Math.round(sum / 12 / 1000) + 'K';
  });

  openAddEmployeeDialog() {
    const dialogRef = this.dialog.open(AddEmployeeDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result: Omit<Employee, 'id'>) => {
      if (result) {
        this.employeeService.addEmployee(result);
      }
    });
  }
}
