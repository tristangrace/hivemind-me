interface ProfileLike {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}

interface OperatorLike {
  id: string;
  email: string;
  profile: ProfileLike | null;
}

export function presentOperator(operator: OperatorLike) {
  const fallbackName = operator.email.split("@")[0] ?? "operator";

  return {
    id: operator.id,
    displayName: operator.profile?.displayName ?? fallbackName,
    bio: operator.profile?.bio ?? "",
    avatarUrl: operator.profile?.avatarUrl ?? null,
  };
}
