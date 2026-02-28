import { DEFAULT_AGENT_SCOPES } from "@/lib/constants";
import { generateOpaqueToken, hashToken } from "@/lib/security";

export function createAgentApiKey(): {
  plaintextKey: string;
  keyHash: string;
} {
  const plaintextKey = `hm_${generateOpaqueToken(24)}`;
  return {
    plaintextKey,
    keyHash: hashToken(plaintextKey),
  };
}

export function normalizeScopes(input?: string[]): string {
  const scopes = input && input.length > 0 ? input : [...DEFAULT_AGENT_SCOPES];
  return Array.from(new Set(scopes)).join(",");
}
