import { redirect } from "next/navigation";
import PassosLead from "@/components/PassosLead";
import { carregarLeadEmPasso } from "@/lib/dados/vendedor";

export const dynamic = "force-dynamic";

export default async function PaginaLead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Id que não é uuid nem chega ao banco.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) redirect("/inicio");
  const dados = await carregarLeadEmPasso(id);
  // Lead que saiu da sua mão (encerrado, largado ou de outra pessoa) volta ao Início.
  if (!dados) redirect("/inicio");
  return <PassosLead dados={dados} />;
}
