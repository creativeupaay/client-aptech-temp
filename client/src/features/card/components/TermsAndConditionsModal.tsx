import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

const TERMS_ITEMS: AccordionItem[] = [
  {
    id: "usage",
    title: "Card usage policy",
    content:
      "The Aptech RuPay Prepaid Card is issued for authorized student transactions, course materials, educational fee payments, and verified retail purchases. Commercial exploitation or transfer to third parties is strictly prohibited.",
  },
  {
    id: "limits",
    title: "Wallet limits",
    content:
      "Standard Minimum KYC allows a maximum monthly wallet holding and reload limit of ₹10,000. Upgrading to Full KYC with Aadhaar biometric/OTP and PAN verification enhances your account limit to ₹2,00,000.",
  },
  {
    id: "validity",
    title: "Validity period",
    content:
      "Your virtual RuPay GPR card remains valid for 5 years from the date of issuance. Card renewal and security controls can be managed directly from your student dashboard.",
  },
  {
    id: "privacy",
    title: "Privacy policy",
    content:
      "All identity documents and mobile verification credentials are encrypted using bank-grade AES-256 protocols and handled strictly under Reserve Bank of India (RBI) prepaid payment instrument guidelines.",
  },
];

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: "faq-activate",
    title: "How do I activate my student card?",
    content:
      "Your virtual card is activated instantly as soon as you confirm your student details and complete the 6-digit mobile verification.",
  },
  {
    id: "faq-limit",
    title: "What is the daily transaction limit?",
    content:
      "Daily limits follow your KYC tier: up to ₹10,000 per day under Min KYC, and up to ₹2,00,000 per day once Full KYC is completed.",
  },
];

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  const [openSection, setOpenSection] = useState<string | null>("usage");

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-[640px] max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 id="terms-modal-title" className="text-xl font-bold text-[#1C1C21]">
              Terms & Conditions
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review the agreement and FAQs before continuing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700">
          {/* Terms Section */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Terms & Conditions</h3>
            <div className="space-y-2">
              {TERMS_ITEMS.map((item) => {
                const isOpen = openSection === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DB6516]" />
                        {item.title}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#DB6516]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-gray-600 bg-gray-50/50 leading-relaxed border-t border-gray-100">
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQs Section */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openSection === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#DB6516]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-gray-600 bg-gray-50/50 leading-relaxed border-t border-gray-100">
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onAccept}
            className="w-full h-12 bg-[#DB6516] hover:bg-[#C05510] text-white font-bold rounded-xl shadow-sm transition active:scale-[0.99] flex items-center justify-center cursor-pointer"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
