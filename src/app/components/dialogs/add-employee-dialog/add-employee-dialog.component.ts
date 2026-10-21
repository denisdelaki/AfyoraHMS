import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { DepartmentService } from '../../../services/department.service';
import { Department, Employee } from '../../../models/employee.model';
import { RolesService } from '../../../services/roles.service';

@Component({
  selector: 'app-add-employee-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTimepickerModule,
  ],
  templateUrl: './add-employee-dialog.component.html',
  styleUrls: ['./add-employee-dialog.component.css'],
})
export class AddEmployeeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddEmployeeDialogComponent>);
  readonly employee = inject<Employee | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  employeeForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    role: ['Doctor', Validators.required],
    department: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(12)]],
    joinDate: ['', Validators.required],
    salary: ['', [Validators.required, Validators.min(0)]],
    shift: ['Morning (6 AM - 2 PM)', Validators.required],
  });

  roles: any[] = []
  //   { value: 'admin', label: 'Administrator' },
  //   { value: 'facility_admin', label: 'Facility Admin' },
  //   { value: 'doctor', label: 'Doctor' },
  //   { value: 'nurse', label: 'Nurse' },
  //   { value: 'receptionist', label: 'Receptionist' },
  //   { value: 'pharmacist', label: 'Pharmacist' },
  //   { value: 'lab_technician', label: 'Lab Technician' },
  //   { value: 'radiologist', label: 'Radiologist' },
  //   { value: 'accountant', label: 'Accountant' },
  //   { value: 'manager', label: 'Manager' },
  //   { value: 'hr', label: 'Human Resources' },
  //   { value: 'staff', label: 'General Staff' },
  // ];
  departments: Department[] = [];
  shifts = [
    'Morning (6 AM - 2 PM)',
    'Evening (2 PM - 10 PM)',
    'Night (10 PM - 6 AM)',
  ];

  get hasCurrentRoleOption(): boolean {
    return this.roles.some(
      (role) =>
        String(role.value) === String(this.employee?.role) ||
        role.label.toLowerCase() === this.employee?.role?.toLowerCase(),
    );
  }

  get hasCurrentDepartmentOption(): boolean {
    return this.departments.some(
      (department) =>
        String(department.id) === String(this.employee?.department) ||
        department.name.toLowerCase() ===
          this.employee?.department?.toLowerCase(),
    );
  }

  constructor(private departmentService: DepartmentService, private roleService: RolesService) { }

  ngOnInit(): void {
    if (this.employee) {
      const [firstName = '', ...lastNameParts] = this.employee.name
        .trim()
        .split(/\s+/);
      this.employeeForm.patchValue({
        firstName,
        lastName: lastNameParts.join(' '),
        role: this.employee.role,
        department: this.employee.department,
        email: this.employee.email,
        phone: this.employee.phone,
        joinDate: this.parseJoinDate(this.employee.joinDate),
        salary: this.employee.salary,
        shift: this.getShiftOption(this.employee.shift),
      });
    }

    this.departmentService.fetchDepartments().subscribe({
      next: (departments) => {
        this.departments = departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          facility: dept.facility,
        }));
        const currentDepartment = this.departments.find(
          (department) =>
            String(department.id) === String(this.employee?.department) ||
            department.name.toLowerCase() ===
              this.employee?.department?.toLowerCase(),
        );
        if (currentDepartment) {
          this.employeeForm.patchValue({ department: currentDepartment.id });
        }
      },
      error: (error) => {
        console.error(
          'Failed to load departments from API. Using local fallback data.',
          error,
        );
      },
    });

    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles.map((role) => ({
          value: role.id,
          label: role.name,
        }));
        const currentRole = roles.find(
          (role) =>
            String(role.id) === String(this.employee?.role) ||
            role.name.toLowerCase() === this.employee?.role?.toLowerCase(),
        );
        if (currentRole) {
          this.employeeForm.patchValue({ role: currentRole.id });
        }
      },
      error: (error) => {
        console.error(
          'Failed to load roles from API. Using local fallback data.',
          error,
        );
      },
    });
  }
  onlyNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.value;
      const employee = {
        name: `${formValue.firstName} ${formValue.lastName}`,
        role: formValue.role,
        department: formValue.department,
        email: formValue.email,
        phone: formValue.phone,
        joinDate: this.normalizeJoinDate(formValue.joinDate),
        salary: Number(formValue.salary),
        status: this.employee?.status || 'Active',
        shift: formValue.shift.split(' ')[0], // e.g. "Morning"
      };
      this.dialogRef.close(employee);
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }

  private normalizeJoinDate(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsedDate = new Date(value);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().slice(0, 10);
      }

      return value;
    }

    return new Date().toISOString().slice(0, 10);
  }

  private parseJoinDate(value: string): Date | null {
    const parts = value.split('-').map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private getShiftOption(shift: string): string {
    return (
      this.shifts.find((option) => option.startsWith(shift)) ||
      this.shifts[0]
    );
  }
}
