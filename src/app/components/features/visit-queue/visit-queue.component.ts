import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import {
  Patient,
  QUEUE_DESTINATIONS,
  QueueDestination,
  TicketPriority,
  VisitTicket,
} from '../../../models';
import { PatientsService, VisitQueueService } from '../../../services';
import {
  AddVisitRecordDialogComponent,
  VisitRecordFormValue,
} from '../../dialogs/add-visit-record-dialog/add-visit-record-dialog.component';

/** Maps a backend role name to the queue station(s) that role is allowed to work at. */
const ROLE_TO_DESTINATIONS: Record<string, QueueDestination[]> = {
  receptionist: ['Reception'],
  consultant: ['Consultation'],
  doctor: ['Consultation'],
  physician: ['Consultation'],
  nurse: ['Consultation'],
  lab_technician: ['Laboratory'],
  laboratory_technician: ['Laboratory'],
  radiologist: ['Radiology'],
  radiology_technician: ['Radiology'],
  pharmacist: ['Pharmacy'],
  cashier: ['Billing'],
  billing_officer: ['Billing'],
  // facility_admin / admin can see everything
  facility_admin: [...QUEUE_DESTINATIONS],
  admin: [...QUEUE_DESTINATIONS],
};

@Component({
  selector: 'app-visit-queue',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './visit-queue.component.html',
  styleUrl: './visit-queue.component.css',
})
export class VisitQueueComponent implements OnInit, OnDestroy {
  private readonly patientsService = inject(PatientsService);
  private readonly queueService = inject(VisitQueueService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private queueSubscription?: Subscription;

  facilityId: string | number = '';
  currentUser = 'Reception';
  currentStation: QueueDestination = 'Reception';
  userRole = '';
  patients: Patient[] = [];
  tickets: VisitTicket[] = [];
  selectedPatientId = '';
  selectedDestination: QueueDestination = 'Consultation';
  selectedPriority: TicketPriority = 'Normal';
  searchTerm = '';
  forwardDestinations: Record<string, QueueDestination> = {};

  /** Destinations this user is allowed to view/manage based on their role. */
  get allowedDestinations(): QueueDestination[] {
    const role = this.userRole.toLowerCase();
    return ROLE_TO_DESTINATIONS[role] ?? [...QUEUE_DESTINATIONS];
  }

  /** True when the user is restricted to a single station (e.g. receptionist). */
  get isSingleStationUser(): boolean {
    return this.allowedDestinations.length === 1;
  }

  /** All destinations for UI controls that should always list every stop. */
  readonly destinations = QUEUE_DESTINATIONS;

  ngOnInit(): void {
    const user = this.getStoredUser();
    this.facilityId = user?.facility || '';
    this.currentUser = this.userDisplayName(user) || 'Reception';
    this.userRole = (user?.role ?? '').toLowerCase();

    // Lock the working station to the user's primary allowed destination
    const allowed = this.allowedDestinations;
    if (allowed.length > 0 && !allowed.includes(this.currentStation)) {
      this.currentStation = allowed[0];
    }

    this.queueSubscription = this.queueService.tickets$.subscribe((tickets) => {
      this.tickets = tickets;
    });
    this.queueService.load(this.facilityId).subscribe({
      error: () =>
        this.showMessage('Unable to load visit tickets. Please try again.'),
    });
    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (patients) => (this.patients = patients),
      error: () =>
        this.showMessage('Unable to load patients. Please try again.'),
    });
  }

  ngOnDestroy(): void {
    this.queueSubscription?.unsubscribe();
  }

  get stationTickets(): VisitTicket[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.tickets
      .filter(
        (ticket) =>
          ticket.destination === this.currentStation &&
          ticket.status !== 'Completed',
      )
      .filter(
        (ticket) =>
          !term ||
          ticket.patientName.toLowerCase().includes(term) ||
          ticket.ticketNumber.toLowerCase().includes(term),
      )
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Called' ? -1 : 1;
        if (a.priority !== b.priority) return a.priority === 'Urgent' ? -1 : 1;
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      });
  }

  get queuedCount(): number {
    return this.tickets.filter(
      (ticket) =>
        ticket.destination === this.currentStation &&
        ticket.status === 'Queued',
    ).length;
  }

  get waitingCount(): number {
    return this.tickets.filter((ticket) => ticket.status === 'Queued').length;
  }

  countFor(destination: QueueDestination): number {
    return this.tickets.filter(
      (ticket) =>
        ticket.destination === destination && ticket.status !== 'Completed',
    ).length;
  }

  createTicket(): void {
    const patient = this.patients.find(
      (entry) => entry.id === this.selectedPatientId,
    );
    if (!patient) {
      this.showMessage('Choose a registered patient to create a ticket.');
      return;
    }

    console.log('Creating ticket for patient:', patient);
    this.queueService
      .createTicket(
        {
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientAge: patient.age,
          patientGender: patient.gender,
          destination: this.selectedDestination,
          priority: this.selectedPriority,
        },
        this.facilityId,
      )
      .subscribe({
        next: (ticket) => {
          this.selectedPatientId = '';
          this.selectedPriority = 'Normal';
          this.showMessage(
            `${ticket.ticketNumber} sent to ${ticket.destination}.`,
            'app-snackbar-success',
          );
        },
        error: () =>
          this.showMessage(
            'Unable to create the visit ticket. Please try again.',
          ),
      });
  }

  callNext(): void {
    this.queueService.callNext(this.currentStation, this.facilityId).subscribe({
      next: (ticket) => {
        if (!ticket) {
          this.showMessage(
            `No patients are waiting for ${this.currentStation}.`,
          );
          return;
        }
        this.showMessage(
          `Now calling ${ticket.patientName} (${ticket.ticketNumber}).`,
          'app-snackbar-success',
        );
      },
      error: () =>
        this.showMessage('Unable to call the next patient. Please try again.'),
    });
  }

  completeTicket(ticket: VisitTicket): void {
    this.queueService.completeTicket(ticket.id, this.facilityId).subscribe({
      next: () =>
        this.showMessage(
          `${ticket.ticketNumber} marked as complete.`,
          'app-snackbar-success',
        ),
      error: () =>
        this.showMessage('Unable to complete this ticket. Please try again.'),
    });
  }

  forwardTicket(ticket: VisitTicket): void {
    const destination = this.forwardDestinations[ticket.id];
    if (!destination || destination === ticket.destination) {
      this.showMessage('Choose a different destination before forwarding.');
      return;
    }
    this.queueService
      .forwardTicket(ticket.id, destination, this.facilityId)
      .subscribe({
        next: () =>
          this.showMessage(
            `${ticket.ticketNumber} forwarded to ${destination}.`,
            'app-snackbar-success',
          ),
        error: () =>
          this.showMessage('Unable to forward this ticket. Please try again.'),
      });
  }

  recordConsultation(ticket: VisitTicket): void {
    console.log('Recording consultation for ticket:', ticket);
    const user = this.getStoredUser();
    const doctorId = String(user?.id || this.currentUser);
    const dialogRef = this.dialog.open(AddVisitRecordDialogComponent, {
      width: '90vw',
      maxWidth: '640px',
      maxHeight: '90vh',
      data: {
        mode: 'create',
        doctors: [{ id: doctorId, name: this.currentUser }],
        initialValue: { doctor: doctorId },
        nextDestinations: this.destinations.filter(
          (destination) => destination !== 'Consultation',
        ),
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((record: VisitRecordFormValue | undefined) => {
        if (!record?.nextDestination) return;
        this.patientsService
          .createPatientVisitHistory(ticket.patientId, record, this.facilityId)
          .subscribe({
            next: () => {
              this.queueService
                .forwardTicket(
                  ticket.id,
                  record.nextDestination!,
                  this.facilityId,
                )
                .subscribe({
                  next: () =>
                    this.showMessage(
                      `Consultation saved and ${ticket.ticketNumber} sent to ${record.nextDestination}.`,
                      'app-snackbar-success',
                    ),
                  error: () =>
                    this.showMessage(
                      'Consultation was saved, but the ticket could not be forwarded. Please try again.',
                    ),
                });
            },
            error: () =>
              this.showMessage(
                'Unable to save the consultation record. The ticket was not forwarded.',
              ),
          });
      });
  }

  statusClass(ticket: VisitTicket): string {
    if (ticket.status === 'Called') return 'bg-blue-100 text-blue-700';
    if (ticket.status === 'In service') return 'bg-violet-100 text-violet-700';
    return ticket.priority === 'Urgent'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-amber-100 text-amber-700';
  }

  priorityClass(priority: TicketPriority): string {
    return priority === 'Urgent'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';
  }

  private showMessage(
    message: string,
    panelClass = 'app-snackbar-error',
  ): void {
    this.snackBar.open(message, 'Close', { duration: 3500, panelClass });
  }

  private getStoredUser(): any | null {
    try {
      return JSON.parse(localStorage.getItem('afyora.user') || 'null');
    } catch {
      return null;
    }
  }

  private userDisplayName(user: any | null): string {
    if (!user) return '';
    return (
      user.fullName ||
      `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim()
    );
  }
}
