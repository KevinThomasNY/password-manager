import { Button } from "./ui/button";
import { useMutation } from "@tanstack/react-query";
import { usePasswordGeneratorStore } from "@/store/passwordGeneratorStore";
import { generatePassword, GeneratePasswordRequest } from "@/api/password-api";

const GeneratePasswordComponent = () => {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    setGeneratedPassword,
  } = usePasswordGeneratorStore();

  const mutation = useMutation({
    mutationFn: async () => {
      const requestData: GeneratePasswordRequest = {
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
      };
      return generatePassword(requestData);
    },
    onSuccess: (response) => {
      setGeneratedPassword(response.data);
    },
  });

  return (
    <Button type="button" variant="outline" onClick={() => mutation.mutate()}>
      Generate
    </Button>
  );
};

export default GeneratePasswordComponent;
