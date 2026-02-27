import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class AddEmployeeDialogComponent {
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

  roles = ['Doctor', 'Nurse', 'Lab Technician', 'Radiologist', 'Admin'];
  shifts = [
    'Morning (6 AM - 2 PM)',
    'Evening (2 PM - 10 PM)',
    'Night (10 PM - 6 AM)',
  ];

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.value;
      const newEmployee = {
        name: `${formValue.firstName} ${formValue.lastName}`,
        role: formValue.role,
        department: formValue.department,
        email: formValue.email,
        phone: formValue.phone,
        joinDate: formValue.joinDate,
        salary: Number(formValue.salary),
        status: 'Active',
        shift: formValue.shift.split(' ')[0], // e.g. "Morning"
      };
      this.dialogRef.close(newEmployee);
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }
}
