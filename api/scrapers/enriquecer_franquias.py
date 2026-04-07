"""
Enriquece a base de franquias com dados de sites oficiais e páginas de detalhe.

Etapa 1: Sites oficiais (73 franquias com site_oficial preenchido)
  - Extrai meta description → descricao_longa
  - Procura ano de fundação no HTML

Etapa 2: Páginas de detalhe do RankFranchise (franquias sem segmento)
  - Extrai og:description com dados estruturados
  - Tenta classificar segmento pelo nome/descrição

Uso:
  python3 api/scrapers/enriquecer_franquias.py             # todas
  python3 api/scrapers/enriquecer_franquias.py --limit 5   # teste com 5
  python3 api/scrapers/enriquecer_franquias.py --etapa 1   # só sites oficiais
  python3 api/scrapers/enriquecer_franquias.py --etapa 2   # só segmentos
"""

import argparse
import html as html_mod
import os
import re
import ssl
import sys
import time
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from database import get_conn, init_db

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

TIMEOUT = 8
RATE_LIMIT = 1

# Mapa de palavras-chave → segmento para classificação automática
KEYWORDS_SEGMENTO = {
    "Alimentação": ["restaurante", "pizza", "hambur", "acai", "sorvete", "cafe", "padaria", "bolo",
                     "food", "comida", "lanche", "sushi", "churrasco", "drink", "cerveja", "bar ",
                     "doceria", "cookie", "chocolate", "grill", "pastel", "coxinha", "poke",
                     "burrito", "taco", "waffle", "crepe", "churros", "salad", "juice", "market"],
    "Saúde, Beleza e Bem-Estar": ["otica", "optica", "odonto", "dentist", "clinica", "saude",
                                    "beleza", "estetica", "depila", "laser", "cosmet", "farma",
                                    "vacina", "fisio", "pilates", "yoga", "nutri", "pet", "vet",
                                    "beauty", "hair", "nail", "spa"],
    "Serviços Educacionais": ["escola", "educa", "curso", "idioma", "ingles", "kumon", "ensino",
                               "treinamento", "coaching", "wizard", "fisk", "ccaa", "wise up"],
    "Moda": ["roupa", "moda", "joia", "semijoia", "relogio", "oculos", "calcado", "sapato",
             "tenis", "fashion", "wear", "shirt", "jeans", "lingerie", "underwear", "bag"],
    "Casa e Construção": ["movel", "colch", "tintas", "construc", "imobil", "decor", "casa",
                           "home", "jardim", "piscina", "solar", "energia"],
    "Serviços e Outros Negócios": ["segur", "contab", "consult", "advocacia", "juridic",
                                    "financ", "credito", "cambio", "cowork", "logist",
                                    "grafica", "cartorio", "despach", "rh ", "marketing"],
    "Hotelaria e Turismo": ["hotel", "hostel", "pousada", "viagem", "turismo", "travel", "cvc"],
    "Serviços Automotivos": ["auto", "car ", "carro", "moto", "oil", "lube", "funilaria",
                              "mecanica", "pneu", "lavagem", "estaciona"],
    "Limpeza e Conservação": ["lavanderia", "limpeza", "clean", "higien", "conserv", "5asec"],
    "Comunicação, Informática e Eletrônicos": ["celular", "phone", "tech", "inform", "comput",
                                                 "eletro", "assist", "reparo", "telecom"],
    "Entretenimento e Lazer": ["game", "jogo", "escape", "park", "diversao", "esporte",
                                "academia", "fitness", "gym", "crossfit"],
}


def _fetch_html(url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def classificar_segmento(nome, descricao=None):
    """Tenta classificar o segmento pela análise do nome e descrição."""
    texto = f"{nome} {descricao or ''}".lower()
    texto = re.sub(r"[àáâãä]", "a", texto)
    texto = re.sub(r"[èéêë]", "e", texto)
    texto = re.sub(r"[ìíîï]", "i", texto)
    texto = re.sub(r"[òóôõö]", "o", texto)
    texto = re.sub(r"[ùúûü]", "u", texto)
    texto = re.sub(r"[ç]", "c", texto)

    scores = {}
    for segmento, keywords in KEYWORDS_SEGMENTO.items():
        score = sum(1 for kw in keywords if kw in texto)
        if score > 0:
            scores[segmento] = score

    if scores:
        return max(scores, key=scores.get)
    return None


def extrair_dados_site(html):
    """Extrai dados úteis de uma página web genérica."""
    h = html_mod.unescape(html)
    dados = {}

    # Meta description
    meta = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]+)"', h, re.IGNORECASE)
    if not meta:
        meta = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]+)"', h, re.IGNORECASE)
    if meta:
        desc = meta.group(1).strip()
        if len(desc) > 30:
            dados["descricao_longa"] = desc[:1000]

    # Ano de fundação
    for pattern in [
        r"[Ff]undad[ao]\s*(?:em\s*)?(\d{4})",
        r"[Ff]unda[çc][aã]o\s*(?:em\s*)?(\d{4})",
        r"[Dd]esde\s+(\d{4})",
        r"[Hh]ist[oó]ria.*?(\d{4})",
    ]:
        m = re.search(pattern, h)
        if m:
            ano = int(m.group(1))
            if 1950 <= ano <= 2026:
                dados["ano_fundacao"] = ano
                break

    return dados


