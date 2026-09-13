import {
  AccountStatus,
  InvitationStatus,
  UserRole,
} from "../../../backend/src/constants/account-policy";
import { ApiResponse, del, get, patch, post } from "./axios-instance";

export interface AccountRegistrationRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface ManagedUser {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
}

export interface ManagedInvitation {
  id: number;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export async function getSetupStatus(): Promise<boolean> {
  const response = await get<ApiResponse<{ setupRequired: boolean }>>(
    "/setup/status"
  );
  return response.data.setupRequired;
}

export async function completeInitialSetup(
  account: AccountRegistrationRequest
): Promise<void> {
  await post("/setup", account);
}

export async function registerWithInvitation(
  invitationToken: string,
  account: AccountRegistrationRequest
): Promise<void> {
  await post("/registration", { ...account, invitationToken });
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const response = await get<ApiResponse<ManagedUser[]>>("/admin/users");
  return response.data;
}

export async function updateManagedUser(
  userId: number,
  updates: { role?: UserRole; status?: AccountStatus }
): Promise<void> {
  await patch(`/admin/users/${userId}`, updates);
}

export async function getManagedInvitations(): Promise<ManagedInvitation[]> {
  const response = await get<ApiResponse<ManagedInvitation[]>>(
    "/admin/invitations"
  );
  return response.data;
}

export async function createManagedInvitation(
  lifetimeHours: number
): Promise<{ token: string; expiresAt: string }> {
  const response = await post<
    ApiResponse<{ token: string; expiresAt: string }>
  >("/admin/invitations", { lifetimeHours });
  return response.data;
}

export async function revokeManagedInvitation(
  invitationId: number
): Promise<void> {
  await del(`/admin/invitations/${invitationId}`);
}
