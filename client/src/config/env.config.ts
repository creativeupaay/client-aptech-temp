export const env = Object.freeze({
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  IS_DEV: import.meta.env.DEV,

  IS_PROD: import.meta.env.PROD,
});
