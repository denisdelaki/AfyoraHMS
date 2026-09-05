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

export interface ModuleActionPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export type PermissionValue = boolean | ModuleActionPermissions;

export type PermissionsMap = Record<ModuleKey, PermissionValue>;

const PERMISSIONS_STORAGE_KEY = 'afyora.permissions';
const USER_STORAGE_KEY = 'afyora.user';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  // Reactive permissions signal — components can use this directly
  private readonly _permissions = signal<PermissionsMap>(this._loadPermissions());

  // Reactive role signal — updated alongside permissions so computed()s stay in sync
  private readonly _role = signal<string | null>(this._readRoleFromStorage());

  /** Read-only view of the current permissions map */
  readonly permissions = this._permissions.asReadonly();

  /** True if the current user is a facility_admin (unrestricted access) */
  readonly isFacilityAdmin = computed(() => {
    const role = this._role();
    return role === 'facility_admin' || role === 'admin';
  });

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Check whether the current user has access to a specific module and action.
   * facility_admin always returns true.
   */
  hasPermission(module: ModuleKey, action?: 'create' | 'read' | 'update' | 'delete'): boolean {
    if (this.isFacilityAdmin()) return true;
    const modulePerm = this._permissions()?.[module];
    if (modulePerm === undefined || modulePerm === null) return false;
    if (typeof modulePerm === 'boolean') {
      return modulePerm;
    }
    if (typeof modulePerm === 'object') {
      if (!action) {
        return !!(modulePerm.read || modulePerm.create || modulePerm.update || modulePerm.delete);
      }
      return !!modulePerm[action];
    }
    return false;
  }

  /**
   * Get exact action breakdown for a specific module.
   */
  getModulePermissions(module: ModuleKey): ModuleActionPermissions {
    if (this.isFacilityAdmin()) {
      return { create: true, read: true, update: true, delete: true };
    }
    const modulePerm = this._permissions()?.[module];
    if (typeof modulePerm === 'boolean') {
      return { create: modulePerm, read: modulePerm, update: modulePerm, delete: modulePerm };
    }
    if (typeof modulePerm === 'object' && modulePerm) {
      return {
        create: !!modulePerm.create,
        read: !!modulePerm.read,
        update: !!modulePerm.update,
        delete: !!modulePerm.delete,
      };
    }
    return { create: false, read: false, update: false, delete: false };
  }

  /**
   * Returns modules the current user has access to.
   */
  allowedModules(): ModuleKey[] {
    if (this.isFacilityAdmin()) return [...ALL_MODULES];
    return ALL_MODULES.filter(m => this.hasPermission(m));
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
   * Update the reactive role signal (call this after login so isFacilityAdmin re-evaluates immediately).
   */
  setRole(role: string | null): void {
    this._role.set(role);
  }

  /**
   * Clear permissions on logout.
   */
  clearPermissions(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    }
    this._permissions.set(this._emptyPermissions());
    this._role.set(null);
  }

  /**
   * Refresh permissions AND role from localStorage (useful after session restore).
   */
  refresh(): void {
    this._permissions.set(this._loadPermissions());
    this._role.set(this._readRoleFromStorage());
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
    return Object.fromEntries(
      ALL_MODULES.map(m => [m, { create: false, read: false, update: false, delete: false }])
    ) as PermissionsMap;
  }

  private _readRoleFromStorage(): string | null {
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

  /** @deprecated Use _readRoleFromStorage — kept for any leftover callers. */
  private _getUserRole(): string | null {
    return this._readRoleFromStorage();
  }
}
