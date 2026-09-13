import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AccountRegistrationForm from "@/components/AccountRegistrationForm";
import { registerWithInvitation } from "@/api/account-api";
import { useToast } from "@/components/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitationToken] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""
  );

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (!invitationToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p>This invitation link is missing or invalid.</p>
        <Button onClick={() => navigate("/")}>Return to login</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AccountRegistrationForm
        title="Create your account"
        description="This invitation can be used once and may expire."
        submitLabel="Create account"
        onSubmit={async (values) => {
          try {
            await registerWithInvitation(invitationToken, values);
            toast({ title: "Account created", description: "You can now sign in." });
            navigate("/", { replace: true });
          } catch {
            toast({ title: "Registration failed", description: "The invitation may be invalid, expired, or already used.", variant: "destructive" });
          }
        }}
      />
    </div>
  );
}
