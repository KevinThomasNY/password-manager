import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editUserPasswordSchema } from "../../../backend/src/validation/user-validation";
import { editUserProfile } from "@/api/user-api";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/hooks/use-toast";

type EditUserPasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

const UpdatePassword = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<EditUserPasswordFormValues>({
    resolver: zodResolver(editUserPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      const userId = 4;
      return editUserProfile(userId, formData);
    },
    onSuccess: (data) => {
      console.log("API Response:", data);

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ["profileInformation"] });
    },
    onError: (error) => {
      console.error("Error updating password:", error);
      toast({
        title: "Password Update Failed",
        description:
          "There was an error updating your password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserPasswordFormValues) => {
    const formData = new FormData();
    formData.append("currentPassword", data.currentPassword.trim());
    formData.append("newPassword", data.newPassword.trim());
    formData.append("confirmNewPassword", data.confirmNewPassword.trim());

    mutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Current Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="New Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm New Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={!isDirty || mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdatePassword;
