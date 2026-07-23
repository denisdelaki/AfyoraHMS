import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { DepartmentService } from '../../../services/department.service';
import { Department } from '../../../models/employee.model';

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

  employeeForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    role: ['Doctor', Validators.required],
    department: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    joinDate: ['', Validators.required],
    salary: ['', [Validators.required, Validators.min(0)]],
    shift: ['Morning (6 AM - 2 PM)', Validators.required],
  });

  roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'facility_admin', label: 'Facility Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'lab_technician', label: 'Lab Technician' },
    { value: 'radiologist', label: 'Radiologist' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'General Staff' },
  ];
  departments: Department[] = [];
  shifts = [
    'Morning (6 AM - 2 PM)',
    'Evening (2 PM - 10 PM)',
    'Night (10 PM - 6 AM)',
  ];

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.departmentService.fetchDepartments().subscribe({
      next: (departments) => {
        this.departments = departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          facility: dept.facility,
        }));
      },
      error: (error) => {
        console.error(
          'Failed to load departments from API. Using local fallback data.',
          error,
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.value;
      console.log('Form Value:', formValue);
      const newEmployee = {
        name: `${formValue.firstName} ${formValue.lastName}`,
        role: formValue.role,
        department: formValue.department,
        email: formValue.email,
        phone: formValue.phone,
        joinDate: this.normalizeJoinDate(formValue.joinDate),
        salary: Number(formValue.salary),
        status: 'Active',
        shift: formValue.shift.split(' ')[0], // e.g. "Morning"
      };
      this.dialogRef.close(newEmployee);
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
}
