import LoginForm from "@/components/LoginForm";
import AccountRegistrationForm from "@/components/AccountRegistrationForm";
import { completeInitialSetup, getSetupStatus } from "@/api/account-api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/hooks/use-toast";

const Login = () => {
  const { toast } = useToast();
  const setup = useQuery({
    queryKey: ["setupStatus"],
    queryFn: getSetupStatus,
    retry: false,
  });

  if (setup.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (setup.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        Unable to determine the server setup status. Check the server and try again.
      </div>
    );
  }

  if (setup.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <AccountRegistrationForm
          title="Create administrator account"
          description="Complete the one-time setup for this password manager."
          submitLabel="Create administrator"
          onSubmit={async (values) => {
            try {
              await completeInitialSetup(values);
              await setup.refetch();
              toast({ title: "Administrator created", description: "You can now sign in." });
            } catch {
              toast({ title: "Setup failed", description: "Review your details and try again.", variant: "destructive" });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
};

export default Login;
