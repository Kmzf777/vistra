# -*- coding: utf-8 -*-
"""Monta a planilha de cold call a partir de leads/raw.json."""
import json, re, sys, csv, unicodedata
from pathlib import Path
from collections import Counter
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from urllib.parse import quote

# Franquias nacionais / redes com mais de uma loja em Uberlandia.
# Lista explicita: a deteccao automatica por prefixo confundia negocios
# independentes que so compartilham uma palavra generica (Toca das Patas x
# Toca do Toto x Toca do Cachorro sao tres donos diferentes).
FRANQUIAS = ["petz", "petland", "cobasi", "pet camp", "petsbr", "uai pet store",
             "petplus", "balux", "centro oeste pet store", "vivara",
             "agrodez", "pet shop saraiva", "vitality pet"]
RUIDO = ["hospital e maternidade", "madrecor", "complexo de saude", "guliatto",
         "academia", "terminal", "frigorifico", "restaurante do dogao",
         "pet escola instituto groomer"]

def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s

def marca(nome):
    """Primeiro token distintivo -- usado para achar redes multi-unidade."""
    n = norm(nome)
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    stop = {"pet","shop","petshop","banho","e","tosa","de","da","do","clinica",
            "veterinaria","veterinario","casa","loja","uberlandia","udi","agro",
            "animal","hotel","spa","store","racoes","racao","pets","center"}
    toks = [t for t in n.split() if t not in stop and len(t) >= 4]
    return toks[0] if toks else n.strip()

def classifica(site, ig, seg):
    """Quanto menor a ordem, mais fraca a presenca online -> mais prioritario."""
    if not site and not ig:
        return "SEM PRESENCA", 0
    if ig and not site:
        if seg is None:          return "SO INSTAGRAM", 3
        if seg < 300:            return "IG QUASE MORTO", 1
        if seg < 1000:           return "IG FRACO", 2
        return "SO INSTAGRAM", 3
    if site and not ig:
        return "SO SITE", 4
    return "SITE + IG", 5

def main(src="leads/raw.json"):
    rows = json.loads(Path(src).read_text(encoding="utf-8"))

    out, fora = [], []
    for r in rows:
        n = norm(r["nome"])
        if r.get("fechado"):
            fora.append((r["nome"], "permanentemente fechado")); continue
        if any(k in n for k in FRANQUIAS):
            fora.append((r["nome"], "franquia/rede conhecida")); continue
        if any(k in n for k in RUIDO):
            fora.append((r["nome"], "nao e pet shop")); continue
        seg = r.get("seguidores")
        seg = int(seg) if isinstance(seg, int) else (int(seg) if isinstance(seg, str) and seg.isdigit() else None)
        presenca, ordem = classifica(r.get("site"), r.get("ig"), seg)
        out.append({
            "Nome": r["nome"], "Presenca online": presenca,
            "Instagram": r.get("ig", "") or "", "Seguidores": seg if seg is not None else "",
            "Site": r.get("site", "") or "", "Telefone": r.get("tel", "") or "",
            "Endereco": r.get("end", "") or "", "Categoria": r.get("cat", "") or "",
            "Nota": r.get("nota", "") or "", "Avaliacoes": r.get("aval", "") or "",
            "Google Maps": "https://www.google.com/maps/search/" + quote(r["nome"] + " Uberlandia MG"),
            "_o": ordem,
        })

    out.sort(key=lambda x: (x["_o"], x["Seguidores"] if isinstance(x["Seguidores"], int) else 0,
                            -(int(x["Avaliacoes"]) if str(x["Avaliacoes"]).isdigit() else 0)))
    for o in out: o.pop("_o")
    cols = list(out[0].keys())

    dest = Path("leads"); dest.mkdir(exist_ok=True)
    with open(dest / "petshops_uberlandia.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols, delimiter=";")
        w.writeheader(); w.writerows(out)

    wb = Workbook(); ws = wb.active; ws.title = "Leads"
    ws.append(cols)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F3864")
        c.alignment = Alignment(vertical="center")
    cores = {"SEM PRESENCA": "C00000", "IG QUASE MORTO": "C55A11", "IG FRACO": "E36C0A",
             "SO INSTAGRAM": "BF8F00", "SO SITE": "808080", "SITE + IG": "375623"}
    for o in out:
        ws.append([o[c] for c in cols])
        ws.cell(row=ws.max_row, column=2).font = Font(bold=True, color=cores.get(o["Presenca online"], "000000"))
    for i, wd in enumerate([34, 17, 42, 11, 38, 18, 40, 20, 7, 11, 55], start=1):
        ws.column_dimensions[get_column_letter(i)].width = wd
    ws.freeze_panes = "A2"; ws.auto_filter.ref = ws.dimensions
    wb.save(dest / "petshops_uberlandia.xlsx")

    print(f"LEADS NA PLANILHA: {len(out)}")
    for k, v in Counter(o["Presenca online"] for o in out).most_common():
        print(f"  {k}: {v}")
    print(f"\nFORA DA LISTA ({len(fora)}):")
    for n, m in fora: print(f"  - {n}  [{m}]")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "leads/raw.json")
