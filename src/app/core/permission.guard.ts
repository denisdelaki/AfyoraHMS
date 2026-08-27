import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionsService, ModuleKey } from './permissions.service';

/**
 * Route guard that checks whether the logged-in user has access to a module.
 *
 * Usage in routes:
 *   canActivate: [permissionGuard],
 *   data: { permission: 'pharmacy' }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as ModuleKey | undefined;

  // No permission specified — allow (auth guard handles login check)
  if (!requiredPermission) return true;

  if (permissionsService.hasPermission(requiredPermission)) {
    return true;
  }

  // Redirect to dashboard with a query param so dashboard can show a message
  return router.createUrlTree(['/dashboard'], {
    queryParams: { blocked: requiredPermission },
  });
};
