export type UserRole = 'Customer' | 'Florist' | 'Courier' | 'Administrator';

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  emailConfirmed: boolean;
  isBlocked: boolean;
  isDeleted: boolean;
};
