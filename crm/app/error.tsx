"use client";

// Pega o erro que escapa de um layout aninhado (por exemplo app/(crm)/layout.tsx, que o (crm)/error.tsx não
// cobre: o error.js não envolve o layout do próprio segmento). Fica dentro do layout raiz, com o estilo do app.
export default function ErroGeral({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "48px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Não deu para carregar o CRM</h1>
      <p style={{ color: "var(--tinta-fraca)" }}>Pode ser a conexão ou o banco. Tente de novo em instantes.</p>
      <button type="button" className="btn btn-forte" style={{ minHeight: 44 }} onClick={() => retry()}>
        Tentar de novo
      </button>
    </main>
  );
}
