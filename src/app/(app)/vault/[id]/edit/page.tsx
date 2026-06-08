import { EditAssetClient } from "./client";

interface Props {
  params: { id: string };
}

export default function EditAssetPage({
  params,
}: Props) {
  return <EditAssetClient id={params.id} />;
}