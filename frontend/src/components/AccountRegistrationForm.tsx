import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SECURITY_POLICY } from "../../../backend/src/constants/security-policy";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccountRegistrationRequest } from "@/api/account-api";

const accountSchema = z
  .object({
    userName: z.string().min(1, "Username is required").max(SECURITY_POLICY.USERNAME_MAX_LENGTH),
    firstName: z.string().min(1, "First name is required").max(SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH),
    lastName: z.string().min(1, "Last name is required").max(SECURITY_POLICY.PROFILE_NAME_MAX_LENGTH),
    password: z
      .string()
      .min(
        SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH,
        `Use at least ${SECURITY_POLICY.MASTER_PASSWORD_MIN_LENGTH} characters`
      )
      .max(SECURITY_POLICY.MASTER_PASSWORD_MAX_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface AccountRegistrationFormProps {
  description: string;
  onSubmit: (values: AccountRegistrationRequest) => Promise<void>;
  submitLabel: string;
  title: string;
}

export default function AccountRegistrationForm({
  description,
  onSubmit,
  submitLabel,
  title,
}: AccountRegistrationFormProps) {
  const form = useForm<AccountRegistrationRequest>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      userName: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(["userName", "firstName", "lastName"] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {name === "userName"
                        ? "Username"
                        : name === "firstName"
                          ? "First name"
                          : "Last name"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete={name === "userName" ? "username" : "name"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {(["password", "confirmPassword"] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {name === "password" ? "Master password" : "Confirm master password"}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <p className="text-sm text-muted-foreground">
              Your master password cannot be reset. Losing it means losing access
              to this vault.
            </p>
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating account..." : submitLabel}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
