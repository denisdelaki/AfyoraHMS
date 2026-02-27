import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import {
  Appointment,
  CreateAppointmentPayload,
  Patient,
  RegisterPatientPayload,
  VisitHistory,
} from './patient.models';
import { RegisterPatientDialogComponent } from '../../dialogs/register-patient-dialog/register-patient-dialog.component';
import { PatientProfileDialogComponent } from '../../dialogs/patient-profile-dialog/patient-profile-dialog.component';
import { AppointmentBookingDialogComponent } from '../../dialogs/appointment-booking-dialog/appointment-booking-dialog.component';

@Component({
  selector: 'app-patients',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
  ],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.css',
})
export class PatientsComponent {
  private readonly dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'id',
    'name',
    'ageGender',
    'contact',
    'bloodGroup',
    'lastVisit',
    'status',
    'actions',
  ];
  searchTerm = '';

  patients: Patient[] = [
    {
      id: 'P001',
      name: 'John Smith',
      age: 45,
      gender: 'Male',
      phone: '+1 555-0101',
      email: 'john.smith@email.com',
      bloodGroup: 'O+',
      lastVisit: '2024-02-20',
      status: 'Active',
    },
    {
      id: 'P002',
      name: 'Sarah Johnson',
      age: 32,
      gender: 'Female',
      phone: '+1 555-0102',
      email: 'sarah.j@email.com',
      bloodGroup: 'A+',
      lastVisit: '2024-02-18',
      status: 'Active',
    },
    {
      id: 'P003',
      name: 'Michael Brown',
      age: 58,
      gender: 'Male',
      phone: '+1 555-0103',
      email: 'm.brown@email.com',
      bloodGroup: 'B+',
      lastVisit: '2024-02-15',
      status: 'Admitted',
    },
    {
      id: 'P004',
      name: 'Emma Davis',
      age: 28,
      gender: 'Female',
      phone: '+1 555-0104',
      email: 'emma.d@email.com',
      bloodGroup: 'AB+',
      lastVisit: '2024-02-22',
      status: 'Active',
    },
  ];

  appointments: Appointment[] = [
    {
      patientId: 'P001',
      patientName: 'John Smith',
      date: '2024-02-26',
      time: '10:00 AM',
      doctor: 'Dr. Emily Chen',
      department: 'Cardiology',
      status: 'Scheduled',
    },
    {
      patientId: 'P002',
      patientName: 'Sarah Johnson',
      date: '2024-02-28',
      time: '02:00 PM',
      doctor: 'Dr. James Wilson',
      department: 'General',
      status: 'Scheduled',
    },
  ];

  visitHistory: VisitHistory[] = [
    {
      date: '2024-02-20',
      doctor: 'Dr. Chen',
      diagnosis: 'Hypertension Follow-up',
      prescription: 'Amlodipine 5mg',
    },
    {
      date: '2024-01-15',
      doctor: 'Dr. Wilson',
      diagnosis: 'Annual Checkup',
      prescription: 'None',
    },
    {
      date: '2023-12-10',
      doctor: 'Dr. Taylor',
      diagnosis: 'Flu',
      prescription: 'Oseltamivir 75mg',
    },
  ];

  get filteredPatients(): Patient[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.patients;
    }

    return this.patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(term) ||
        patient.id.toLowerCase().includes(term),
    );
  }

  openRegisterDialog(patientToEdit?: Patient): void {
    const dialogRef = this.dialog.open(RegisterPatientDialogComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      data: {
        patient: patientToEdit,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      if (patientToEdit) {
        this.updatePatient(patientToEdit.id, result);
        return;
      }

      this.addPatient(result);
    });
  }

  openPatientDialog(patient: Patient): void {
    const dialogRef = this.dialog.open(PatientProfileDialogComponent, {
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh',
      data: {
        patient,
        appointments: this.appointments.filter(
          (appointment) => appointment.patientId === patient.id,
        ),
        visitHistory: this.visitHistory,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || result.action !== 'update') {
        return;
      }

      this.openRegisterDialog(result.patient);
    });
  }

  openAppointmentDialog(): void {
    const dialogRef = this.dialog.open(AppointmentBookingDialogComponent, {
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      data: {
        patients: this.patients,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.addAppointment(result);
    });
  }

  private addPatient(formValue: RegisterPatientPayload): void {
    const nextId = `P${String(this.patients.length + 1).padStart(3, '0')}`;

    this.patients = [
      {
        id: nextId,
        name: `${formValue.firstName} ${formValue.lastName}`.trim(),
        age: formValue.age ?? 0,
        gender: formValue.gender ?? '',
        phone: formValue.phone ?? '',
        email: formValue.email ?? '',
        bloodGroup: formValue.bloodGroup ?? '',
        lastVisit: new Date().toISOString().slice(0, 10),
        status: 'Active',
      },
      ...this.patients,
    ];
  }

  private addAppointment(formValue: CreateAppointmentPayload): void {
    const patient = this.patients.find(
      (item) => item.id === formValue.patientId,
    );
    if (!patient) {
      return;
    }

    this.appointments = [
      {
        patientId: patient.id,
        patientName: patient.name,
        date: formValue.date.toISOString().slice(0, 10),
        time: formValue.time,
        doctor: formValue.doctor,
        department: formValue.department,
        status: 'Scheduled',
      },
      ...this.appointments,
    ];
  }

  private updatePatient(
    patientId: string,
    formValue: RegisterPatientPayload,
  ): void {
    this.patients = this.patients.map((patient) => {
      if (patient.id !== patientId) {
        return patient;
      }

      return {
        ...patient,
        name: `${formValue.firstName} ${formValue.lastName}`.trim(),
        age: formValue.age ?? 0,
        gender: formValue.gender ?? '',
        phone: formValue.phone ?? '',
        email: formValue.email ?? '',
        bloodGroup: formValue.bloodGroup ?? '',
      };
    });
  }

  onEditPatient(patient: Patient): void {
    this.openRegisterDialog(patient);
  }

  getStatusClass(status: Patient['status']): string {
    return status === 'Active' ? 'status-active' : 'status-admitted';
  }
}
