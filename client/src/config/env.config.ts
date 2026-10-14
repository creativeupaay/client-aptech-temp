export const env = Object.freeze({
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  SUPPORT_URL:
    import.meta.env.VITE_SUPPORT_URL || "mailto:support@aptech-learning.com",
  IS_DEV: import.meta.env.DEV,

  IS_PROD: import.meta.env.PROD,
});
