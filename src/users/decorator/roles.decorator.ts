import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../const/roles.const';

export const ROLES_KEY = 'user_roles';

// @Roles(RoleEnum.ADMIN)
export const Roles = (role: RoleEnum) => SetMetadata(ROLES_KEY, role);
