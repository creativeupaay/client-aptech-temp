export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "AP-Tech (TBX) Banking & Card Platform API",
    version: "1.0.0",
    description:
      "Enterprise API documentation for the AP-Tech Digital Prepaid Card, Single Sign-On (SSO), and Hubble Money Rewards & Voucher Marketplace platform.\n\n" +
      "### Key Features\n" +
      "- **Authentication & SSO:** Non-student registration with OTP, student credential login, and Aptech ProConnect OAuth2/SSO authorization code exchange.\n" +
      "- **Card Issuance & Banking:** TransBnk (TrustHub) RuPay Virtual GPR prepaid card issuance, Min KYC, Aadhaar e-KYC/PAN Full KYC, fund loading (APIs 1–7), and PCI-DSS CardSDK session management.\n" +
      "- **Hubble Rewards & Vouchers:** Live Aptech Coin Ledger balance querying, atomic voucher debits, two-phase rollbacks, and AES-256 encrypted webhook delivery.\n\n" +
      "### Authentication\n" +
      "- **Student / Client Endpoints:** Require `Authorization: Bearer <accessToken>` or the HTTP-only `accessToken` cookie.\n" +
      "- **Hubble Cloud Callbacks:** Require the `X-Hubble-Secret` header.\n" +
      "- **Financial Operations:** Support `Idempotency-Key` headers.",
    contact: {
      name: "AP-Tech Integration Engineering Team",
      email: "support@trusthub.in",
    },
  },
  servers: [
    {
      url: "http://localhost:8000/api/v1",
      description: "Local Development Server",
    },
    {
      url: "https://sandbox-api.trusthub.in/api/v1",
      description: "Sandbox / Staging Environment",
    },
    {
      url: "https://api.trusthub.in/api/v1",
      description: "Production Banking Gateway",
    },
  ],
  tags: [
    {
      name: "Authentication & SSO",
      description: "Student signup, OTP verification, credential login, token rotation, and ProConnect SSO",
    },
    {
      name: "Card Issuance & KYC",
      description: "TransBnk RuPay Virtual GPR card provisioning, Min KYC, Full KYC, and creation polling",
    },
    {
      name: "Card Operations & Funds",
      description: "Money loading, transaction ledger, PCI-DSS CardSDK session, and card locking controls",
    },
    {
      name: "Hubble Rewards - Student",
      description: "Front-channel endpoints for launching Hubble voucher store and browsing redemption history",
    },
    {
      name: "Hubble Rewards - Cloud Callbacks",
      description: "Reverse-callback APIs invoked by Hubble Cloud for Classic SSO, balance, atomic debits, and reversals",
    },
    {
      name: "System",
      description: "Platform health and diagnostic pings",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT Access Token obtained from /auth/login, /auth/verify-otp, or /auth/sso/exchange",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description: "HTTP-only session cookie set automatically on authentication",
      },
      hubbleSecret: {
        type: "apiKey",
        in: "header",
        name: "X-Hubble-Secret",
        description: "Pre-shared secret key validating requests originating from Hubble Cloud",
      },
      idempotencyKey: {
        type: "apiKey",
        in: "header",
        name: "Idempotency-Key",
        description: "Unique UUID or transaction identifier preventing duplicate charges or fund loads",
      },
    },
    schemas: {
      ApiResponseEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Operation completed successfully" },
          data: { type: "object" },
        },
      },
      ApiErrorEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["name", "email", "mobile", "highestEducation", "password", "confirmPassword"],
        properties: {
          name: { type: "string", example: "Rohan Verma", description: "Full legal name" },
          email: { type: "string", format: "email", example: "rohan.verma@example.com" },
          mobile: { type: "string", example: "9876543210", description: "10-digit Indian mobile number" },
          highestEducation: {
            type: "string",
            enum: [
              "High School / 10th",
              "Higher Secondary / 12th",
              "Diploma",
              "Undergraduate / Bachelor's",
              "Postgraduate / Master's",
              "Doctorate / PhD",
              "Other",
            ],
            example: "Undergraduate / Bachelor's",
          },
          city: { type: "string", example: "Mumbai" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "Password@123",
            description: "Must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit",
          },
          confirmPassword: { type: "string", format: "password", example: "Password@123" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["mobile", "otp"],
        properties: {
          mobile: { type: "string", example: "9876543210" },
          otp: { type: "string", example: "123456", description: "6-digit OTP received via SMS" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: {
            type: "string",
            example: "9876543210",
            description: "10-digit mobile number or registered email address",
          },
          password: { type: "string", format: "password", example: "Password@123" },
        },
      },
      SsoExchangeRequest: {
        type: "object",
        required: ["code"],
        properties: {
          code: {
            type: "string",
            example: "pc_auth_cfa278871cb723eab4624c75bdf6a82c",
            description: "Opaque single-use authorization code from Aptech ProConnect IdP",
          },
        },
      },
      SendCardOtpRequest: {
        type: "object",
        required: ["mobile"],
        properties: {
          mobile: { type: "string", example: "9876543210", description: "10-digit mobile number" },
        },
      },
      RegisterAndIssueCardRequest: {
        type: "object",
        required: ["name", "email", "mobile", "documentType", "documentValue", "otp", "termsAccepted"],
        properties: {
          name: { type: "string", example: "Rohan Verma" },
          email: { type: "string", format: "email", example: "rohan.verma@example.com" },
          mobile: { type: "string", example: "9876543210" },
          documentType: {
            type: "string",
            enum: ["AADHAR_NUMBER", "DRIVING_LICENCE", "PASSPORT_NUMBER", "VOTER_ID"],
            example: "AADHAR_NUMBER",
          },
          documentValue: {
            type: "string",
            example: "239999888895",
            description: "Document number (12 digits for Aadhaar, ABC1234567 for Voter ID, etc.)",
          },
          dateOfBirth: {
            type: "string",
            format: "date",
            example: "2002-05-14",
            description: "Date of birth in YYYY-MM-DD or DD/MM/YYYY format. Minimum age 15 years.",
          },
          otp: { type: "string", example: "1234", description: "4-6 digit TransBnk banking OTP" },
          termsAccepted: { type: "boolean", example: true },
        },
      },
      CompleteFullKycRequest: {
        type: "object",
        properties: {
          aadhaarNumber: { type: "string", example: "239999888895" },
          aadhaarOtp: { type: "string", example: "123456" },
          panNumber: { type: "string", example: "ABCDE1234F" },
          isMock: { type: "boolean", example: false },
        },
      },
      LoadMoneyRequest: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: {
            type: "number",
            minimum: 100,
            maximum: 200000,
            example: 500,
            description: "Load amount in INR (Min ₹100.00, Max ₹10,000 for Min KYC or ₹2,00,000 for Full KYC)",
          },
          paymentMethod: {
            type: "string",
            example: "Google Pay (UPI)",
            default: "Google Pay (UPI)",
          },
          upiId: { type: "string", example: "rohan@okhdfcbank" },
          idempotencyKey: {
            type: "string",
            example: "idem_89a0b12-c3d4-4e5f-6a7b-8c9d0e1f2a3b",
            description: "Unique idempotency identifier",
          },
        },
      },
      UpdateCardControlsRequest: {
        type: "object",
        properties: {
          isCardEnabled: { type: "boolean", example: true, description: "Card operational toggle switch" },
          isLocked: { type: "boolean", example: false, description: "Freeze/Lock card toggle" },
        },
      },
      HubbleDebitRequest: {
        type: "object",
        properties: {
          userId: { type: "string", example: "67a3f8901234567890abcdef" },
          studentId: { type: "string", example: "APT-2026-00417" },
          amount: { type: "number", example: 500 },
          coins: { type: "number", example: 500 },
          transactionId: { type: "string", example: "HBL-TXN-98765432" },
          referenceId: { type: "string", example: "REF-12345" },
          orderId: { type: "string", example: "ORD-998877" },
          brandName: { type: "string", example: "Amazon Shopping Voucher" },
        },
      },
      HubbleReverseRequest: {
        type: "object",
        properties: {
          originalTransactionId: { type: "string", example: "HBL-TXN-98765432" },
          transactionId: { type: "string", example: "REV-HBL-98765432" },
          studentId: { type: "string", example: "APT-2026-00417" },
          amount: { type: "number", example: 500 },
          reason: { type: "string", example: "Voucher generation timeout on brand issuer" },
        },
      },
      HubbleWebhookRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", example: "ORD-998877" },
          userId: { type: "string", example: "67a3f8901234567890abcdef" },
          studentId: { type: "string", example: "APT-2026-00417" },
          brandName: { type: "string", example: "Flipkart Gift Card" },
          voucherCode: { type: "string", example: "FK-8899-7766-5544" },
          pin: { type: "string", example: "4321" },
          denomination: { type: "number", example: 500 },
          pointsDebited: { type: "number", example: 500 },
          expiryDate: { type: "string", example: "2027-12-31" },
          redemptionUrl: { type: "string", example: "https://www.flipkart.com/redeem" },
          status: {
            type: "string",
            enum: ["ACTIVE", "SUCCESS", "COMPLETED", "PENDING", "FAILED", "USED", "EXPIRED", "CANCELLED"],
            example: "ACTIVE",
          },
          transactionId: { type: "string", example: "HBL-TXN-98765432" },
        },
      },
    },
  },
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Initiate non-student signup & dispatch OTP",
        description: "Registers prospective students who intend to apply for the card, hashes password, and dispatches SMS OTP.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Signup initiated; OTP dispatched",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseEnvelope" },
              },
            },
          },
          409: {
            description: "Mobile number already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
              },
            },
          },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Verify mobile OTP & complete onboarding",
        description: "Validates 6-digit OTP, activates student profile, initializes Card record, pushes lead to ApTrack CRM, and sets auth cookies.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Account activated and tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseEnvelope" },
              },
            },
          },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/resend-otp": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Resend mobile signup OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mobile"],
                properties: { mobile: { type: "string", example: "9876543210" } },
              },
            },
          },
        },
        responses: {
          200: { description: "New OTP dispatched successfully" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Student login with mobile/email + password",
        description: "Authenticates existing student credentials, returns JWT token, and sets secure HTTP-only cookies.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
          403: { description: "Mobile number unverified" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Refresh expired access token",
        description: "Rotates expired access token using the HTTP-only refreshToken cookie.",
        responses: {
          200: { description: "Session refreshed successfully" },
          401: { description: "Invalid or missing refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Logout student",
        description: "Clears accessToken and refreshToken cookies.",
        responses: {
          200: { description: "Logged out successfully" },
        },
      },
    },
    "/auth/sso/exchange": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Aptech ProConnect SSO authorization code exchange",
        description: "Exchanges single-use authorization code with ProConnect IdP, burns code, performs automatic account linking, attaches existing card, and issues session.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SsoExchangeRequest" },
            },
          },
        },
        responses: {
          200: { description: "SSO identity resolved and student authenticated" },
          400: { description: "Invalid or expired authorization code" },
        },
      },
    },
    "/auth/sso/simulate-code": {
      post: {
        tags: ["Authentication & SSO"],
        summary: "Generate simulated ProConnect SSO code (Dev/Sandbox)",
        description: "Helper endpoint to mint mock authorization codes for local development and UI callback testing.",
        responses: {
          200: { description: "Simulated code and redirect URL generated" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication & SSO"],
        summary: "Get current authenticated student profile & card summary",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "User and card details retrieved" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/card/send-otp": {
      post: {
        tags: ["Card Issuance & KYC"],
        summary: "TransBnk API 1: Generate banking mobile OTP",
        description: "Generates a 6-digit OTP dispatched via SMS from TransBnk core. Mandatory prior to customer registration.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendCardOtpRequest" },
            },
          },
        },
        responses: {
          200: { description: "OTP sent successfully" },
        },
      },
    },
    "/card/me": {
      get: {
        tags: ["Card Issuance & KYC"],
        summary: "Get card details, limits & KYC status",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Card details retrieved successfully" },
        },
      },
    },
    "/card/register-and-issue": {
      post: {
        tags: ["Card Issuance & KYC"],
        summary: "TransBnk APIs 2, 4, 5: Min KYC registration & virtual GPR card creation",
        description: "Verifies mobile OTP + government identity doc, saves senderTag, requests virtual RuPay GPR card provisioning, and syncs status with ProConnect/ApTrack.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterAndIssueCardRequest" },
            },
          },
        },
        responses: {
          200: { description: "Card issuance initiated / completed" },
          400: { description: "Validation error or invalid OTP" },
        },
      },
    },
    "/card/issue-card": {
      post: {
        tags: ["Card Issuance & KYC"],
        summary: "Provision virtual card for registered customer",
        description: "Directly provisions a virtual GPR card if the customer already has a valid senderTag from Min KYC.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Card provisioning started" },
        },
      },
    },
    "/card/full-kyc-url": {
      get: {
        tags: ["Card Issuance & KYC"],
        summary: "TransBnk API 3: Get Full KYC redirect URL (GET)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Aadhaar e-KYC and PAN portal URL generated" },
        },
      },
      post: {
        tags: ["Card Issuance & KYC"],
        summary: "TransBnk API 3: Get Full KYC redirect URL (POST)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Aadhaar e-KYC and PAN portal URL generated" },
        },
      },
    },
    "/card/kyc-status": {
      get: {
        tags: ["Card Issuance & KYC"],
        summary: "Check Oxymoney Full KYC completion status",
        description: "Queries TransBnk API 3. If kyc_required === false, automatically upgrades card limit to ₹2,00,000.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "KYC status retrieved" },
        },
      },
    },
    "/card/complete-kyc": {
      post: {
        tags: ["Card Issuance & KYC"],
        summary: "In-app Full KYC completion verification",
        description: "Verifies gateway approval and upgrades card totalLimit to ₹2,00,000.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CompleteFullKycRequest" },
            },
          },
        },
        responses: {
          200: { description: "Card limit enhanced to ₹2,00,000" },
        },
      },
    },
    "/card/mock-complete-kyc": {
      post: {
        tags: ["Card Issuance & KYC"],
        summary: "Mock Full KYC verification (Sandbox/Demo)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Instant mock upgrade to ₹2,00,000" },
        },
      },
    },
    "/card/poll-status": {
      get: {
        tags: ["Card Issuance & KYC"],
        summary: "TransBnk API 5: Poll card creation status",
        description: "Polls creation status with 2-second rate limit buffer. When card is issued, marks ACTIVE and stores cardId.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Current card status" },
        },
      },
    },
    "/card/sdk-session": {
      get: {
        tags: ["Card Operations & Funds"],
        summary: "PCI-DSS Scoped CardSDK session initialization (GET)",
        description: "Returns clientToken, cardId, and Oxymoney web SDK configurations for rendering secure card details and PIN setup.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "CardSDK session token and config retrieved" },
        },
      },
      post: {
        tags: ["Card Operations & Funds"],
        summary: "PCI-DSS Scoped CardSDK session initialization (POST)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "CardSDK session token and config retrieved" },
        },
      },
    },
    "/card/load": {
      post: {
        tags: ["Card Operations & Funds"],
        summary: "TransBnk APIs 6 & 7: Load money to RuPay GPR prepaid card",
        description: "Enforces distributed locking, idempotency check, KYC limit validation, calls TransBnk /card-gpr-load, and verifies 17-digit bank transaction ID.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }, { idempotencyKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoadMoneyRequest" },
            },
          },
        },
        responses: {
          200: { description: "Funds loaded successfully" },
          400: { description: "Amount exceeds card limit or invalid payment method" },
          409: { description: "Transaction with idempotency key currently in progress" },
        },
      },
    },
    "/card/transactions": {
      get: {
        tags: ["Card Operations & Funds"],
        summary: "Get recent card transaction history",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Transactions ledger retrieved" },
        },
      },
    },
    "/card/controls": {
      patch: {
        tags: ["Card Operations & Funds"],
        summary: "Update card freeze & enabled switches",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCardControlsRequest" },
            },
          },
        },
        responses: {
          200: { description: "Card controls updated successfully" },
        },
      },
    },
    "/hubble/launch-url": {
      post: {
        tags: ["Hubble Rewards - Student"],
        summary: "Generate authenticated Hubble Store launch URL",
        description: "Queries live Aptech coin balance, mints signed 15-minute launch token, and returns URL for opening Hubble marketplace.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Launch URL generated successfully" },
        },
      },
    },
    "/hubble/history": {
      get: {
        tags: ["Hubble Rewards - Student"],
        summary: "Get student voucher redemption history & live coins",
        description: "Fetches live loyalty coin balance and decrypts AES-256 encrypted voucher codes and PINs for the authenticated student.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Vouchers history retrieved" },
        },
      },
    },
    "/hubble/sso": {
      post: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Hubble Classic SSO validation (POST)",
        description: "Invoked by Hubble Cloud with X-Hubble-Secret to validate token and fetch student profile with live coin balance.",
        security: [{ hubbleSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: { token: { type: "string", example: "eyJhbGciOi..." } },
              },
            },
          },
        },
        responses: {
          200: { description: "SSO validated; returns student profile & balance" },
        },
      },
      get: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Hubble Classic SSO validation (GET query parameter)",
        security: [{ hubbleSecret: [] }],
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "SSO validated" },
        },
      },
    },
    "/hubble/balance": {
      post: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Query student loyalty coin balance (POST)",
        security: [{ hubbleSecret: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  studentId: { type: "string", example: "APT-2026-00417" },
                  userId: { type: "string", example: "67a3f8901234567890abcdef" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Live coin balance returned" },
        },
      },
      get: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Query student loyalty coin balance (GET)",
        security: [{ hubbleSecret: [] }],
        parameters: [
          { name: "studentId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Live coin balance returned" },
        },
      },
    },
    "/hubble/debit": {
      post: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Atomically debit coins for voucher purchase",
        description: "Called by Hubble Cloud during voucher checkout. Guarded by distributed locking and transaction-level idempotency.",
        security: [{ hubbleSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HubbleDebitRequest" },
            },
          },
        },
        responses: {
          200: { description: "Coins debited; returns remainingBalance" },
          400: { description: "Insufficient coins or invalid amount" },
        },
      },
    },
    "/hubble/reverse": {
      post: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Two-phase debit reversal & rollback",
        description: "Refunds debited coins if Hubble voucher generation fails. Enforces original debit verification and idempotency.",
        security: [{ hubbleSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HubbleReverseRequest" },
            },
          },
        },
        responses: {
          200: { description: "Debit reversed and coins restored" },
          400: { description: "Original transaction not found or invalid" },
        },
      },
    },
    "/hubble/webhook/transaction-status": {
      post: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Hubble voucher fulfillment webhook",
        description: "Receives issued gift card voucher code and secret PIN. Automatically encrypts credentials with AES-256-GCM. Triggers auto-reversal if order failed.",
        security: [{ hubbleSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HubbleWebhookRequest" },
            },
          },
        },
        responses: {
          200: { description: "Webhook received and voucher stored" },
        },
      },
    },
    "/hubble": {
      get: {
        tags: ["Hubble Rewards - Cloud Callbacks"],
        summary: "Hubble Base Integration Status",
        description: "Status check endpoint for Hubble Base URL connectivity verification.",
        responses: {
          200: { description: "Hubble integration operational" },
        },
      },
    },
    "/status": {
      get: {
        tags: ["System"],
        summary: "API v1 ping",
        responses: {
          200: { description: "API v1 operational" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "System Health & Uptime Diagnostic",
        responses: {
          200: { description: "System operational and healthy" },
        },
      },
    },
  },
};

