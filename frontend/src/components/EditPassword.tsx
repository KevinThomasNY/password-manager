import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPasswordSchema,
  type CreatePasswordFormValues,
} from "../../../backend/src/validation/password-validation";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSecurityQuestions, editPassword } from "@/api/password-api";
import { post } from "@/api/axios-instance";
import GeneratePassword from "./GeneratePassword";
import EditGeneratePassword from "./EditGeneratePassword";
import { usePasswordGeneratorStore } from "@/store/passwordGeneratorStore";

interface EditPasswordProps {
  id: number;
  name: string;
  password: string;
  image?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPassword = ({
  id,
  name,
  password,
  image,
  isOpen,
  onOpenChange,
}: EditPasswordProps) => {
  const queryClient = useQueryClient();

  const {
    data: questionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["passwordQuestions", id],
    queryFn: () => getSecurityQuestions(id),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => editPassword(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      onOpenChange(false);
    },
  });

  const { mutate: decryptPassword } = useMutation({
    mutationFn: async () => {
      const response = await post<{ data: { decrypted: string } }>(
        "/passwords/decrypt-password",
        { password }
      );
      return response.data.decrypted;
    },
    onSuccess: (decrypted) => {
      reset((prevValues) => ({
        ...prevValues,
        password: decrypted,
      }));
    },
  });

  const form = useForm<CreatePasswordFormValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: {
      name: name ?? "",
      password: password ?? "",
      image: undefined,
      questions: [],
    },
  });

  const { control, handleSubmit, reset, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const { generatedPassword } = usePasswordGeneratorStore();

  useEffect(() => {
    if (isOpen) {
      reset({
        name,
        password,
        image: undefined,
        questions: questionsData ?? [],
      });
      decryptPassword();
    }
  }, [isOpen, name, password, questionsData, reset, decryptPassword]);

  useEffect(() => {
    if (generatedPassword) {
      setValue("password", generatedPassword);
    }
  }, [generatedPassword, setValue]);

  const onSubmit = (data: CreatePasswordFormValues) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("password", data.password);

    if (data.image instanceof File) {
      formData.append("image", data.image);
    }

    data.questions?.forEach((q, index) => {
      formData.append(`questions[${index}][question]`, q.question);
      formData.append(`questions[${index}][answer]`, q.answer);
    });
    console.log(Array.from(formData.entries()));

    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <div>
          <DialogHeader>
            <DialogTitle>Edit Password</DialogTitle>
            <DialogDescription>
              Update your password details and security questions.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <p>Loading security questions...</p>
          ) : error ? (
            <p className="text-red-500">Error loading security questions</p>
          ) : (
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Field */}
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <PasswordInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Password"
                          />
                        </FormControl>
                        <GeneratePassword />
                        <EditGeneratePassword />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Field */}
                <FormField
                  control={control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      {image && (
                        <div className="mb-2">
                          <img
                            src={`${import.meta.env.VITE_BASE_URL}${image}`}
                            alt={name}
                            className="w-xl object-cover rounded"
                          />
                        </div>
                      )}
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Security Questions */}
                <div>
                  <h3 className="text-lg font-semibold">Security Questions</h3>
                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="space-y-2 border p-2 m-4 rounded"
                    >
                      <FormField
                        control={control}
                        name={`questions.${index}.question` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question {index + 1}</FormLabel>
                            <FormControl>
                              <Input placeholder="Your question" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`questions.${index}.answer` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Answer</FormLabel>
                            <FormControl>
                              <Input placeholder="Your answer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(index)}
                      >
                        Remove Question
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => append({ question: "", answer: "" })}
                  >
                    Add Question
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Updating..." : "Update"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPassword;
