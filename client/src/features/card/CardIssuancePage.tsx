import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, Loader2, AlertCircle } from "lucide-react";
import { useGetMeQuery } from "../auth/authApi";
import {
  useSendCardOtpMutation,
  useRegisterAndIssueCardMutation,
  useGetCardQuery,
} from "./cardApi";
import { TermsAndConditionsModal } from "./components/TermsAndConditionsModal";

export const CardIssuancePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: meData } = useGetMeQuery();
  const { data: cardData } = useGetCardQuery();

  const [sendOtpMutation, { isLoading: isSendingOtp }] = useSendCardOtpMutation();
  const [registerAndIssueCardMutation, { isLoading: isIssuingCard }] =
    useRegisterAndIssueCardMutation();

  const user = meData?.data?.user;
  const studentName = user?.name || "Student";
  const studentId = user?.studentId || "";
  const userMobile = user?.mobile ? user.mobile.replace(/\D/g, "").slice(-10) : "";
  const userEmail = user?.email || "";
  // SSO-04: lock identity fields pre-populated from ProConnect / session profile
  const profileFieldsLocked = Boolean(user?.name && user?.email && user?.mobile);

  const initials =
    studentName
      .split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AS";

  // Form State
  const [name, setName] = useState(studentName);
  const [email, setEmail] = useState(userEmail);
  const [govIdType, setGovIdType] = useState<
    "AADHAR_NUMBER" | "DRIVING_LICENCE" | "PASSPORT_NUMBER" | "VOTER_ID"
  >("AADHAR_NUMBER");
  const [govIdValue, setGovIdValue] = useState("");
  const [dob, setDob] = useState("");

  const [mobile, setMobile] = useState(userMobile);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(45);
  const isOtpComplete = otp.every((d) => d.length === 1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field-level touched and errors state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync loaded user details
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.mobile) setMobile(user.mobile.replace(/\D/g, "").slice(-10));
  }, [user]);

  // If card is already issued or currently being provisioned, redirect directly to status screen
  useEffect(() => {
    const status = cardData?.data?.card?.status;
    if (status === "ACTIVE" || status === "APPLICATION_PENDING" || status === "ISSUED") {
      navigate("/card/status", { replace: true });
    }
  }, [cardData?.data?.card?.status, navigate]);

  // Validation functions
  const validateField = (field: string, value: string, currentGovType = govIdType): string | null => {
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
          return "Please enter a valid email address (e.g. name@domain.com)";
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

      case "govIdValue": {
        const clean = value.replace(/\s+/g, "").toUpperCase();
        if (!clean) return "Document identifier is required";

        if (currentGovType === "AADHAR_NUMBER") {
          if (!/^\d{12}$/.test(clean)) {
            return "Aadhaar must be exactly 12 numeric digits";
          }
        } else if (currentGovType === "PASSPORT_NUMBER") {
          if (!/^[A-Z][0-9]{7}$/.test(clean)) {
            return "Passport must be 1 letter followed by 7 digits (e.g. A1234567)";
          }
        } else if (currentGovType === "VOTER_ID") {
          if (!/^[A-Z]{3}[0-9]{7}$/.test(clean)) {
            return "Voter ID must be 3 letters followed by 7 digits (e.g. ABC1234567)";
          }
        } else if (currentGovType === "DRIVING_LICENCE") {
          if (!/^[A-Z0-9]{10,16}$/.test(clean)) {
            return "Driving Licence must be 10 to 16 alphanumeric characters";
          }
        }
        return null;
      }

      case "dob": {
        const cleaned = value.replace(/\s+/g, "");
        if (!cleaned) return "Date of birth is required";

        const match = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (!match) return "Enter date in DD / MM / YYYY format";

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const dobDate = new Date(year, month, day);

        if (
          dobDate.getFullYear() !== year ||
          dobDate.getMonth() !== month ||
          dobDate.getDate() !== day
        ) {
          return "Invalid calendar date (please check day/month)";
        }

        const now = new Date();
        if (dobDate > now) return "Date of birth cannot be in the future";

        let age = now.getFullYear() - year;
        const mDiff = now.getMonth() - month;
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < day)) age--;

        if (age < 15) return "Applicant must be at least 15 years old for card issuance";
        if (age > 100) return "Please enter a valid birth year (age exceeds 100)";
        return null;
      }

      default:
        return null;
    }
  };

  const handleBlur = (field: string, val: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, val);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (touched.name) {
      const err = validateField("name", val);
      setErrors((prev) => ({ ...prev, name: err || "" }));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (touched.email) {
      const err = validateField("email", val);
      setErrors((prev) => ({ ...prev, email: err || "" }));
    }
  };

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    if (touched.mobile) {
      const err = validateField("mobile", digits);
      setErrors((prev) => ({ ...prev, mobile: err || "" }));
    }
  };

  const handleGovIdTypeChange = (newType: typeof govIdType) => {
    setGovIdType(newType);
    setGovIdValue("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.govIdValue;
      return next;
    });
    setTouched((prev) => {
      const next = { ...prev };
      delete next.govIdValue;
      return next;
    });
  };

  const handleGovIdValueChange = (val: string) => {
    let formatted = val;
    if (govIdType === "AADHAR_NUMBER") {
      const digits = val.replace(/\D/g, "").slice(0, 12);
      formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    } else {
      formatted = val.toUpperCase().slice(0, 16);
    }
    setGovIdValue(formatted);
    if (touched.govIdValue) {
      const err = validateField("govIdValue", formatted);
      setErrors((prev) => ({ ...prev, govIdValue: err || "" }));
    }
  };

  const handleDobChange = (val: string) => {
    const isDeleting = val.length < dob.length;
    let digits = val.replace(/\D/g, "").slice(0, 8);

    // If backspacing and string previously ended with " / " or "/", drop the trailing digit
    if (isDeleting && (dob.endsWith(" / ") || dob.endsWith("/ ") || dob.endsWith("/"))) {
      digits = digits.slice(0, -1);
    }

    let formatted = "";
    if (isDeleting) {
      if (digits.length <= 2) {
        formatted = digits;
      } else if (digits.length <= 4) {
        formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
      } else {
        formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
      }
    } else {
      if (digits.length < 2) {
        formatted = digits;
      } else if (digits.length === 2) {
        // As soon as 2 digits are entered (e.g. 12), immediately append " / "
        formatted = `${digits} / `;
      } else if (digits.length < 4) {
        formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
      } else if (digits.length === 4) {
        // As soon as 4 digits are entered (e.g. 12 / 11), immediately append " / "
        formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / `;
      } else {
        formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
      }
    }

    setDob(formatted);
    if (touched.dob) {
      const err = validateField("dob", formatted);
      setErrors((prev) => ({ ...prev, dob: err || "" }));
    }
  };

  // Resend Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleSendOtp = async () => {
    setErrorMessage(null);
    setTouched((prev) => ({ ...prev, mobile: true }));
    const mobileErr = validateField("mobile", mobile);
    if (mobileErr) {
      setErrors((prev) => ({ ...prev, mobile: mobileErr }));
      return;
    }

    try {
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
      await sendOtpMutation({ mobile: cleanMobile }).unwrap();
      setOtpSent(true);
      setCountdown(45);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      interface ErrData {
        data?: { message?: string };
      }
      setErrorMessage(
        (err as ErrData)?.data?.message || "Failed to dispatch verification OTP."
      );
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };



  const handleSubmitIssuance = async () => {
    // Mark all fields touched
    setTouched({
      name: true,
      email: true,
      mobile: true,
      govIdValue: true,
      dob: true,
      termsAccepted: true,
    });

    const newErrors: Record<string, string> = {};
    const nameErr = validateField("name", name);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateField("email", email);
    if (emailErr) newErrors.email = emailErr;

    const mobileErr = validateField("mobile", mobile);
    if (mobileErr) newErrors.mobile = mobileErr;

    const govIdErr = validateField("govIdValue", govIdValue);
    if (govIdErr) newErrors.govIdValue = govIdErr;

    const dobErr = validateField("dob", dob);
    if (dobErr) newErrors.dob = dobErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrorMessage("Please fix the highlighted errors above before proceeding.");
      return;
    }

    if (!isOtpComplete) {
      setErrorMessage("Please enter the complete 6-digit verification OTP received on your mobile.");
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Please accept the Terms of Service to continue.");
      return;
    }

    setErrorMessage(null);

    try {
      let formattedDob = dob.replace(/\s+/g, "");
      const ddmmyyyy = formattedDob.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (ddmmyyyy) {
        formattedDob = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
      }

      await registerAndIssueCardMutation({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.replace(/\D/g, "").slice(-10),
        documentType: govIdType,
        documentValue: govIdValue.replace(/\s+/g, "").toUpperCase(),
        dateOfBirth: formattedDob,
        otp: otp.join(""),
        termsAccepted: true,
      }).unwrap();

      navigate("/card/status", { replace: true });
    } catch (err: unknown) {
      interface ErrData {
        data?: { message?: string; errors?: Array<{ field: string; message: string }> };
      }
      const apiErr = err as ErrData;
      const errorMsg =
        apiErr?.data?.errors?.[0]?.message ||
        apiErr?.data?.message ||
        "Card issuance failed. Please review your details and retry.";
      setErrorMessage(errorMsg);
    }
  };

  // Helper document format text
  const getDocumentPlaceholder = () => {
    switch (govIdType) {
      case "AADHAR_NUMBER":
        return "12-digit Aadhaar (e.g. 2399 9988 8895)";
      case "PASSPORT_NUMBER":
        return "e.g. A1234567";
      case "VOTER_ID":
        return "e.g. ABC1234567";
      case "DRIVING_LICENCE":
        return "e.g. DL1420110012345";
    }
  };

  const getDocumentHelperText = () => {
    switch (govIdType) {
      case "AADHAR_NUMBER":
        return "Enter your 12-digit UIDAI Aadhaar number";
      case "PASSPORT_NUMBER":
        return "1 uppercase letter followed by 7 numeric digits";
      case "VOTER_ID":
        return "3 uppercase letters followed by 7 numeric digits";
      case "DRIVING_LICENCE":
        return "10 to 16 alphanumeric characters without spaces";
    }
  };

  // If card is already issued or application pending, redirect cleanly to /card/status
  if (
    cardData?.data?.card?.status === "ACTIVE" ||
    cardData?.data?.card?.status === "ISSUED" ||
    cardData?.data?.card?.status === "APPLICATION_PENDING"
  ) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#DB6516] animate-spin" />
          <p className="text-sm font-medium text-gray-500">Opening card status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-gray-200/80 px-4 sm:px-8 h-18 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              Welcome, {studentName}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Student ID: {studentId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-amber-500 fill-amber-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#DB6516] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {/* Title Section */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1C21] tracking-tight">
            Card Issuance
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your details to issue your AP-Tech RuPay Prepaid Card.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Left Column: Student Details */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
            <h3 className="text-lg font-bold text-[#1C1C21]">Student Details</h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-5">
              Please enter your details accurately. You can review them later.
            </p>

            <div className="space-y-4 text-sm">
              {/* Full Legal Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Full Legal Name<span className="text-[#DB6516]">*</span>
                  </label>
                  {touched.name && !errors.name && name.trim().length >= 2 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check className="w-3 h-3 stroke-[3]" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => handleBlur("name", name)}
                  readOnly={profileFieldsLocked}
                  placeholder="Enter your full legal name"
                  className={`w-full h-11 px-3.5 border rounded-xl outline-hidden transition text-gray-900 ${
                    profileFieldsLocked ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                  } ${
                    touched.name && errors.name
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 bg-red-50/10"
                      : "border-gray-200 focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516]"
                  }`}
                />
                {touched.name && errors.name ? (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {profileFieldsLocked
                      ? "Pre-filled from your Aptech ProConnect profile"
                      : "Must match the name on your official government identification"}
                  </p>
                )}
              </div>

              {/* Email ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Email ID<span className="text-[#DB6516]">*</span>
                  </label>
                  {touched.email && !errors.email && email.trim() && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check className="w-3 h-3 stroke-[3]" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => handleBlur("email", email)}
                  readOnly={profileFieldsLocked}
                  placeholder="name@example.com"
                  className={`w-full h-11 px-3.5 border rounded-xl outline-hidden transition text-gray-900 ${
                    profileFieldsLocked ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                  } ${
                    touched.email && errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 bg-red-50/10"
                      : "border-gray-200 focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516]"
                  }`}
                />
                {touched.email && errors.email ? (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {profileFieldsLocked
                      ? "Pre-filled from your Aptech ProConnect profile"
                      : "Used for card issuance receipts and monthly transaction statements"}
                  </p>
                )}
              </div>

              {/* Government ID Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Government ID Type<span className="text-[#DB6516]">*</span>
                </label>
                <select
                  value={govIdType}
                  onChange={(e) =>
                    handleGovIdTypeChange(
                      e.target.value as
                        | "AADHAR_NUMBER"
                        | "DRIVING_LICENCE"
                        | "PASSPORT_NUMBER"
                        | "VOTER_ID"
                    )
                  }
                  className="w-full h-11 px-3.5 border border-gray-200 rounded-xl outline-hidden focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516] text-gray-900 bg-white cursor-pointer"
                >
                  <option value="AADHAR_NUMBER">Aadhaar Card (12 Digits)</option>
                  <option value="DRIVING_LICENCE">Driving Licence (10-16 Alphanumeric)</option>
                  <option value="PASSPORT_NUMBER">Passport (1 Letter + 7 Digits)</option>
                  <option value="VOTER_ID">Voter ID / EPIC (3 Letters + 7 Digits)</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Required for RBI Min KYC prepaid card provisioning
                </p>
              </div>

              {/* Document Value */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Document Number / ID<span className="text-[#DB6516]">*</span>
                  </label>
                  {touched.govIdValue && !errors.govIdValue && govIdValue.trim() && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check className="w-3 h-3 stroke-[3]" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={govIdValue}
                  onChange={(e) => handleGovIdValueChange(e.target.value)}
                  onBlur={() => handleBlur("govIdValue", govIdValue)}
                  placeholder={getDocumentPlaceholder()}
                  className={`w-full h-11 px-3.5 border rounded-xl outline-hidden transition text-gray-900 bg-white font-mono tracking-wider ${
                    touched.govIdValue && errors.govIdValue
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 bg-red-50/10"
                      : "border-gray-200 focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516]"
                  }`}
                />
                {touched.govIdValue && errors.govIdValue ? (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.govIdValue}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {getDocumentHelperText()}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Date of Birth<span className="text-[#DB6516]">*</span>
                  </label>
                  {touched.dob && !errors.dob && dob.trim() && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check className="w-3 h-3 stroke-[3]" /> Valid
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  onBlur={() => handleBlur("dob", dob)}
                  placeholder="DD / MM / YYYY"
                  maxLength={14}
                  className={`w-full h-11 px-3.5 border rounded-xl outline-hidden transition text-gray-900 bg-white font-mono ${
                    touched.dob && errors.dob
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 bg-red-50/10"
                      : "border-gray-200 focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516]"
                  }`}
                />
                {touched.dob && errors.dob ? (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.dob}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Format: DD / MM / YYYY (applicant must be at least 15 years old)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Verification */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1C1C21]">Verification</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-5">
                We'll send a one-time password to your mobile number.
              </p>

              {/* Inner Verification Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      Mobile Number<span className="text-[#DB6516]">*</span>
                    </label>
                    {touched.mobile && !errors.mobile && mobile.length === 10 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check className="w-3 h-3 stroke-[3]" /> Valid
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div
                      className={`flex-1 flex items-center h-11 border rounded-xl px-3 transition ${
                        profileFieldsLocked ? "bg-gray-50" : "bg-white"
                      } ${
                        touched.mobile && errors.mobile
                          ? "border-red-400 ring-1 ring-red-500/20"
                          : "border-gray-200 focus-within:border-[#DB6516] focus-within:ring-1 focus-within:ring-[#DB6516]"
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-500 mr-2">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        onBlur={() => handleBlur("mobile", mobile)}
                        readOnly={profileFieldsLocked}
                        placeholder="10-digit mobile"
                        maxLength={10}
                        className={`w-full text-sm outline-hidden text-gray-900 font-mono ${
                          profileFieldsLocked ? "cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || mobile.length !== 10 || !/^[6-9]/.test(mobile)}
                      className="px-4 h-11 bg-[#60697B] hover:bg-[#4E5666] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0"
                    >
                      {isSendingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                  {touched.mobile && errors.mobile ? (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.mobile}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      10 digits starting with 6, 7, 8, or 9
                    </p>
                  )}
                </div>

                {otpSent && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Enter 6-Digit OTP
                    </label>

                    <div className="flex items-center gap-2 sm:gap-3">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-10 sm:w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-xl outline-hidden transition bg-white text-gray-900 focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516]"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={countdown > 0}
                        className="text-[#DB6516] hover:underline font-medium disabled:text-gray-400 cursor-pointer"
                      >
                        Resend OTP
                      </button>
                      <span>
                        00:{countdown < 10 ? `0${countdown}` : countdown}
                      </span>
                    </div>
                  </div>
                )}

                {/* Terms and Conditions agreement */}
                <div className="pt-2">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      touched.termsAccepted && !termsAccepted
                        ? "bg-red-50/30 border-red-300"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (touched.termsAccepted && e.target.checked) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.termsAccepted;
                            return next;
                          });
                        }
                      }}
                      className="mt-0.5 w-4 h-4 accent-[#DB6516] rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsTermsModalOpen(true);
                        }}
                        className="text-[#DB6516] underline font-semibold hover:text-[#C05510]"
                      >
                        Terms of Service and Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {touched.termsAccepted && !termsAccepted && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Please accept the terms to issue your card</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Next / Submit CTA */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleSubmitIssuance}
                disabled={isIssuingCard}
                className="w-full h-12 bg-[#DB6516] hover:bg-[#C05510] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isIssuingCard ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Issuing Your Card...</span>
                  </>
                ) : (
                  <span>Submit & Issue Card</span>
                )}
              </button>
              {(!isOtpComplete || !termsAccepted || !govIdValue.trim() || !dob.trim()) && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  All fields marked with <span className="text-[#DB6516]">*</span> and 6-digit mobile OTP are mandatory.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setIsTermsModalOpen(false);
        }}
      />
    </div>
  );
};
