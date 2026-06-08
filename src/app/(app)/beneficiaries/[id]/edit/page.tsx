import { EditBeneficiaryClient } from "./client";

interface Props {
  params: { id: string };
}

export default function EditBeneficiaryPage({ params }: Props) {
  return <EditBeneficiaryClient id={params.id} />;
}
