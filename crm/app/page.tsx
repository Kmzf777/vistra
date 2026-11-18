import { redirect } from "next/navigation";

// A entrada leva ao Início (a tela chega na Tarefa 9). Sem sessão, o proxy
// manda para o login antes de chegar aqui.
export default function Raiz() {
  redirect("/inicio");
}
