import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useLoginMutation, type AuthSuccessResponse } from "../authApi";

interface LoginFormProps {
  onLoginSuccess: (data: AuthSuccessResponse["data"]) => void;
  onSwitchToSignup: () => void;
  onUnverifiedMobile: (mobile: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToSignup,
  onUnverifiedMobile,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!identifier.trim()) {
      setFormError("Please enter your registered mobile number or email");
      return;
    }
    if (!password) {
      setFormError("Please enter your password");
      return;
    }

    try {
      const response = await login({ identifier, password }).unwrap();
      if (response.data.token) {
        localStorage.setItem("tbx_auth_token", response.data.token);
        localStorage.setItem("tbx_student_user", JSON.stringify(response.data.user));
      }
      onLoginSuccess(response.data);
    } catch (err: unknown) {
      interface ApiErrorData {
        status?: number;
        data?: { message?: string };
      }
      const apiErr = err as ApiErrorData;
      if (apiErr?.status === 403 && apiErr?.data?.message?.includes("verification")) {
        onUnverifiedMobile(identifier.replace(/\D/g, ""));
      } else {
        setFormError(apiErr?.data?.message || "Invalid credentials entered.");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-aptech-charcoal tracking-tight mb-2">
          Welcome Back !
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Login to manage your student card and loyalty rewards.
        </p>
      </div>

      {formError && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm mb-5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Identifier */}
        <div>
          <label htmlFor="identifier" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Mobile No. or Email Id<span className="text-aptech-primary">*</span>
          </label>
          <input
            id="identifier"
            type="text"
            placeholder="Enter mobile number or email"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (formError) setFormError(null);
            }}
            required
            className="w-full h-11 px-4 rounded-lg border border-aptech-border text-sm text-aptech-charcoal bg-white focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="loginPassword" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Password<span className="text-aptech-primary">*</span>
          </label>
          <div className="relative">
            <input
              id="loginPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              required
              className="w-full h-11 pl-4 pr-11 rounded-lg border border-aptech-border text-sm text-aptech-charcoal bg-white focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-2 bg-aptech-primary hover:bg-aptech-primary-hover text-white text-base font-bold rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          New to Aptech ?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-aptech-primary font-bold hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};
