import { Injectable, signal, computed } from '@angular/core';

// ============================================================================
// Permission Module Keys — must match the backend ALL_MODULE_PERMISSIONS list
// ============================================================================
export const ALL_MODULES = [
  'dashboard_overview',
  'patients',
  'appointments',
  'visit_queue',
  'ehr',
  'pharmacy',
  'laboratory',
  'radiology',
  'billing',
  'inventory',
  'reports',
  'employees',
  'departments',
  'roles',
] as const;

export type ModuleKey = typeof ALL_MODULES[number];

export type PermissionsMap = Record<ModuleKey, boolean>;

const PERMISSIONS_STORAGE_KEY = 'afyora.permissions';
const USER_STORAGE_KEY = 'afyora.user';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  // Reactive permissions signal — components can use this directly
  private readonly _permissions = signal<PermissionsMap>(this._loadPermissions());

  /** Read-only view of the current permissions map */
  readonly permissions = this._permissions.asReadonly();

  /** True if the current user is a facility_admin (unrestricted access) */
  readonly isFacilityAdmin = computed(() => {
    return this._getUserRole() === 'facility_admin' ||
           this._getUserRole() === 'admin';
  });

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Check whether the current user has access to a specific module.
   * facility_admin always returns true.
   */
  hasPermission(module: ModuleKey): boolean {
    if (this.isFacilityAdmin()) return true;
    return this._permissions()[module] ?? false;
  }

  /**
   * Returns modules the current user has access to.
   */
  allowedModules(): ModuleKey[] {
    if (this.isFacilityAdmin()) return [...ALL_MODULES];
    return ALL_MODULES.filter(m => this._permissions()[m]);
  }

  /**
   * Called after login to store the permissions from the API response.
   * The permissions object comes from UserSerializer.get_permissions().
   */
  setPermissions(permissions: PermissionsMap): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
    }
    this._permissions.set(permissions);
  }

  /**
   * Clear permissions on logout.
   */
  clearPermissions(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    }
    this._permissions.set(this._emptyPermissions());
  }

  /**
   * Refresh permissions from localStorage (useful after session restore).
   */
  refresh(): void {
    this._permissions.set(this._loadPermissions());
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private _loadPermissions(): PermissionsMap {
    if (typeof localStorage === 'undefined') {
      return this._emptyPermissions();
    }

    // Check stored permissions first
    const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as PermissionsMap;
      } catch {
        // fall through
      }
    }

    // Fall back to deriving from user object in localStorage
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.permissions) {
          return user.permissions as PermissionsMap;
        }
      } catch {
        // fall through
      }
    }

    return this._emptyPermissions();
  }

  private _emptyPermissions(): PermissionsMap {
    return Object.fromEntries(ALL_MODULES.map(m => [m, false])) as PermissionsMap;
  }

  private _getUserRole(): string | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user?.role ?? null;
    } catch {
      return null;
    }
  }
}
