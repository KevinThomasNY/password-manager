import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePasswordGeneratorStore } from "@/store/passwordGeneratorStore";
import { ShieldPlus } from "lucide-react";

const EditGeneratePassword = () => {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    updateSettings,
  } = usePasswordGeneratorStore();

  const [localSettings, setLocalSettings] = useState({
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  });

  const [open, setOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    });
  }, [
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  const handleSave = () => {
    if (localSettings.length < 5) {
      setError("Length must be at least 5");
      return;
    }
    if (localSettings.length > 25) {
      setError("Length cannot exceed 25");
      return;
    }
    setError(null);
    updateSettings(localSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ShieldPlus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Password Generation Rules</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="length" className="block mb-1">
              Length
            </label>
            <Input
              id="length"
              type="number"
              name="length"
              value={localSettings.length}
              onChange={handleInputChange}
              min={5}
              max={25}
            />
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>
          <div>
            <label
              htmlFor="includeUppercase"
              className="flex items-center gap-2"
            >
              <input
                id="includeUppercase"
                type="checkbox"
                name="includeUppercase"
                checked={localSettings.includeUppercase}
                onChange={handleInputChange}
              />
              Uppercase
            </label>
          </div>
          <div>
            <label
              htmlFor="includeLowercase"
              className="flex items-center gap-2"
            >
              <input
                id="includeLowercase"
                type="checkbox"
                name="includeLowercase"
                checked={localSettings.includeLowercase}
                onChange={handleInputChange}
              />
              Lowercase
            </label>
          </div>
          <div>
            <label htmlFor="includeNumbers" className="flex items-center gap-2">
              <input
                id="includeNumbers"
                type="checkbox"
                name="includeNumbers"
                checked={localSettings.includeNumbers}
                onChange={handleInputChange}
              />
              Numbers
            </label>
          </div>
          <div>
            <label htmlFor="includeSymbols" className="flex items-center gap-2">
              <input
                id="includeSymbols"
                type="checkbox"
                name="includeSymbols"
                checked={localSettings.includeSymbols}
                onChange={handleInputChange}
              />
              Symbols
            </label>
          </div>
          <Button type="button" className="w-full" onClick={handleSave}>
            Save Rules
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGeneratePassword;
