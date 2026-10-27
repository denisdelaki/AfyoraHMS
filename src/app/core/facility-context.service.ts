import { Injectable } from '@angular/core';

const USER_KEY = 'afyora.user';
const FACILITY_ID_KEY = 'afyora.facilityId'; // explicit override key

/**
 * Single source of truth for the current user's facilityId.
 *
 * Resolution order (first non-empty value wins):
 *  1. localStorage key "afyora.facilityId"  (explicit override set at login/onboarding)
 *  2. user.facility_id
 *  3. user.facility
 *  4. user.facilityId
 *  5. user.organization_id
 *  6. user.organization
 */
@Injectable({ providedIn: 'root' })
export class FacilityContextService {
  /** Returns the facility ID as a string, or '' if not found. */
  getFacilityId(): string {
    // 1. Explicit override key
    const explicit = this._ls(FACILITY_ID_KEY);
    if (explicit) return explicit;

    // 2-6. Parse the stored user object
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return '';
      const u = JSON.parse(raw) as Record<string, unknown>;
      for (const key of [
        'facility_id',
        'facility',
        'facilityId',
        'organization_id',
        'organization',
      ]) {
        const v = u[key];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v);
        }
      }
    } catch {
      // ignore parse errors
    }
    return '';
  }

  /** Convenience — returns facility ID as a number, or 0 if not found/parseable. */
  getFacilityIdNum(): number {
    const id = this.getFacilityId();
    const n = Number(id);
    return isNaN(n) ? 0 : n;
  }

  /**
   * Explicitly cache the facility ID (called after onboarding or login
   * when the backend returns it as a top-level field outside the user object).
   */
  setFacilityId(id: string | number): void {
    localStorage.setItem(FACILITY_ID_KEY, String(id));
  }

  private _ls(key: string): string {
    try {
      return localStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  }
}
