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
  'clinical_ai',
  'pharmacy',
  'laboratory',
  'radiology',
  'billing',
  'insurance',
  'inventory',
  'reports',
  'employees',
  'departments',
  'roles',
] as const;

export type ModuleKey = (typeof ALL_MODULES)[number];

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
/** Stores the resolved_modules list returned by the backend on login. */
const RESOLVED_MODULES_KEY = 'afyora.resolvedModules';

/** Modules that are always-on — they are never gated by the facility-module check. */
const ALWAYS_ON_MODULES: string[] = [
  'dashboard_overview',
  'visit_queue',
  'roles',
];

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  // Reactive permissions signal — components can use this directly
  private readonly _permissions = signal<PermissionsMap>(
    this._loadPermissions(),
  );

  // Reactive role signal — updated alongside permissions so computed()s stay in sync
  private readonly _role = signal<string | null>(this._readRoleFromStorage());

  /**
   * Resolved modules as returned by the backend (includes deps + always-on).
   * Sidebar drives nav visibility from this list.
   */
  private readonly _resolvedModules = signal<string[]>(
    this._loadResolvedModules(),
  );

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
   * Returns true if the given module key is in the facility's resolved_modules list.
   * System admins bypass this check.
   * Always-on modules (dashboard_overview, visit_queue, roles) always return true.
   */
  isModuleEnabled(moduleKey: string): boolean {
    // Only system-level admins bypass the facility module gate
    if (this._role() === 'admin') return true;
    if (ALWAYS_ON_MODULES.includes(moduleKey)) return true;
    const resolved = this._resolvedModules();
    // If the list is empty (not yet loaded / pre-module-feature facilities)
    // fall back to allowing everything so old sessions don't break.
    if (!resolved.length) return true;
    return resolved.includes(moduleKey);
  }

  /**
   * Check whether the current user has access to a specific module and action.
   * Two-stage check: facility-module gate first, then RBAC.
   * facility_admin always passes RBAC but is still subject to module gate.
   */
  hasPermission(
    module: ModuleKey,
    action?: 'create' | 'read' | 'update' | 'delete',
  ): boolean {
    // Stage 1: facility-module gate (system admin bypasses)
    if (!this.isModuleEnabled(module)) return false;

    // Stage 2: RBAC gate
    if (this.isFacilityAdmin()) return true;
    const modulePerm = this._permissions()?.[module];
    if (modulePerm === undefined || modulePerm === null) return false;
    if (typeof modulePerm === 'boolean') {
      return modulePerm;
    }
    if (typeof modulePerm === 'object') {
      if (!action) {
        return !!(
          modulePerm.read ||
          modulePerm.create ||
          modulePerm.update ||
          modulePerm.delete
        );
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
      return {
        create: modulePerm,
        read: modulePerm,
        update: modulePerm,
        delete: modulePerm,
      };
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
    if (this.isFacilityAdmin()) {
      return ALL_MODULES.filter((m) => this.isModuleEnabled(m));
    }
    return ALL_MODULES.filter((m) => this.hasPermission(m));
  }

  /**
   * Called after login to store the permissions from the API response.
   * The permissions object comes from UserSerializer.get_permissions().
   */
  setPermissions(permissions: PermissionsMap): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        PERMISSIONS_STORAGE_KEY,
        JSON.stringify(permissions),
      );
    }
    this._permissions.set(permissions);

    // Auto-derive resolved modules from permissions if they haven't been
    // explicitly set yet (i.e. the backend didn't return resolved_modules).
    const alreadyCached =
      typeof localStorage !== 'undefined' &&
      !!localStorage.getItem(RESOLVED_MODULES_KEY);
    if (!alreadyCached && !this._resolvedModules().length) {
      const derived = this._deriveModulesFromPermissions(
        permissions as unknown as Record<string, unknown>,
      );
      this._resolvedModules.set(derived);
    }
  }

  /**
   * Store the resolved_modules list returned by the backend.
   * Call this after login or after a manage-modules update.
   */
  setResolvedModules(modules: string[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RESOLVED_MODULES_KEY, JSON.stringify(modules));
    }
    this._resolvedModules.set(modules);
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
      localStorage.removeItem(RESOLVED_MODULES_KEY);
    }
    this._permissions.set(this._emptyPermissions());
    this._role.set(null);
    this._resolvedModules.set([]);
  }

  /**
   * Refresh permissions AND role AND resolved modules from localStorage.
   */
  refresh(): void {
    this._permissions.set(this._loadPermissions());
    this._role.set(this._readRoleFromStorage());
    this._resolvedModules.set(this._loadResolvedModules());
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

  private _loadResolvedModules(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      // 1. Explicit cache key (written by setResolvedModules or after manage-modules save)
      const raw = localStorage.getItem(RESOLVED_MODULES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (parsed.length) return parsed;
      }

      // 2. Field on user object (if backend ever sends resolved_modules)
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        if (Array.isArray(user?.resolved_modules) && user.resolved_modules.length) {
          return user.resolved_modules as string[];
        }
        // 3. Derive from the permissions object — any module with at least one
        //    true action is considered enabled for this facility.
        if (user?.permissions && typeof user.permissions === 'object') {
          return this._deriveModulesFromPermissions(
            user.permissions as Record<string, unknown>,
          );
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Build a resolved-modules list from a permissions map.
   * A module is included if at least one CRUD action is true.
   * Always-on modules are always included.
   */
  private _deriveModulesFromPermissions(
    permissions: Record<string, unknown>,
  ): string[] {
    const enabled = new Set<string>(ALWAYS_ON_MODULES);
    for (const [module, perms] of Object.entries(permissions)) {
      if (typeof perms === 'boolean') {
        if (perms) enabled.add(module);
      } else if (typeof perms === 'object' && perms !== null) {
        const p = perms as Record<string, boolean>;
        if (p['create'] || p['read'] || p['update'] || p['delete']) {
          enabled.add(module);
        }
      }
    }
    return Array.from(enabled);
  }

  private _emptyPermissions(): PermissionsMap {
    return Object.fromEntries(
      ALL_MODULES.map((m) => [
        m,
        { create: false, read: false, update: false, delete: false },
      ]),
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
