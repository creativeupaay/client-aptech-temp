import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, Check } from "lucide-react";
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
    city: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [signup, { isLoading }] = useSignupMutation();

  // Password rules validation
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const isPasswordComplex = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const validateField = (
    field: string,
    value: string,
    currentFormData = formData
  ): string | null => {
    switch (field) {
      case "name": {
        const trimmed = value.trim();
        if (!trimmed) return "Full legal name is required";
        if (trimmed.length < 2) return "Name must be at least 2 characters";
        if (trimmed.length > 100) return "Name cannot exceed 100 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
          return "Name can only contain letters, spaces, dots, and hyphens";
        }
        return null;
      }

      case "email": {
        const trimmed = value.trim();
        if (!trimmed) return "Email address is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return "Please enter a valid email address (e.g. name@example.com)";
        }
        return null;
      }

      case "mobile": {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "Mobile number is required";
        if (digits.length !== 10) return "Mobile number must be exactly 10 digits";
        if (!/^[6-9]/.test(digits)) {
          return "Mobile number must start with 6, 7, 8, or 9";
        }
        return null;
      }

      case "highestEducation": {
        if (!value) return "Please select your highest level of education";
        return null;
      }

      case "city": {
        const trimmed = value.trim();
        if (trimmed && trimmed.length < 2) return "City must be at least 2 characters";
        return null;
      }

      case "password": {
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters long";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return "Password must include uppercase, lowercase, and a number";
        }
        return null;
      }

      case "confirmPassword": {
        if (!value) return "Please confirm your password";
        if (value !== currentFormData.password) return "Passwords do not match";
        return null;
      }

      default:
        return null;
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field as keyof SignupRequest] || "", formData);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let cleanValue = value;

    if (name === "mobile") {
      cleanValue = value.replace(/\D/g, "").slice(0, 10);
    }

    const updatedFormData = { ...formData, [name]: cleanValue };
    setFormData(updatedFormData);
    if (formError) setFormError(null);

    if (touched[name]) {
      const err = validateField(name, cleanValue, updatedFormData);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) next[name] = err;
        else delete next[name];
        return next;
      });
    }

    // Also revalidate confirmPassword if password changes
    if (name === "password" && touched.confirmPassword) {
      const confirmErr = validateField(
        "confirmPassword",
        formData.confirmPassword,
        updatedFormData
      );
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (confirmErr) next.confirmPassword = confirmErr;
        else delete next.confirmPassword;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Mark all required fields as touched
    setTouched({
      name: true,
      email: true,
      mobile: true,
      highestEducation: true,
      password: true,
      confirmPassword: true,
    });

    const errors: Record<string, string> = {};
    const nameErr = validateField("name", formData.name);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateField("email", formData.email);
    if (emailErr) errors.email = emailErr;

    const mobileErr = validateField("mobile", formData.mobile);
    if (mobileErr) errors.mobile = mobileErr;

    const eduErr = validateField("highestEducation", formData.highestEducation);
    if (eduErr) errors.highestEducation = eduErr;

    const passErr = validateField("password", formData.password);
    if (passErr) errors.password = passErr;

    const confirmErr = validateField("confirmPassword", formData.confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Please fix the highlighted errors before continuing.");
      return;
    }

    try {
      const response = await signup({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.replace(/\D/g, ""),
      }).unwrap();
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
        "Registration failed. Please review your inputs.";
      setFormError(errorMsg);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-aptech-charcoal tracking-tight mb-2">
          Create Account
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Register to apply for your AP-Tech RuPay Prepaid Student Card.
        </p>
      </div>

      {/* Alert Error Box */}
      {formError && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm mb-5 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="font-medium">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Full Name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="name" className="block text-xs font-semibold text-aptech-heading">
              Full Legal Name<span className="text-aptech-primary">*</span>
            </label>
            {touched.name && !fieldErrors.name && formData.name.trim().length >= 2 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} className="stroke-[3]" /> Valid
              </span>
            )}
          </div>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your full legal name"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => handleBlur("name")}
            required
            className={`w-full h-11 px-4 rounded-lg border text-sm text-aptech-charcoal bg-white transition-all outline-none ${
              touched.name && fieldErrors.name
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 bg-red-50/10"
                : "border-aptech-border focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15"
            }`}
          />
          {touched.name && fieldErrors.name && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        {/* Email Id */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-aptech-heading">
              Email Id<span className="text-aptech-primary">*</span>
            </label>
            {touched.email && !fieldErrors.email && formData.email.trim() && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} className="stroke-[3]" /> Valid
              </span>
            )}
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur("email")}
            required
            className={`w-full h-11 px-4 rounded-lg border text-sm text-aptech-charcoal bg-white transition-all outline-none ${
              touched.email && fieldErrors.email
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 bg-red-50/10"
                : "border-aptech-border focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15"
            }`}
          />
          {touched.email && fieldErrors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Mobile No */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="mobile" className="block text-xs font-semibold text-aptech-heading">
              Mobile No.<span className="text-aptech-primary">*</span>
            </label>
            {touched.mobile && !fieldErrors.mobile && formData.mobile.length === 10 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} className="stroke-[3]" /> Valid
              </span>
            )}
          </div>
          <div
            className={`flex items-center h-11 border rounded-lg px-3 bg-white transition-all ${
              touched.mobile && fieldErrors.mobile
                ? "border-red-400 ring-2 ring-red-500/15"
                : "border-aptech-border focus-within:border-aptech-primary focus-within:ring-2 focus-within:ring-aptech-primary/15"
            }`}
          >
            <span className="text-sm font-semibold text-gray-500 mr-2 shrink-0">
              +91
            </span>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="10-digit mobile"
              value={formData.mobile}
              onChange={handleChange}
              onBlur={() => handleBlur("mobile")}
              maxLength={10}
              required
              className="w-full text-sm outline-none text-aptech-charcoal font-mono"
            />
          </div>
          {touched.mobile && fieldErrors.mobile ? (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{fieldErrors.mobile}</span>
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1">
              10 digits starting with 6, 7, 8, or 9
            </p>
          )}
        </div>

        {/* Highest Education */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="highestEducation" className="block text-xs font-semibold text-aptech-heading">
              Highest Education<span className="text-aptech-primary">*</span>
            </label>
            {touched.highestEducation && !fieldErrors.highestEducation && formData.highestEducation && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} className="stroke-[3]" /> Valid
              </span>
            )}
          </div>
          <div className="relative">
            <select
              id="highestEducation"
              name="highestEducation"
              value={formData.highestEducation}
              onChange={handleChange}
              onBlur={() => handleBlur("highestEducation")}
              required
              className={`w-full h-11 px-4 rounded-lg border text-sm bg-white appearance-none cursor-pointer transition-all outline-none ${
                touched.highestEducation && fieldErrors.highestEducation
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                  : "border-aptech-border focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15"
              } ${formData.highestEducation ? "text-aptech-charcoal" : "text-gray-400"}`}
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
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-500" />
          </div>
          {touched.highestEducation && fieldErrors.highestEducation && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{fieldErrors.highestEducation}</span>
            </p>
          )}
        </div>

        {/* City (Optional lead field) */}
        <div>
          <label htmlFor="city" className="block text-xs font-semibold text-aptech-heading mb-1.5">
            City <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="Enter your current city (e.g. Mumbai, Delhi)"
            value={formData.city || ""}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-lg border border-aptech-border text-sm text-aptech-charcoal placeholder:text-gray-400 focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15 transition-all outline-none"
          />
        </div>

        {/* Enter Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-aptech-heading">
              Enter Password<span className="text-aptech-primary">*</span>
            </label>
            {touched.password && !fieldErrors.password && isPasswordComplex && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} className="stroke-[3]" /> Strong
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              required
              className={`w-full h-11 pl-4 pr-11 rounded-lg border text-sm text-aptech-charcoal bg-white transition-all outline-none ${
                touched.password && fieldErrors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 bg-red-50/10"
                  : "border-aptech-border focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15"
              }`}
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

          {/* Password Requirements Checklist */}
          <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px] space-y-1">
            <p className="font-semibold text-gray-600 mb-1">Password must contain:</p>
            <div className="grid grid-cols-2 gap-1">
              <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <Check size={12} className={hasMinLength ? "stroke-[3]" : "opacity-40"} /> At least 8 characters
              </span>
              <span className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <Check size={12} className={hasUppercase ? "stroke-[3]" : "opacity-40"} /> 1 uppercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasLowercase ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <Check size={12} className={hasLowercase ? "stroke-[3]" : "opacity-40"} /> 1 lowercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <Check size={12} className={hasNumber ? "stroke-[3]" : "opacity-40"} /> 1 numeric digit
              </span>
            </div>
          </div>

          {touched.password && fieldErrors.password && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-aptech-heading">
              Confirm Password<span className="text-aptech-primary">*</span>
            </label>
            {touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={12} className="stroke-[3]" /> Matched
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur("confirmPassword")}
              required
              className={`w-full h-11 pl-4 pr-11 rounded-lg border text-sm text-aptech-charcoal bg-white transition-all outline-none ${
                touched.confirmPassword && fieldErrors.confirmPassword
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 bg-red-50/10"
                  : "border-aptech-border focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15"
              }`}
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
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{fieldErrors.confirmPassword}</span>
            </p>
          )}
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
            <span>Create Account & Continue</span>
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
