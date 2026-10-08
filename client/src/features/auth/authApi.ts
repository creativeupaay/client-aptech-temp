import { baseApi } from "../../store/api/baseApi";

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  studentId?: string;
  highestEducation?: string;
  isMobileVerified: boolean;
  status: string;
  userType: string;
  role: string;
}

export interface AuthCardData {
  status: string;
  cardType: string;
  kycStatus: string;
  maskedPan: string | null;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    isCardIssued?: boolean;
    user: AuthUserData;
    card: AuthCardData;
  };
}

export interface SsoExchangeRequest {
  code: string;
}

export interface SimulateSsoRequest {
  studentId?: string;
  name?: string;
  mobile?: string;
  email?: string;
}

export interface SimulateSsoResponse {
  success: boolean;
  message: string;
  data: {
    code: string;
    redirectUrl: string;
  };
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AuthSuccessResponse, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    exchangeSsoCode: builder.mutation<AuthSuccessResponse, SsoExchangeRequest>({
      query: (body) => ({
        url: "/auth/sso/exchange",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    simulateSsoCode: builder.mutation<SimulateSsoResponse, SimulateSsoRequest>({
      query: (body) => ({
        url: "/auth/sso/simulate-code",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLogoutMutation,
  useExchangeSsoCodeMutation,
  useSimulateSsoCodeMutation,
} = authApi;
