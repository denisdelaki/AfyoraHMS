import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PageRequest } from '../../../core/pagination';

@Component({
  selector: 'app-pagination-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm"
    >
      <p class="m-0 text-slate-600">
        Showing {{ total === 0 ? 0 : (page - 1) * pageSize + 1 }}–{{
          Math.min(page * pageSize, total)
        }}
        of {{ total }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-2 text-slate-600">
          Rows per page
          <select
            class="rounded-md border border-slate-300 bg-white px-2 py-1.5"
            [value]="pageSize"
            [disabled]="loading"
            (change)="changePageSize($event)"
          >
            <option *ngFor="let size of pageSizes" [value]="size">
              {{ size }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="loading || page <= 1"
          (click)="goToPage(page - 1)"
        >
          Previous
        </button>
        <span class="whitespace-nowrap text-slate-600">
          Page {{ page }} of {{ pageCount }}
        </span>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="loading || page >= pageCount"
          (click)="goToPage(page + 1)"
        >
          Next
        </button>
      </div>
    </div>
  `,
})
export class PaginationControlsComponent {
  @Input() page = 1;
  @Input() pageSize = 25;
  @Input() total = 0;
  @Input() loading = false;
  @Output() readonly pageChange = new EventEmitter<PageRequest>();

  readonly pageSizes = [25, 50, 100];
  readonly Math = Math;

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount || page === this.page) return;
    this.pageChange.emit({ page, pageSize: this.pageSize });
  }

  changePageSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    if (this.pageSizes.includes(pageSize)) {
      this.pageChange.emit({ page: 1, pageSize });
    }
  }
}
