import { SetAdminPasswordClient } from "./client";

interface Props {
  searchParams: { token?: string };
}

export default function AdminSetPasswordPage({ searchParams }: Props) {
  return <SetAdminPasswordClient token={searchParams.token} />;
}