export type DocsAudience = "student_production" | "internal_full";

export const EXCLUDED_STUDENT_PATHS = [
  "/auth/signup",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/login",
  "/auth/sso/simulate-code",
  "/card/mock-complete-kyc",
] as const;

export function getFilteredSwaggerDocument(audience?: string) {
  const selectedAudience = audience === "internal_full" ? "internal_full" : "student_production";

  if (selectedAudience === "internal_full") {
    return swaggerDocument;
  }

  const excludedSet = new Set<string>(EXCLUDED_STUDENT_PATHS);
  const filteredPaths: Record<string, any> = {};

  for (const [pathKey, pathDef] of Object.entries(swaggerDocument.paths)) {
    if (!excludedSet.has(pathKey)) {
      filteredPaths[pathKey] = pathDef;
    }
  }

  // Filter out request schemas that are only used by the removed endpoints to keep the schema clean
  const { SignupRequest, VerifyOtpRequest, LoginRequest, ...remainingSchemas } = swaggerDocument.components.schemas;

  return {
    ...swaggerDocument,
    info: {
      ...swaggerDocument.info,
      description:
        "Enterprise API documentation for the AP-Tech Digital Prepaid Card, Aptech ProConnect SSO, and Hubble Money Rewards platform (Student Production View).\n\n" +
        "### Key Modules\n" +
        "- **Authentication & ProConnect SSO:** Student single sign-on authorization exchange (`/auth/sso/exchange`), session renewal (`/auth/refresh`), profile verification (`/auth/me`), and logout (`/auth/logout`). Direct signup and credential authentication endpoints are disabled for student-only production environments.\n" +
        "- **Card Issuance & Banking:** TransBnk (TrustHub) RuPay Virtual GPR prepaid card issuance, Min KYC, Aadhaar e-KYC/PAN Full KYC, fund loading (APIs 1–7), and PCI-DSS CardSDK session management.\n" +
        "- **Hubble Rewards & Vouchers:** Live Aptech Coin Ledger balance querying, atomic voucher debits, two-phase rollbacks, and AES-256 encrypted webhook delivery.\n\n" +
        "### Authentication\n" +
        "- **Student / Client Endpoints:** Require `Authorization: Bearer <accessToken>` or the HTTP-only `accessToken` cookie.\n" +
        "- **Hubble Cloud Callbacks:** Require the `X-Hubble-Secret` header.\n" +
        "- **Financial Operations:** Support `Idempotency-Key` headers.",
    },
    tags: swaggerDocument.tags.map((tag) => {
      if (tag.name === "Authentication & SSO") {
        return {
          ...tag,
          description: "Aptech ProConnect SSO token exchange, token rotation, student profile, and logout",
        };
      }
      return tag;
    }),
    components: {
      ...swaggerDocument.components,
      schemas: remainingSchemas,
    },
    paths: filteredPaths,
  };
}

