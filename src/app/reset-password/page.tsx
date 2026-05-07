import { ResetPasswordClient } from "./client";

interface Props {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: Props) {
  return <ResetPasswordClient token={searchParams.token} />;
}
