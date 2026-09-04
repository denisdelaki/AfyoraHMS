import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionsService, ModuleKey } from './permissions.service';
import { ToastService } from './toast.service';

/**
 * Route guard that checks whether the logged-in user has access to a module.
 *
 * Usage in routes:
 *   canActivate: [permissionGuard],
 *   data: { permission: 'pharmacy' }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionsService = inject(PermissionsService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as ModuleKey | undefined;

  // No permission specified — allow (auth guard handles login check)
  if (!requiredPermission) return true;

  if (permissionsService.hasPermission(requiredPermission)) {
    return true;
  }

  const moduleName = requiredPermission.replace('_', ' ').toUpperCase();
  toastService.showWarning(
    `Access Denied: Your role does not have permission to access the ${moduleName} module.`
  );

  // Redirect to dashboard
  return router.createUrlTree(['/dashboard'], {
    queryParams: { blocked: requiredPermission },
  });
};
