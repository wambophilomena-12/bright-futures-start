import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Clock, Sparkles, AlertTriangle } from "lucide-react"; // Added AlertTriangle for error state
import { PasswordStrength } from "@/components/ui/password-strength";
import { generateStrongPassword } from "@/lib/passwordUtils";

// Define the specified Teal color
const TEAL_COLOR = "#008080";
const TEAL_HOVER_COLOR = "#005555"; // A darker shade of teal for hover
const LIGHT_TEAL_BG = "#0080801A"; // Teal with 10% opacity for background (used as replacement for bg-primary/10)

const ForgotPassword = () => {
  // 'email': Step 1 - Enter email
  // 'verify': Step 2 - Enter code (deprecated in favor of auto-verify for OTP)
  // 'reset': Step 2/3 - Enter new password (main state after email link/code entry)
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(""); // Still used if the user manually enters a code
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Security & Utility Functions ---

  /**
   * Robust password validation ensuring complexity requirements are met.
   * @param pwd The password string to validate.
   * @returns An object with a boolean 'valid' and an optional 'message'.
   */
  const validatePassword = (pwd: string): { valid: boolean; message?: string } => {
    // SECURITY: Enforce minimum complexity requirements
    if (pwd.length < 10) { // Increased minimum length for better security
      return { valid: false, message: "Password must be at least 10 characters long" };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    return { valid: true };
  };

  // --- Auto-Verify/URL Listener Effect ---

  useEffect(() => {
    // AUTOMATIC VERIFICATION: Check the URL for the recovery token on load
    const checkUrlForToken = async () => {
      setLoading(true);
      setError("");

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const type = params.get('type');
      const accessToken = params.get('access_token');
      const otp = params.get('otp'); // Supabase sends this as 'otp' for recovery type

      // If a recovery or token is present, we attempt to proceed
      if (accessToken && type === 'recovery') {
        try {
          // This is generally not needed if using 'redirectTo' in resetPasswordForEmail, 
          // as the access_token in the URL hash sets the session automatically.
          // However, for explicit security check:

          // Supabase's 'verifyOtp' is intended for manual code entry.
          // When using 'resetPasswordForEmail' with a 'redirectTo', Supabase handles
          // the session and redirects. The user should land here with a session ready
          // to update the user.

          // We check the session to see if the user is authenticated from the link.
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !session) {
            throw new Error("Could not verify session. Please try resetting your password again.");
          }

          // If session is successful, move to the password reset step
          setStep('reset');
          toast({
            title: "Verification Successful!",
            description: "Please enter your new password to complete the reset.",
            duration: 5000,
          });

          // Clear the URL hash to prevent re-triggering the logic on refresh
          navigate(window.location.pathname, { replace: true }); 

        } catch (error: any) {
          setError(error.message);
          toast({
            title: "Verification Error",
            description: error.message,
            variant: "destructive",
          });
          setStep('email'); // Send them back to step 1
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkUrlForToken();
  }, [navigate, toast]);

  // --- Resend Countdown Effect ---
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && (step === 'verify' || step === 'reset')) {
      setCanResend(true);
    }
  }, [countdown, step]);

  // --- Handlers ---

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // SECURITY: Ensure redirectTo is a secure, known domain (usually the same app)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Supabase sends a recovery link to the user's email.
        // Clicking this link will redirect back here, and the useEffect above will handle the token.
        redirectTo: `${window.location.origin}/forgot-password`, 
      });

      if (error) throw error;

      toast({
        title: "Recovery Link Sent!",
        description: "Check your email for the password reset link. It will automatically verify you upon clicking.",
        duration: 8000,
      });

      // Stay on the email step but show success message. The user must click the link.
      setStep('email'); 
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || "Invalid password");
      return;
    }

    setLoading(true);

    try {
      // Since the useEffect block handles the auto-verification via the URL token,
      // the user is already authenticated (session is set). We just need to update
      // the password for the current user.
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Password reset successful! 🎉",
        description: "Your password has been changed. Redirecting to login...",
        duration: 5000,
      });

      // Redirect to login after a small delay for the user to read the toast
      setTimeout(() => navigate("/auth"), 1000); 
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword(); // Generate strong password
    setNewPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setShowConfirmPassword(true);
    toast({
      title: "Password generated! 🔐",
      description: "A strong, 12-character password has been created and autofilled.",
    });
  };

  const handleResendCode = async () => {
    // This now re-sends the recovery link, not just a code
    handleSendCode(new Event('submit') as any); 
  };


  // --- Render Logic ---

  const renderEmailStep = () => (
    <>
      <div className="flex flex-col items-center mb-6">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: LIGHT_TEAL_BG }}
        >
          <Mail className="w-8 h-8" style={{ color: TEAL_COLOR }} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
        <p className="text-muted-foreground text-center">
          Enter your email to receive a **secure reset link**
        </p>
      </div>
      
      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} // Disable input while loading
          />
        </div>

        <Button 
          type="submit" 
          className="w-full text-white" 
          disabled={loading || !email}
          style={{ 
            backgroundColor: TEAL_COLOR,
            borderColor: TEAL_COLOR 
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = TEAL_HOVER_COLOR}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = TEAL_COLOR}
        >
          {loading ? "Sending Link..." : "Send Reset Link"}
        </Button>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1 mt-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm hover:underline"
            style={{ color: TEAL_COLOR }}
          >
            Back to login
          </button>
        </div>
      </form>
    </>
  );

  const renderResetPasswordStep = () => (
    <>
      <div className="flex flex-col items-center mb-6">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: LIGHT_TEAL_BG }}
        >
          <Lock className="w-8 h-8" style={{ color: TEAL_COLOR }} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
        <p className="text-muted-foreground text-center">
          The verification link was successful. Set a strong password now.
        </p>
      </div>
      
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="newPassword">New Password</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGeneratePassword}
              className="h-auto py-1 px-2 text-xs"
              style={{ color: TEAL_COLOR }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Generate
            </Button>
          </div>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* SECURITY: Password strength indicator is a good practice */}
          <PasswordStrength password={newPassword} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full text-white" 
          disabled={loading || !newPassword || newPassword !== confirmPassword || !validatePassword(newPassword).valid}
          style={{ 
            backgroundColor: TEAL_COLOR,
            borderColor: TEAL_COLOR 
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = TEAL_HOVER_COLOR}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = TEAL_COLOR}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm hover:underline"
            style={{ color: TEAL_COLOR }}
          >
            Back to login
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-md mx-auto">
        <Card className="p-6">
          {step === 'email' && renderEmailStep()}
          {/* The 'verify' step is mostly bypassed by auto-verification, 
              but you can re-enable it if you want to allow manual code entry. */}
          {step === 'reset' && renderResetPasswordStep()} 
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;