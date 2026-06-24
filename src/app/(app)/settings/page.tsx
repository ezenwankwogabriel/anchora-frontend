import { SettingsClient } from "./client";

export default function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  return <SettingsClient initialTab={searchParams.tab} />;
}
