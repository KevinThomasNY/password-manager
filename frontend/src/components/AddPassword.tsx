import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPasswordSchema,
  type CreatePasswordFormValues,
} from "../../../backend/src/validation/password-validation";
import { Button } from "./ui/button";
import { CirclePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import GeneratePassword from "./GeneratePassword";
import EditGeneratePassword from "./EditGeneratePassword";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPassword } from "@/api/password-api";
import { usePasswordGeneratorStore } from "@/store/passwordGeneratorStore";

const AddPassword = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { generatedPassword } = usePasswordGeneratorStore();

  const mutation = useMutation({
    mutationFn: (formData: FormData) => addPassword(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const form = useForm<CreatePasswordFormValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: {
      name: "",
      password: "",
      image: undefined,
      questions: [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

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

    if (data.questions && data.questions.length > 0) {
      data.questions.forEach((q, index) => {
        formData.append(`questions[${index}][question]`, q.question);
        formData.append(`questions[${index}][answer]`, q.answer);
      });
    }

    mutation.mutate(formData);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {/* Button that triggers the dialog */}
      <DialogTrigger asChild>
        <Button type="button">
          <CirclePlus /> Add Password
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Password</DialogTitle>
          <DialogDescription>
            Use the form below to add a new password.
          </DialogDescription>
        </DialogHeader>

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

            {/* Password Field with Generate & Edit Buttons */}
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
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) => {
                        field.onChange(e.target.files?.[0]);
                      }}
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
                <div key={item.id} className="space-y-2 border p-2 m-4 rounded">
                  {/* Question Field */}
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

                  {/* Answer Field */}
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

                  {/* Button to remove a security question */}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    Remove Question
                  </Button>
                </div>
              ))}

              {/* Button to add a new security question */}
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={() => append({ question: "", answer: "" })}
              >
                Add Question
              </Button>

              {/* Display validation errors for questions */}
              {errors.questions && (
                <p className="text-red-500">
                  {typeof errors.questions.message === "string" &&
                    errors.questions.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPassword;
