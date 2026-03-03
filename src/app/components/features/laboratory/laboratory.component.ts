import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { combineLatest, map, startWith } from 'rxjs';
import {
  LabRequest,
  LabResult,
  LabTest,
  SubmitLabResultPayload,
} from '../../../models/laboratory.models';
import { LaboratoryService } from '../../../services/laboratory.service';
import { EnterLabResultsDialogComponent } from '../../dialogs/enter-lab-results-dialog/enter-lab-results-dialog.component';
import { NewLabOrderDialogComponent } from '../../dialogs/new-lab-order-dialog/new-lab-order-dialog.component';

type LaboratoryTab = 'requests' | 'results' | 'catalog';

@Component({
  selector: 'app-laboratory',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatIconModule,
  ],
  templateUrl: './laboratory.component.html',
  styleUrl: './laboratory.component.css',
})
export class LaboratoryComponent {
  private readonly dialog = inject(MatDialog);
  private readonly laboratoryService = inject(LaboratoryService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly tabs: LaboratoryTab[] = ['requests', 'results', 'catalog'];
  activeTab: LaboratoryTab = 'requests';

  readonly tests$ = this.laboratoryService.getTests();
  readonly requests$ = this.laboratoryService.getRequests();
  readonly results$ = this.laboratoryService.getResults();

  readonly filteredRequests$ = combineLatest([
    this.requests$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([requests, term]) => {
      const normalizedTerm = term.trim().toLowerCase();
      if (!normalizedTerm) {
        return requests;
      }

      return requests.filter(
        (request) =>
          request.patient.toLowerCase().includes(normalizedTerm) ||
          request.id.toLowerCase().includes(normalizedTerm) ||
          request.test.toLowerCase().includes(normalizedTerm),
      );
    }),
  );

  readonly stats$ = this.requests$.pipe(
    map((requests) => ({
      totalRequests: requests.length,
      pending: requests.filter((r) => r.status === 'Pending').length,
      inProgress: requests.filter((r) => r.status === 'In Progress').length,
      completed: requests.filter(
        (r) => r.status === 'Completed' || r.status === 'Approved',
      ).length,
    })),
  );

  setActiveTab(index: number) {
    this.activeTab = this.tabs[index] ?? 'requests';
  }

  openNewOrderDialog(tests: LabTest[]) {
    this.dialog
      .open(NewLabOrderDialogComponent, {
        width: '760px',
        maxWidth: '95vw',
        data: { tests },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) {
          this.laboratoryService.createOrder(payload);
        }
      });
  }

  startTest(labId: string) {
    this.laboratoryService.startTest(labId);
  }

  openEnterResultsDialog(request: LabRequest) {
    this.dialog
      .open(EnterLabResultsDialogComponent, {
        width: '860px',
        maxWidth: '95vw',
        data: { request },
      })
      .afterClosed()
      .subscribe((payload: SubmitLabResultPayload | undefined) => {
        if (payload) {
          this.laboratoryService.submitResult(payload);
        }
      });
  }

  approveResult(labId: string) {
    this.laboratoryService.approveResult(labId);
  }

  requestRetest(labId: string) {
    this.laboratoryService.startTest(labId);
  }

  trackByRequest(index: number, request: LabRequest) {
    return request.id;
  }

  trackByResult(index: number, result: LabResult) {
    return result.labId;
  }

  trackByTest(index: number, test: LabTest) {
    return test.id;
  }
}
