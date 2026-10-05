import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminService } from '../services/admin.service';

export const adminGuard: CanActivateFn = () => {
  const admin = inject(AdminService);
  const router = inject(Router);

  if (admin.isAuthenticated()) return true;
  return router.createUrlTree(['/m-root-admin/login']);
};
