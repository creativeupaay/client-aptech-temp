import { baseApi } from "../../store/api/baseApi";

export interface CardData {
  userId: string;
  status: "NOT_APPLIED" | "APPLICATION_PENDING" | "ISSUED" | "ACTIVE" | "FROZEN" | "BLOCKED";
  cardType: "VIRTUAL" | "PHYSICAL";
  kycStatus: "MIN_KYC" | "FULL_KYC";
  senderTag?: string | null;
  cardId?: string | null;
  referenceId?: string | null;
  maskedPan?: string | null;
  availableBalance: number;
  usedAmount: number;
  totalLimit: number;
  isLocked: boolean;
  isCardEnabled: boolean;
}

export interface CardTransactionItem {
  _id: string;
  userId: string;
  cardId?: string | null;
  title: string;
  amount: number;
  paymentMethod?: string | null;
  txnId: string;
  type: "CR" | "DR";
  status: "SUCCESS" | "FAILED" | "PENDING";
  balanceAfter: number;
  createdAt: string;
}

export interface SendCardOtpRequest {
  mobile: string;
}

export interface RegisterAndIssueRequest {
  name: string;
  email: string;
  mobile: string;
  documentType: "AADHAR_NUMBER" | "DRIVING_LICENCE" | "PASSPORT_NUMBER" | "VOTER_ID";
  documentValue: string;
  dateOfBirth?: string;
  otp: string;
  termsAccepted: boolean;
}

export interface CompleteKycRequest {
  aadhaarNumber: string;
  aadhaarOtp: string;
  panNumber: string;
}

export interface LoadMoneyRequest {
  amount: number;
  paymentMethod: string;
  upiId?: string;
  idempotencyKey?: string;
}

export interface LoadMoneyResponseData {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  newBalance: number;
  card: CardData;
}

export interface KycStatusResponse {
  kycStatus: "MIN_KYC" | "FULL_KYC";
  isCompleted: boolean;
  totalLimit: number;
  kycRequired?: boolean;
  url?: string;
  expireOn?: string;
  message?: string;
}

export interface CardSdkSessionResponse {
  cardId: string;
  senderTag: string;
  maskedPan: string;
  holderName: string;
  clientId: string;
  clientToken: string;
  mobileNumber: string;
  sdkUrl: string;
  sdkSessionToken: string;
  environment: string;
}

export const cardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCard: builder.query<{ success: boolean; data: { card: CardData } }, void>({
      query: () => "/card/me",
      providesTags: ["Card"],
    }),

    sendCardOtp: builder.mutation<{ success: boolean; message: string }, SendCardOtpRequest>({
      query: (body) => ({
        url: "/card/send-otp",
        method: "POST",
        body,
      }),
    }),

    registerAndIssueCard: builder.mutation<
      { success: boolean; data: { card: CardData }; message: string },
      RegisterAndIssueRequest
    >({
      query: (body) => ({
        url: "/card/register-and-issue",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Card", "User"],
    }),

    getFullKycUrl: builder.mutation<
      { success: boolean; data: { url: string; kycRequired: boolean } },
      void
    >({
      query: () => ({
        url: "/card/full-kyc-url",
        method: "POST",
      }),
    }),

    checkKycStatus: builder.query<{ success: boolean; data: KycStatusResponse }, void>({
      query: () => "/card/kyc-status",
      providesTags: ["Card"],
    }),

    pollCardStatus: builder.query<{ success: boolean; data: { card: CardData }; message: string }, void>({
      query: () => "/card/poll-status",
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.card) {
            dispatch(
              cardApi.util.updateQueryData("getCard", undefined, (draft) => {
                if (draft?.data) {
                  draft.data.card = data.data.card;
                }
              })
            );
            if (
              data.data.card.status === "ACTIVE" ||
              data.data.card.status === "ISSUED"
            ) {
              dispatch(cardApi.util.invalidateTags(["Card"]));
            }
          }
        } catch {
          // ignore polling transient errors
        }
      },
    }),

    getCardSdkSession: builder.query<{ success: boolean; data: CardSdkSessionResponse }, void>({
      query: () => "/card/sdk-session",
    }),

    completeFullKyc: builder.mutation<
      { success: boolean; data: { card: CardData; newLimit: number }; message: string },
      CompleteKycRequest
    >({
      query: (body) => ({
        url: "/card/complete-kyc",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Card"],
    }),

    mockCompleteFullKyc: builder.mutation<
      { success: boolean; data: { card: CardData; newLimit: number }; message: string },
      void
    >({
      query: () => ({
        url: "/card/mock-complete-kyc",
        method: "POST",
      }),
      invalidatesTags: ["Card"],
    }),

    loadMoney: builder.mutation<
      { success: boolean; data: LoadMoneyResponseData; message: string },
      LoadMoneyRequest
    >({
      query: (body) => ({
        url: "/card/load",
        method: "POST",
        body,
        headers: body.idempotencyKey ? { "Idempotency-Key": body.idempotencyKey } : undefined,
      }),
      invalidatesTags: ["Card", "CardTransactions"],
    }),

    getCardTransactions: builder.query<
      { success: boolean; data: { transactions: CardTransactionItem[] } },
      void
    >({
      query: () => "/card/transactions",
      providesTags: ["CardTransactions"],
    }),

    updateCardControls: builder.mutation<
      { success: boolean; data: { card: CardData } },
      { isCardEnabled?: boolean; isLocked?: boolean }
    >({
      query: (body) => ({
        url: "/card/controls",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Card"],
    }),
  }),
});

export const {
  useGetCardQuery,
  useSendCardOtpMutation,
  useRegisterAndIssueCardMutation,
  useGetFullKycUrlMutation,
  useCheckKycStatusQuery,
  useLazyCheckKycStatusQuery,
  usePollCardStatusQuery,
  useLazyPollCardStatusQuery,
  useGetCardSdkSessionQuery,
  useCompleteFullKycMutation,
  useMockCompleteFullKycMutation,
  useLoadMoneyMutation,
  useGetCardTransactionsQuery,
  useUpdateCardControlsMutation,
} = cardApi;