# ── Etapa 1: Sites oficiais ────────────────────────────────────────────────

def enriquecer_via_sites(limit=None):
    """Busca dados nos sites oficiais das franquias."""
    conn = get_conn()
    rows = conn.execute(
        """SELECT id, nome, site_oficial FROM franquias
           WHERE site_oficial IS NOT NULL AND site_oficial != ''
           AND (descricao_longa IS NULL OR ano_fundacao IS NULL)
           ORDER BY nome"""
    ).fetchall()
    conn.close()

    if limit:
        rows = rows[:limit]

    print(f"\n[Etapa 1] Enriquecendo {len(rows)} franquias via sites oficiais\n")

    atualizados = 0
    erros = 0

    for i, row in enumerate(rows):
        fid, nome, site = row["id"], row["nome"], row["site_oficial"]
        time.sleep(RATE_LIMIT)

        try:
            html = _fetch_html(site)
            dados = extrair_dados_site(html)

            if dados:
                conn = get_conn()
                sets = []
                params = []
                for campo, valor in dados.items():
                    sets.append(f"{campo} = ?")
                    params.append(valor)
                sets.append("updated_at = datetime('now')")
                params.append(fid)

                conn.execute(f"UPDATE franquias SET {', '.join(sets)} WHERE id = ?", params)
                conn.commit()
                conn.close()
                atualizados += 1
                info = []
                if dados.get("descricao_longa"):
                    info.append(f"desc={len(dados['descricao_longa'])}ch")
                if dados.get("ano_fundacao"):
                    info.append(f"ano={dados['ano_fundacao']}")
                print(f"  [{i+1}/{len(rows)}] {nome:35s} OK — {', '.join(info)}")
            else:
                print(f"  [{i+1}/{len(rows)}] {nome:35s} sem dados úteis")

        except Exception as e:
            erros += 1
            err_msg = str(e)[:60]
            print(f"  [{i+1}/{len(rows)}] {nome:35s} ERRO — {err_msg}")

    return atualizados, erros


# ── Etapa 2: Classificar segmentos ─────────────────────────────────────────

def classificar_segmentos(limit=None):
    """Classifica segmentos das franquias sem segmento usando heurística por nome."""
    conn = get_conn()
    rows = conn.execute(
        """SELECT id, nome, descricao FROM franquias
           WHERE segmento IS NULL
           ORDER BY nome"""
    ).fetchall()

    if limit:
        rows = rows[:limit]

    print(f"\n[Etapa 2] Classificando segmentos de {len(rows)} franquias\n")

    classificados = 0

    for row in rows:
        fid, nome, descricao = row["id"], row["nome"], row["descricao"]
        segmento = classificar_segmento(nome, descricao)

        if segmento:
            conn.execute(
                "UPDATE franquias SET segmento = ?, updated_at = datetime('now') WHERE id = ?",
                (segmento, fid),
            )
            classificados += 1

    conn.commit()
    conn.close()

    print(f"  Classificados: {classificados} de {len(rows)}")
    return classificados


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Enriquece base de franquias")
    parser.add_argument("--limit", type=int, help="Limite de franquias por etapa")
    parser.add_argument("--etapa", type=int, choices=[1, 2], help="Rodar só etapa 1 ou 2")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  Enriquecimento de franquias — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

    init_db()
    conn = get_conn()

    total_sites = 0
    total_erros = 0
    total_segs = 0

    if not args.etapa or args.etapa == 1:
        total_sites, total_erros = enriquecer_via_sites(limit=args.limit)

    if not args.etapa or args.etapa == 2:
        total_segs = classificar_segmentos(limit=args.limit)

    # Log
    conn = get_conn()
    conn.execute(
        "INSERT INTO sync_log(fonte, status, registros_inseridos, erro) VALUES(?,?,?,?)",
        (
            "Enriquecimento/franquias",
            "ok" if total_erros == 0 else "parcial",
            total_sites + total_segs,
            f"{total_erros} erros em sites" if total_erros else None,
        ),
    )
    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"  Sites oficiais: {total_sites} enriquecidos, {total_erros} erros")
    print(f"  Segmentos classificados: {total_segs}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
