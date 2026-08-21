import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse, DashboardOverview } from '../models';
import { DataSyncService } from './data-sync.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dataSync = inject(DataSyncService);
  private readonly baseUrl = apiUrl('/dashboard');

  getOverview(): Observable<ApiResponse<DashboardOverview>> {
    return this.dataSync.query('dashboard:overview', () => this.http.get<ApiResponse<DashboardOverview>>(
      `${this.baseUrl}/overview`,
    ));
  }

  /** Use for live dashboard cards; pauses in background tabs and while offline. */
  watchOverview(intervalMs = 30_000): Observable<ApiResponse<DashboardOverview>> {
    return this.dataSync.smartPoll(
      'dashboard:overview',
      () => this.http.get<ApiResponse<DashboardOverview>>(`${this.baseUrl}/overview`),
      intervalMs,
    );
  }
}
