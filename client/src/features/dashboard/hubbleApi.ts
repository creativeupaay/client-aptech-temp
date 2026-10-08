import { baseApi } from "../../store/api/baseApi";

export interface HubbleLaunchResponse {
  success: boolean;
  message: string;
  data: {
    launchUrl: string;
    token: string;
    expiresIn: string;
    student: {
      id: string;
      studentId: string;
      name: string;
      loyaltyPoints: number;
    };
  };
}

export interface HubbleHistoryResponse {
  success: boolean;
  message: string;
  data: {
    currentBalance: number;
    vouchers: Array<{
      _id: string;
      brandName: string;
      voucherCode?: string;
      pin?: string;
      denomination: number;
      pointsDebited: number;
      status: string;
      createdAt: string;
    }>;
    ledger: Array<{
      _id: string;
      transactionId: string;
      type: "CREDIT" | "DEBIT" | "REVERSAL";
      amount: number;
      balanceAfter: number;
      reason?: string;
      createdAt: string;
    }>;
  };
}

export const hubbleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHubbleLaunchUrl: builder.mutation<HubbleLaunchResponse, void>({
      query: () => ({
        url: "/hubble/launch-url",
        method: "POST",
      }),
    }),
    getHubbleHistory: builder.query<HubbleHistoryResponse, void>({
      query: () => "/hubble/history",
      providesTags: ["HubbleHistory"],
    }),
  }),
});

export const { useGetHubbleLaunchUrlMutation, useGetHubbleHistoryQuery } = hubbleApi;
