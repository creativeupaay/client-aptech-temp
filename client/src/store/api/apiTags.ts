/**
 * Unified central repository of all RTK Query cache tag types.
 * Add all tag types here to ensure strict tag tracking and automated query invalidation across feature modules.
 */
export const API_TAGS = [
  "Auth",
  "User",
] as const;

export type ApiTag = (typeof API_TAGS)[number];
