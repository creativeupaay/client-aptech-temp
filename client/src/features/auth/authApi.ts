import { baseApi } from "../../store/api/baseApi";

export interface SignupRequest {
  name: string;
  email: string;
  mobile: string;
  highestEducation: string;
  password: string;
  confirmPassword: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    mobile: string;
    isNewUser: boolean;
    debugOtp?: string;
  };
}

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
}

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  highestEducation: string;
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
    user: AuthUserData;
    card: AuthCardData;
  };
}

export interface ResendOtpRequest {
  mobile: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    mobile: string;
    debugOtp?: string;
  };
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<SignupResponse, SignupRequest>({
      query: (credentials) => ({
        url: "/auth/signup",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    verifyOtp: builder.mutation<AuthSuccessResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
    resendOtp: builder.mutation<ResendOtpResponse, ResendOtpRequest>({
      query: (body) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body,
      }),
    }),
    login: builder.mutation<AuthSuccessResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),
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
  }),
});

export const {
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;

