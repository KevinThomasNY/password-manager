import { Button } from "./ui/button";

const GeneratePassword = () => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => console.log("Generate Password")}
    >
      Generate
    </Button>
  );
};

export default GeneratePassword;
