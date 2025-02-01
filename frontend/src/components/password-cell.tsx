import { useState } from "react";
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

  const handleClick = async (): Promise<void> => {
    if (showDecrypted) {
      setShowDecrypted(false);
    } else {
      if (!decryptedPassword) {
        try {
          const responseData = await post<{
            status: string;
            message: string;
            data: { decrypted: string };
          }>("/passwords/decrypt-password", {
            password: hashedPassword,
          });
          const decrypted: string = responseData.data.decrypted;
          setDecryptedPassword(decrypted);
          await navigator.clipboard.writeText(decrypted);
          toast({
            title: "Copied to clipboard",
            duration: 1000,
          });
        } catch (error) {
          console.error("Error decrypting password:", error);
          return;
        }
      }
      setShowDecrypted(true);
    }
  };

  return (
    <span
      onClick={handleClick}
      className="cursor-pointer text-blue-600 dark:text-blue-400 underline"
    >
      {showDecrypted ? decryptedPassword : displayHashed(hashedPassword)}
    </span>
  );
}

function displayHashed(hashed: string): string {
  return `${hashed.slice(0, 16)}...`;
}

export default PasswordCell;
