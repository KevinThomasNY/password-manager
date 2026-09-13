import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createManagedInvitation,
  getManagedInvitations,
  getManagedUsers,
  revokeManagedInvitation,
  updateManagedUser,
} from "@/api/account-api";
import {
  ACCOUNT_POLICY,
  AccountStatus,
  InvitationStatus,
  UserRole,
} from "../../../backend/src/constants/account-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Admin() {
  const { toast } = useToast();
  const currentUserId = useAuthStore((state) => state.userId);
  const [invitationLifetime, setInvitationLifetime] = useState<number>(
    ACCOUNT_POLICY.DEFAULT_INVITATION_LIFETIME_HOURS
  );
  const [newInvitationLink, setNewInvitationLink] = useState("");
  const usersQuery = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getManagedUsers,
  });
  const invitationsQuery = useQuery({
    queryKey: ["adminInvitations"],
    queryFn: getManagedInvitations,
  });

  async function createInvitation() {
    try {
      const invitation = await createManagedInvitation(invitationLifetime);
      const link = `${window.location.origin}/register#token=${encodeURIComponent(invitation.token)}`;
      setNewInvitationLink(link);
      await invitationsQuery.refetch();
      toast({ title: "Invitation created", description: "Copy and share the link securely." });
    } catch {
      toast({ title: "Could not create invitation", variant: "destructive" });
    }
  }

  async function copyInvitation() {
    await navigator.clipboard.writeText(newInvitationLink);
    toast({ title: "Invitation link copied" });
  }

  async function revokeInvitation(invitationId: number) {
    try {
      await revokeManagedInvitation(invitationId);
      await invitationsQuery.refetch();
      toast({ title: "Invitation revoked" });
    } catch {
      toast({ title: "Could not revoke invitation", variant: "destructive" });
    }
  }

  async function changeUser(
    userId: number,
    updates: { role?: UserRole; status?: AccountStatus }
  ) {
    try {
      await updateManagedUser(userId, updates);
      await usersQuery.refetch();
      toast({ title: "User updated" });
    } catch {
      toast({
        title: "Could not update user",
        description: "You cannot remove your own or the final active administrator access.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Administration</h2>
        <p className="text-muted-foreground">
          Manage invitation links and account access. Administrators cannot view user vaults.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create invitation</CardTitle>
          <CardDescription>
            Links are single-use. The token is shown only when the invitation is created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_POLICY.INVITATION_LIFETIME_OPTIONS_HOURS.map((hours) => (
              <Button
                key={hours}
                type="button"
                variant={invitationLifetime === hours ? "default" : "outline"}
                onClick={() => setInvitationLifetime(hours)}
              >
                {hours} hours
              </Button>
            ))}
            <Button type="button" onClick={createInvitation}>
              Generate link
            </Button>
          </div>
          {newInvitationLink && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={newInvitationLink} readOnly aria-label="Invitation link" />
              <Button type="button" onClick={copyInvitation}>Copy link</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Created</th>
                <th className="p-2">Expires</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {(invitationsQuery.data ?? []).map((invitation) => (
                <tr key={invitation.id} className="border-b">
                  <td className="p-2">{formatDate(invitation.createdAt)}</td>
                  <td className="p-2">{formatDate(invitation.expiresAt)}</td>
                  <td className="p-2 capitalize">{invitation.status}</td>
                  <td className="p-2">
                    {invitation.status === InvitationStatus.Active && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => revokeInvitation(invitation.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Disable access without deleting vault data, or promote a trusted user.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">User</th>
                <th className="p-2">Role</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(usersQuery.data ?? []).map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-muted-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="p-2 capitalize">{user.role}</td>
                    <td className="p-2 capitalize">{user.status}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCurrentUser}
                          onClick={() =>
                            changeUser(user.id, {
                              role:
                                user.role === UserRole.Admin
                                  ? UserRole.User
                                  : UserRole.Admin,
                            })
                          }
                        >
                          {user.role === UserRole.Admin ? "Make user" : "Make admin"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isCurrentUser}
                          onClick={() =>
                            changeUser(user.id, {
                              status:
                                user.status === AccountStatus.Active
                                  ? AccountStatus.Disabled
                                  : AccountStatus.Active,
                            })
                          }
                        >
                          {user.status === AccountStatus.Active ? "Disable" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
