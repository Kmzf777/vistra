"use client";

// Último recurso: erro no próprio layout raiz. Substitui o layout inteiro, então traz o próprio <html> e <body>
// e não usa o globals.css (cores escritas aqui, na marca: verde sobre preto).
export default function ErroGlobal({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <title>Vistra CRM</title>
        <main
          style={{ maxWidth: 480, margin: "0 auto", padding: "48px 16px", display: "flex", flexDirection: "column", gap: 16 }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Não deu para carregar o CRM</h1>
          <p style={{ margin: 0, color: "#bbb" }}>Pode ser a conexão ou o banco. Tente de novo em instantes.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 44,
              padding: "10px 16px",
              border: "none",
              borderRadius: 8,
              background: "#39FF14",
              color: "#000",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
