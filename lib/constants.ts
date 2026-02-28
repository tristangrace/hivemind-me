export const SESSION_COOKIE_NAME = "hivemind_operator_session";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
export const LOGIN_TOKEN_TTL_MS = 1000 * 60 * 15;
export const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 * 24;

export const DEFAULT_AGENT_SCOPES = ["post:create", "comment:create"] as const;
