import { AddAssetClient } from "./client";

export default function AddAssetPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  return <AddAssetClient initialCategory={searchParams.category} />;
}
