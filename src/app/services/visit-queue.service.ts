import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  QUEUE_DESTINATIONS,
  QueueDestination,
  TicketMovement,
  TicketPriority,
  TicketStatus,
  VisitTicket,
} from '../models';

type NewTicket = {
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  destination: QueueDestination;
  priority: TicketPriority;
};

type TicketApiModel = any;

@Injectable({ providedIn: 'root' })
export class VisitQueueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/patients/tickets');
  private readonly ticketsSubject = new BehaviorSubject<VisitTicket[]>([]);
  readonly tickets$ = this.ticketsSubject.asObservable();

  load(facilityId: string | number): Observable<VisitTicket[]> {
    return this.refresh(facilityId);
  }

  refresh(facilityId: string | number): Observable<VisitTicket[]> {
    return this.http.get<unknown>(this.ticketsUrl(facilityId)).pipe(
      map((response) => this.extractCollection(response).map((ticket) => this.mapTicket(ticket))),
      tap((tickets) => this.ticketsSubject.next(tickets)),
    );
  }

  createTicket(input: NewTicket, facilityId: string | number): Observable<VisitTicket> {
    const body = {
      patientId: input.patientId,
      destination: this.toApiDestination(input.destination),
      priority: input.priority.toLowerCase(),
      facilityId,
    };

    return this.http.post<unknown>(`${this.baseUrl}/`, body).pipe(
      map((response) => this.mapTicket(this.extractItem(response))),
      tap(() => this.refresh(facilityId).subscribe()),
    );
  }

  forwardTicket(ticketId: string, destination: QueueDestination, facilityId: string | number): Observable<void> {
    return this.http.post<unknown>(`${this.baseUrl}/${encodeURIComponent(ticketId)}/forward/?facilityId=${encodeURIComponent(facilityId)}`, {
      destination: this.toApiDestination(destination),
    }).pipe(switchMap(() => this.refresh(facilityId)), map(() => void 0));
  }

  completeTicket(ticketId: string, facilityId: string | number): Observable<void> {
    return this.http.post<unknown>(`${this.baseUrl}/${encodeURIComponent(ticketId)}/complete/?facilityId=${encodeURIComponent(facilityId)}`, {})
      .pipe(switchMap(() => this.refresh(facilityId)), map(() => void 0));
  }

  callNext(destination: QueueDestination, facilityId: string | number): Observable<VisitTicket | undefined> {
    return this.http.get<unknown>(this.ticketsUrl(facilityId, destination, 'waiting')).pipe(
      map((response) => this.extractCollection(response).map((ticket) => this.mapTicket(ticket))),
      map((tickets) => this.nextWaitingTicket(tickets)),
      switchMap((ticket) => {
        if (!ticket) return this.refresh(facilityId).pipe(map(() => undefined));
        return this.http.post<unknown>(`${this.baseUrl}/${encodeURIComponent(ticket.id)}/call/?facilityId=${encodeURIComponent(facilityId)}`, {})
          .pipe(switchMap(() => this.refresh(facilityId)), map(() => ticket));
      }),
    );
  }

  private ticketsUrl(facilityId: string | number, destination?: QueueDestination, status?: string): string {
    const params = new URLSearchParams({ facilityId: String(facilityId) });
    if (destination) params.set('destination', this.toApiDestination(destination));
    if (status) params.set('status', status);
    return `${this.baseUrl}/?${params.toString()}`;
  }

  private extractCollection(response: unknown): TicketApiModel[] {
    if (Array.isArray(response)) return response as TicketApiModel[];
    const payload = response as { data?: unknown; results?: unknown; items?: unknown } | null;
    const collection = payload?.results ?? payload?.data ?? payload?.items;
    return Array.isArray(collection) ? collection as TicketApiModel[] : [];
  }

  private extractItem(response: unknown): TicketApiModel {
    const payload = response as { data?: unknown; results?: unknown } | null;
    return ((payload?.data ?? payload?.results ?? response) || {}) as TicketApiModel;
  }

  private mapTicket(ticket: TicketApiModel): VisitTicket {
    const patient = ticket.patient && typeof ticket.patient === 'object' ? ticket.patient : {};
    const movements = ticket.movements ?? ticket.history ?? ticket.transitions ?? [];
    return {
      id: String(ticket.id ?? ticket.ticket_id ?? ''),
      ticketNumber: String(ticket.ticketNumber ?? ticket.ticket_number ?? ticket.number ?? ticket.id ?? 'Ticket'),
      patientId: String(ticket.patientId ?? ticket.patient_id ?? patient.id ?? ''),
      patientName: (ticket.patientName ?? ticket.patient_name ?? patient.fullName ?? patient.name ?? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim()) || 'Patient',
      patientAge: ticket.patientAge ?? ticket.patient_age ?? patient.age,
      patientGender: ticket.patientGender ?? ticket.patient_gender ?? patient.gender,
      destination: this.fromApiDestination(ticket.destination ?? ticket.current_destination),
      priority: this.fromApiPriority(ticket.priority),
      status: this.fromApiStatus(ticket.status),
      createdAt: ticket.createdAt ?? ticket.created_at ?? new Date().toISOString(),
      updatedAt: ticket.updatedAt ?? ticket.updated_at ?? ticket.createdAt ?? ticket.created_at ?? new Date().toISOString(),
      createdBy: ticket.createdBy ?? ticket.created_by ?? '',
      movements: Array.isArray(movements) ? movements.map((movement: TicketApiModel) => this.mapMovement(movement)) : [],
    };
  }

  private mapMovement(movement: TicketApiModel): TicketMovement {
    return {
      from: movement.from ? this.fromApiDestination(movement.from) : null,
      to: this.fromApiDestination(movement.to ?? movement.destination),
      at: movement.at ?? movement.created_at ?? movement.createdAt ?? '',
      by: movement.by ?? movement.user ?? movement.created_by ?? '',
      note: movement.note,
    };
  }

  private nextWaitingTicket(tickets: VisitTicket[]): VisitTicket | undefined {
    return tickets.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'Urgent' ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })[0];
  }

  private toApiDestination(destination: QueueDestination): string {
    return destination.toLowerCase();
  }

  private fromApiDestination(value: unknown): QueueDestination {
    const normalized = String(value || 'reception').toLowerCase();
    return QUEUE_DESTINATIONS.find((destination) => destination.toLowerCase() === normalized) || 'Reception';
  }

  private fromApiPriority(value: unknown): TicketPriority {
    return String(value).toLowerCase() === 'urgent' ? 'Urgent' : 'Normal';
  }

  private fromApiStatus(value: unknown): TicketStatus {
    const normalized = String(value || 'waiting').toLowerCase().replaceAll('_', ' ');
    if (normalized === 'called') return 'Called';
    if (normalized === 'in service' || normalized === 'in progress') return 'In service';
    if (normalized === 'completed' || normalized === 'complete') return 'Completed';
    return 'Queued';
  }
}
