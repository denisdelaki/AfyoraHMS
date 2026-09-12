import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
import { AppointmentsService, PatientsService } from '../../../services';
import { PermissionsService } from '../../../core/permissions.service';
import {
  Appointment as ServiceAppointment,
  CreateAppointmentRequest,
  RegisterPatientRequest,
  UpdatePatientRequest,
} from '../../../models';

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
export class PatientsComponent implements OnInit {
  facilityId: string | number = '';
  private readonly dialog = inject(MatDialog);
  private readonly patientsService = inject(PatientsService);
  private readonly appointmentsService = inject(AppointmentsService);
  readonly permissionsService = inject(PermissionsService);

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

  patients: Patient[] = [];

  appointments: Appointment[] = [];

  visitHistory: VisitHistory[] = [];

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.loadPatients();
    this.loadAppointments();
  }

  get filteredPatients(): Patient[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.patients;
    }

    return this.patients.filter(
      (patient) =>
        `${patient.firstName} ${patient.lastName}`
          .toLowerCase()
          .includes(term) ||
        patient.id.toLowerCase().includes(term) ||
        (patient.nationalId && patient.nationalId.toLowerCase().includes(term)),
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
    this.patientsService
      .getPatientVisitHistory(patient.id, this.facilityId)
      .subscribe({
        next: (data) => {
          this.showPatientDialog(patient, data);
        },
        error: () => {
          this.showPatientDialog(patient, this.visitHistory);
        },
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
    if (!this.facilityId) {
      return;
    }

    const requestPayload: RegisterPatientRequest = {
      nationalId: formValue.nationalId,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      age: formValue.age,
      gender: formValue.gender,
      phone: formValue.phone,
      email: formValue.email,
      bloodGroup: formValue.bloodGroup,
      dob: formValue.dob,
      address: formValue.address,
      emergencyContact: formValue.emergencyContact,
      medicalHistory: formValue.medicalHistory,
      facilityId: this.facilityId,
    };

    this.patientsService.registerPatient(requestPayload).subscribe({
      next: (response) => {
        const createdPatient: Patient =
          response?.data || (response as any)?.results || response;
        if (createdPatient && createdPatient.id) {
          this.patients = [
            createdPatient,
            ...this.patients.filter((entry) => entry.id !== createdPatient.id),
          ];
        } else {
          this.loadPatients();
        }
      },
      error: () => {
        this.addPatientLocally(formValue);
      },
    });
  }

  private addPatientLocally(formValue: RegisterPatientPayload): void {
    const nextId = `P${String(this.patients.length + 1).padStart(3, '0')}`;

    this.patients = [
      {
        id: nextId,
        nationalId: formValue.nationalId ?? '',
        firstName: formValue.firstName,
        lastName: formValue.lastName,
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
    const requestPayload: CreateAppointmentRequest = {
      patientId: formValue.patientId,
      date: formValue.date.toISOString().slice(0, 10),
      time: formValue.time,
      doctor: formValue.doctor,
      department: formValue.department,
    };

    this.appointmentsService
      .createAppointment(this.facilityId, requestPayload)
      .subscribe({
        next: (data: any) => {
          const appointment: ServiceAppointment = {
            id: data.id,
            patientId: data.patientId,
            firstName:
              this.patients.find((patient) => patient.id === data.patientId)
                ?.firstName ?? '',
            lastName:
              this.patients.find((patient) => patient.id === data.patientId)
                ?.lastName ?? '',
            date: data.date,
            time: data.time,
            doctor: data.doctor,
            department: data.department,
            status: data.status,
          };
          this.appointments = [
            this.mapServiceAppointment(appointment),
            ...this.appointments.filter(
              (entry) =>
                entry.patientId !== data.patientId ||
                entry.date !== data.date ||
                entry.time !== data.time,
            ),
          ];
        },
        error: () => {
          this.addAppointmentLocally(formValue);
        },
      });
  }

  private addAppointmentLocally(formValue: CreateAppointmentPayload): void {
    const patient = this.patients.find(
      (item) => item.id === formValue.patientId,
    );
    if (!patient) {
      return;
    }

    this.appointments = [
      {
        patientId: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
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
    const updatePayload: UpdatePatientRequest = {
      nationalId: formValue.nationalId,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      age: formValue.age,
      gender: formValue.gender,
      phone: formValue.phone,
      email: formValue.email,
      bloodGroup: formValue.bloodGroup,
      dob: formValue.dob,
      address: formValue.address,
      emergencyContact: formValue.emergencyContact,
      medicalHistory: formValue.medicalHistory,
      facilityId: this.facilityId,
    };

    this.patientsService
      .updatePatient(patientId, updatePayload, this.facilityId)
      .subscribe({
        next: (response) => {
          const updatedData: Patient =
            response?.data || (response as any)?.results || response;
          this.patients = this.patients.map((patient) =>
            patient.id === patientId ? { ...patient, ...updatedData } : patient,
          );
        },
        error: () => {
          this.updatePatientLocally(patientId, formValue);
        },
      });
  }

  private updatePatientLocally(
    patientId: string,
    formValue: RegisterPatientPayload,
  ): void {
    this.patients = this.patients.map((patient) => {
      if (patient.id !== patientId) {
        return patient;
      }

      return {
        ...patient,
        nationalId: formValue.nationalId ?? '',
        firstName: formValue.firstName ?? '',
        lastName: formValue.lastName ?? '',
        age: formValue.age ?? 0,
        gender: formValue.gender ?? '',
        phone: formValue.phone ?? '',
        email: formValue.email ?? '',
        bloodGroup: formValue.bloodGroup ?? '',
        dob: formValue.dob ?? '',
        address: formValue.address ?? '',
        emergencyContact: formValue.emergencyContact ?? '',
        medicalHistory: formValue.medicalHistory ?? '',
        facilityId: this.facilityId,
      };
    });
  }

  onEditPatient(patient: Patient): void {
    this.openRegisterDialog(patient);
  }

  getStatusClass(status: Patient['status']): string {
    return status === 'Active' ? 'status-active' : 'status-admitted';
  }

  private loadPatients(): void {
    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: () => { },
    });
  }

  private loadAppointments(): void {
    this.appointmentsService.getAppointments(this.facilityId).subscribe({
      next: (data) => {
        const appointmentsData = data || [];
        this.appointments = appointmentsData.map((appointment) =>
          this.mapServiceAppointment(appointment),
        );
      },
      error: () => { },
    });
  }

  private mapServiceAppointment(appointment: ServiceAppointment): Appointment {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      date: appointment.date,
      time: appointment.time,
      doctor: appointment.doctor,
      department: appointment.department,
      status: appointment.status,
    };
  }

  private showPatientDialog(
    patient: Patient,
    visitHistory: VisitHistory[],
  ): void {
    const dialogRef = this.dialog.open(PatientProfileDialogComponent, {
      width: '90vw',
      maxWidth: '1000px',
      maxHeight: '90vh',
      data: {
        patient,
        appointments: this.appointments
          .filter((appointment) => appointment.patientId === patient.id)
          .map((appointment) => ({
            ...appointment,
          })),
        visitHistory,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || result.action !== 'update') {
        this.loadPatients();
        return;
      }

      this.openRegisterDialog(result.patient);
    });
  }
}
