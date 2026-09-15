import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of } from 'rxjs';
import { debounceTime, filter, switchMap, tap, catchError, map, startWith } from 'rxjs/operators';
import { ClinicalConcept, KnhtsConceptSearchResult } from '../../../models';
import { KnhtsService } from '../../../services/knhts.service';

@Component({
  selector: 'app-knhts-concept-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './knhts-concept-search.component.html',
  styleUrls: ['./knhts-concept-search.component.css']
})
export class KnhtsConceptSearchComponent implements OnInit {
  @Input() label = 'Diagnosis (KNHTS Coded)';
  @Input() placeholder = 'Search clinical concepts... (e.g. Malaria)';
  @Input() initialConcept?: ClinicalConcept;
  @Input() required = true;

  @Output() conceptSelected = new EventEmitter<ClinicalConcept | null>();

  private readonly knhtsService = inject(KnhtsService);
  
  readonly searchControl = new FormControl<string | KnhtsConceptSearchResult>('');
  filteredOptions$!: Observable<KnhtsConceptSearchResult[]>;
  isLoading = false;
  
  selectedConcept: ClinicalConcept | null = null;

  ngOnInit(): void {
    if (this.initialConcept) {
      this.selectedConcept = this.initialConcept;
      this.searchControl.setValue(this.initialConcept as KnhtsConceptSearchResult, { emitEvent: false });
    }

    this.filteredOptions$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(600),
      map(value => (typeof value === 'string' ? value : value?.text || '')),
      tap((searchTerm) => {
        if (!searchTerm) {
          this.selectedConcept = null;
          this.conceptSelected.emit(null);
        }
      }),
      filter(value => value.length > 2),
      tap(() => (this.isLoading = true)),
      switchMap(value =>
        this.knhtsService.searchConcepts(value).pipe(
          catchError(() => of([])),
          tap(() => (this.isLoading = false))
        )
      )
    );
  }

  displayFn(concept: KnhtsConceptSearchResult | null): string {
    return concept ? (concept.display || concept.text || '') : '';
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const concept = event.option.value as KnhtsConceptSearchResult;
    this.selectedConcept = concept;
    this.conceptSelected.emit(concept);
  }

  get isCompliant(): boolean {
    return this.knhtsService.isKnhtsCompliantConcept(this.selectedConcept);
  }

  get hasMinSearchLength(): boolean {
    const val = this.searchControl.value;
    return typeof val === 'string' && val.length > 2;
  }
  
  clearSelection(event: Event): void {
    event.stopPropagation();
    this.searchControl.setValue('');
    this.selectedConcept = null;
    this.conceptSelected.emit(null);
  }
}
