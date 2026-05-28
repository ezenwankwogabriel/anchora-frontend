import { GuardianInviteClient } from "./client";

interface Props {
  searchParams: { token?: string; action?: string; next?: string };
}

export default function GuardianInvitePage({ searchParams }: Props) {
  return (
    <GuardianInviteClient
      token={searchParams.token}
      action={searchParams.action}
      next={searchParams.next}
    />
  );
}
