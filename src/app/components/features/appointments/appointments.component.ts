import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Appointment } from '../../../models';
import { AppointmentsService } from '../../../services';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, MatCardModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.css',
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);

  appointments: Appointment[] = [];

  ngOnInit(): void {
    this.appointmentsService.getAppointments().subscribe({
      next: ({ data }) => {
        this.appointments = data;
      },
      error: () => {},
    });
  }
}
