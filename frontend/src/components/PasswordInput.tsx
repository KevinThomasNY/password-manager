import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./ui/input"; // your input component

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <Input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pr-12 py-4 rounded-md border border-gray-300 
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 
                   flex items-center justify-center 
                   focus:outline-none"
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5 text-gray-700" />
        ) : (
          <Eye className="w-5 h-5 text-gray-700" />
        )}
      </button>
    </div>
  );
}
