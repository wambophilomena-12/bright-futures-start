import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2 } from "lucide-react";

interface AutoVerifyEmailProps {
  email: string;
  onEmailChange: (email: string) => void;
  isVerified: boolean;
  onVerificationChange: (verified: boolean) => void;
  required?: boolean;
}

/**
 * Auto-verify email component for creation pages.
 * Automatically marks email as verified when a valid email format is entered.
 */
export const AutoVerifyEmail = ({
  email,
  onEmailChange,
  isVerified,
  onVerificationChange,
  required = false
}: AutoVerifyEmailProps) => {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Auto-verify when email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(email);
    setIsValid(valid);
    
    // Auto-verify valid emails
    if (valid && !isVerified) {
      onVerificationChange(true);
    } else if (!valid && isVerified) {
      onVerificationChange(false);
    }
  }, [email, isVerified, onVerificationChange]);

  const handleEmailChange = (newEmail: string) => {
    onEmailChange(newEmail);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email">
        Email {required && "*"}
        {isVerified && (
          <span className="ml-2 text-green-600 text-sm inline-flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Valid
          </span>
        )}
      </Label>
      <div className="relative">
        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          required={required}
          className="pl-10"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="contact@example.com"
        />
      </div>
      {email && !isValid && (
        <p className="text-xs text-destructive">Please enter a valid email address</p>
      )}
    </div>
  );
};
