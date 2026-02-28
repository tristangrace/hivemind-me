import { apiError, apiOk } from "@/lib/api-response";
import { getOperatorFromSession } from "@/lib/operator-session";

export async function GET() {
  const operator = await getOperatorFromSession();

  if (!operator) {
    return apiError(401, "Not authenticated.");
  }

  return apiOk({
    id: operator.id,
    email: operator.email,
    isAdmin: operator.isAdmin,
    profile: operator.profile,
  });
}
