import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { exportPasswords } from "@/api/password-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/hooks/use-toast";
import PasswordInput from "@/components/PasswordInput";
import { EXPORT_FILE_NAME } from "../../../backend/src/constants/security-policy";

interface ExportPasswordsProps {
  disabled: boolean;
}

const ExportPasswords = ({ disabled }: ExportPasswordsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: () => exportPasswords(currentPassword),
    onSuccess: (file) => {
      const downloadUrl = URL.createObjectURL(file);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = EXPORT_FILE_NAME;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      requestAnimationFrame(() => URL.revokeObjectURL(downloadUrl));

      setCurrentPassword("");
      setIsOpen(false);
      toast({
        title: "Export complete",
        description: "Store the exported file somewhere secure.",
      });
    },
    onError: () => {
      setCurrentPassword("");
      toast({
        title: "Export failed",
        description: "Check your current password and try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentPassword("");
      exportMutation.reset();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentPassword) {
      exportMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1"
        >
          <Download size={16} />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm password export</DialogTitle>
          <DialogDescription>
            The exported JSON file contains your passwords and security answers
            in plaintext. Confirm your current master password and keep the file
            secure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Current master password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            className="w-full"
            disabled={!currentPassword || exportMutation.isPending}
          >
            {exportMutation.isPending ? "Exporting..." : "Confirm and export"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPasswords;
