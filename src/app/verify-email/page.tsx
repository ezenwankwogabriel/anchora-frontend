import { VerifyEmailClient } from "./client";

interface Props {
  searchParams: { email?: string; token?: string };
}

export default function VerifyEmailPage({ searchParams }: Props) {
  return <VerifyEmailClient email={searchParams.email} token={searchParams.token} />;
}
