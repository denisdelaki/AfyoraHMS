import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  FacilityOnboardingRequest,
  FacilityOnboardingResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('/auth');
  private readonly storageKeys = {
    user: 'afyora.user',
    accessToken: 'afyora.accessToken',
    refreshToken: 'afyora.refreshToken',
  };
  private readonly signupDraftStorageKey = 'afyora.signupDraft';
  private readonly organizationIdStorageKey = 'afyora.organizationId';
  private readonly onboardingDraftStorageKey = 'afyora.onboardingDraft';

  login(payload: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login/`, payload)
      .pipe(
        tap((response) => {
          this.saveLoginSession(response);
        }),
      );
  }

  signup(payload: SignupRequest): Observable<ApiResponse<SignupResponse>> {
    return this.http.post<ApiResponse<SignupResponse>>(
      `${this.baseUrl}/signup/`,
      payload,
    );
  }

  completeFacilityOnboarding(
    payload: FacilityOnboardingRequest,
  ): Observable<ApiResponse<FacilityOnboardingResponse>> {
    return this.http.post<ApiResponse<FacilityOnboardingResponse>>(
      `${this.baseUrl}/onboarding/complete/`,
      payload,
    );
  }

  refreshToken(refreshToken: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.baseUrl}/refresh`,
      {
        refreshToken,
      },
    );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/logout`, {}).pipe(
      finalize(() => {
        this.clearAuthData();
      }),
    );
  }

  clearAuthData(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    localStorage.removeItem(this.storageKeys.user);
    localStorage.removeItem(this.storageKeys.accessToken);
    localStorage.removeItem(this.storageKeys.refreshToken);
    localStorage.removeItem(this.signupDraftStorageKey);
    localStorage.removeItem(this.onboardingDraftStorageKey);
    localStorage.removeItem(this.organizationIdStorageKey);
  }

  private saveLoginSession(response: unknown): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    const payload = (response as { data?: unknown })?.data ?? response;
    const session = payload as {
      accessToken?: string;
      access_token?: string;
      refreshToken?: string;
      refresh_token?: string;
      user?: unknown;
    };

    const accessToken = session.accessToken ?? session.access_token;
    const refreshToken = session.refreshToken ?? session.refresh_token;

    if (accessToken) {
      localStorage.setItem(this.storageKeys.accessToken, accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(this.storageKeys.refreshToken, refreshToken);
    }

    if (session.user) {
      localStorage.setItem(this.storageKeys.user, JSON.stringify(session.user));
    }
  }

  private isStorageAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
