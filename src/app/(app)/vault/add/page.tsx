import { AddAssetClient } from "./client";

export default function AddAssetPage({
  searchParams,
}: {
  searchParams: { category?: string; quick?: string };
}) {
  return (
    <AddAssetClient
      initialCategory={searchParams.category}
      quickEntry={searchParams.quick === "1"}
    />
  );
}
