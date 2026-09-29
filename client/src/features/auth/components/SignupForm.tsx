import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useSignupMutation, type SignupRequest } from "../authApi";

interface SignupFormProps {
  onSignupSuccess: (mobile: string, debugOtp?: string) => void;
  onSwitchToLogin: () => void;
}

const HIGHEST_EDUCATION_OPTIONS = [
  "10th Standard",
  "12th Standard",
  "Diploma / ITI",
  "Undergraduate / Bachelor's",
  "Postgraduate / Master's",
  "Doctorate / Other",
] as const;

export const SignupForm: React.FC<SignupFormProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<SignupRequest>({
    name: "",
    email: "",
    mobile: "",
    highestEducation: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [signup, { isLoading }] = useSignupMutation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Please enter your full name");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setFormError("Please enter a valid email address");
      return;
    }
    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!formData.highestEducation) {
      setFormError("Please select your highest level of education");
      return;
    }
    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      const response = await signup(formData).unwrap();
      onSignupSuccess(response.data.mobile, response.data.debugOtp);
    } catch (err: unknown) {
      interface ApiErrorData {
        data?: {
          message?: string;
          errors?: Array<{ field: string; message: string }>;
        };
      }
      const apiErr = err as ApiErrorData;
      const errorMsg =
        apiErr?.data?.errors?.[0]?.message ||
        apiErr?.data?.message ||
        "Registration failed. Please check your inputs.";
      setFormError(errorMsg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-aptech-charcoal tracking-tight mb-2">
          Welcome !
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Sign In to continue to your student card dashboard.
        </p>
      </div>

      {/* Alert Error Box */}
      {formError && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm mb-5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Name<span className="text-aptech-primary">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full h-11 px-4 rounded-lg border border-aptech-border text-sm text-aptech-charcoal bg-white focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
          />
        </div>

        {/* Email Id */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Email Id<span className="text-aptech-primary">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full h-11 px-4 rounded-lg border border-aptech-border text-sm text-aptech-charcoal bg-white focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
          />
        </div>

        {/* Mobile No */}
        <div>
          <label htmlFor="mobile" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Mobile No.<span className="text-aptech-primary">*</span>
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            placeholder="Enter your mobile number"
            value={formData.mobile}
            onChange={handleChange}
            required
            maxLength={14}
            className="w-full h-11 px-4 rounded-lg border border-aptech-border text-sm text-aptech-charcoal bg-white focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
          />
        </div>

        {/* Highest Education */}
        <div>
          <label htmlFor="highestEducation" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Highest Education<span className="text-aptech-primary">*</span>
          </label>
          <div className="relative">
            <select
              id="highestEducation"
              name="highestEducation"
              value={formData.highestEducation}
              onChange={handleChange}
              required
              className={`w-full h-11 px-4 rounded-lg border border-aptech-border text-sm bg-white appearance-none cursor-pointer focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none ${
                formData.highestEducation ? "text-aptech-charcoal" : "text-gray-400"
              }`}
            >
              <option value="" disabled>
                Select your highest level of education
              </option>
              {HIGHEST_EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-aptech-charcoal">
                  {opt}
                </option>
              ))}
            </select>
            {/* Custom arrow indicator */}
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-500" />
          </div>
        </div>

        {/* Enter Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Enter Password<span className="text-aptech-primary">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
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

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            Confirm Password<span className="text-aptech-primary">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full h-11 pl-4 pr-11 rounded-lg border border-aptech-border text-sm text-aptech-charcoal bg-white focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-2 bg-aptech-primary hover:bg-aptech-primary-hover text-white text-base font-bold rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Initiating Registration...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Footer Link: Already Aptech User ? Login */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Already Aptech User ?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-aptech-primary font-bold hover:underline cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};
