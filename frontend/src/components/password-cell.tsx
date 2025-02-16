import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { post } from "@/api/axios-instance";
import { useToast } from "@/components/hooks/use-toast";

interface PasswordCellProps {
  hashedPassword: string;
}

export function PasswordCell({
  hashedPassword,
}: PasswordCellProps): JSX.Element {
  const { toast } = useToast();
  const [showDecrypted, setShowDecrypted] = useState<boolean>(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const responseData = await post<{
        status: string;
        message: string;
        data: { decrypted: string };
      }>("/passwords/decrypt-password", {
        password: hashedPassword,
      });
      return responseData.data.decrypted;
    },
    onSuccess: async (decrypted: string) => {
      setDecryptedPassword(decrypted);
      try {
        await navigator.clipboard.writeText(decrypted);
        toast({
          title: "Copied to clipboard",
          duration: 1000,
        });
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
      setShowDecrypted(true);
    },
    onError: (error) => {
      console.error("Error decrypting password:", error);
      toast({
        title: "Error decrypting password",
        variant: "destructive",
      });
    },
  });

  const handleClick = (): void => {
    if (showDecrypted) {
      setShowDecrypted(false);
    } else {
      if (decryptedPassword) {
        navigator.clipboard
          .writeText(decryptedPassword)
          .then(() => {
            toast({
              title: "Copied to clipboard",
              duration: 1000,
            });
            setShowDecrypted(true);
          })
          .catch((error) => {
            console.error("Failed to copy to clipboard:", error);
          });
      } else {
        mutate();
      }
    }
  };

  useEffect(() => {
    if (showDecrypted) {
      timerRef.current = setTimeout(() => {
        setShowDecrypted(false);
      }, 30000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showDecrypted]);

  return (
    <span
      onClick={handleClick}
      className="cursor-pointer text-blue-600 dark:text-blue-400 underline"
      title="Click to toggle between hashed and decrypted password"
    >
      {isPending
        ? "Decrypting..."
        : showDecrypted
        ? decryptedPassword
        : displayHashed(hashedPassword)}
    </span>
  );
}

function displayHashed(hashed: string): string {
  return `${hashed.slice(0, 16)}...`;
}

export default PasswordCell;
