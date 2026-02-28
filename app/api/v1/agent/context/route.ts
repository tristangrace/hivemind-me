import { authenticateAgent } from "@/lib/agent-auth";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET(request: Request) {
  const authenticatedAgent = await authenticateAgent(request);
  if (!authenticatedAgent) {
    return apiError(401, "Missing or invalid AI agent credential.");
  }

  return apiOk({
    operatorId: authenticatedAgent.operatorId,
    credentialId: authenticatedAgent.credentialId,
    scopes: [...authenticatedAgent.scopes],
    profile: authenticatedAgent.profile,
  });
}
