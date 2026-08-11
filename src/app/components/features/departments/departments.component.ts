import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Building2, LucideAngularModule, Plus, Search } from 'lucide-angular';
import { Department } from '../../../models/employee.model';
import { DepartmentService } from '../../../services/department.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatIconModule,
    LucideAngularModule,
  ],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.css',
})
export class DepartmentsComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly Building2 = Building2;
  readonly Plus = Plus;
  readonly Search = Search;

  facilityId: string | number = '';
  departments: Department[] = [];
  searchTerm = '';
  isSaving = false;

  readonly departmentForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: [''],
    head: ['', [Validators.required]],
    email: ['', [Validators.required], Validators.email],
    phone: ['', [Validators.required]],
    location: ['', [Validators.required]],
  });

  onlyNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  get filteredDepartments(): Department[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.departments;
    }

    return this.departments.filter((department) => {
      const name = (department.name || '').toLowerCase();
      const description = (department.description || '').toLowerCase();
      const head = String(
        department.head_name || department.head || '',
      ).toLowerCase();
      const email = (department.email || '').toLowerCase();
      const location = (department.location || '').toLowerCase();
      return (
        name.includes(term) ||
        description.includes(term) ||
        head.includes(term) ||
        email.includes(term) ||
        location.includes(term)
      );
    });
  }

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.fetchDepartments(this.facilityId).subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        console.error('Failed to load departments', error);
        this.snackBar.open('Unable to load departments.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  addDepartment(): void {
    if (this.departmentForm.invalid || this.isSaving) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const raw = this.departmentForm.getRawValue();
    const payload = {
      name: String(raw.name ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      head: String(raw.head ?? '').trim() || null,
      email: String(raw.email ?? '').trim(),
      phone: String(raw.phone ?? '').trim(),
      location: String(raw.location ?? '').trim(),
      is_operational: true,
    };

    this.isSaving = true;
    this.departmentService.createDepartment(payload).subscribe({
      next: (created) => {
        this.departments = [
          created,
          ...this.departments.filter(
            (department) => department.id !== created.id,
          ),
        ];
        this.departmentForm.reset({
          name: '',
          description: '',
          head: '',
          email: '',
          phone: '',
          location: '',
        });
        this.snackBar.open('Department added successfully.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        const message =
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to add department.';
        this.snackBar.open(message, 'Close', {
          duration: 3500,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }
}
