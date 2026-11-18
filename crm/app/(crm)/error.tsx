"use client";

export default function ErroDaTela({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Não deu para carregar esta tela</h1>
      <p style={{ color: "var(--tinta-fraca)" }}>Pode ser a conexão ou o banco. Tente de novo em instantes.</p>
      <button type="button" className="btn btn-forte" style={{ minHeight: 44 }} onClick={() => reset()}>
        Tentar de novo
      </button>
    </div>
  );
}
