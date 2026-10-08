import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { env } from "../../config/env.config";
import { API_TAGS } from "./apiTags";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("tbx_auth_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If 401 occurs, attempt silent token refresh via HTTP-only cookie
  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    if (!url.includes("/auth/refresh")) {
      const refreshResult = await rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        interface RefreshData {
          data?: { token?: string };
        }
        const token = (refreshResult.data as RefreshData)?.data?.token;
        if (token) {
          localStorage.setItem("tbx_auth_token", token);
        }
        // Retry original request with fresh credentials
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        localStorage.removeItem("tbx_auth_token");
        localStorage.removeItem("tbx_student_user");
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: API_TAGS,
  endpoints: () => ({}),
});
