import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { editUserProfileSchema } from "../../../backend/src/validation/user-validation";
import { ProfileInformation, editUserProfile } from "@/api/user-api";
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

type EditUserProfileFormValues = {
  userName: string;
  firstName: string;
  lastName: string;
};

interface UpdateProfileProps {
  profileQuery: UseQueryResult<ProfileInformation>;
}

const UpdateProfile = ({ profileQuery }: UpdateProfileProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: profileData, isLoading, isError } = profileQuery;

  const form = useForm<EditUserProfileFormValues>({
    resolver: zodResolver(editUserProfileSchema),
    defaultValues: {
      userName: profileData?.userName || "",
      firstName: profileData?.firstName || "",
      lastName: profileData?.lastName || "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (profileData) {
      reset({
        userName: profileData.userName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
    }
  }, [profileData, reset]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      const userId = 4;
      return editUserProfile(userId, formData);
    },
    onSuccess: (updatedProfile: ProfileInformation) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      reset({
        userName: updatedProfile.userName,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast({
        title: "Profile Update Failed",
        description:
          "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserProfileFormValues) => {
    const formData = new FormData();
    formData.append("userName", data.userName.trim());
    formData.append("firstName", data.firstName.trim());
    formData.append("lastName", data.lastName.trim());

    mutation.mutate(formData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error loading profile information</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={!isDirty || mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdateProfile;
