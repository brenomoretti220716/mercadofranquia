"""
Import one-shot do RankFranchise — 1.400+ franquias.

- Faz upsert: atualiza existentes (Portal do Franchising), insere novas
- Matching por nome normalizado (remove prefixo "Franquia", acentos, pontuação)
- Campos novos: ranking_posicao, num_unidades, retorno_meses, faturamento_medio
- Execução única: python3 api/scrapers/import_rankfranchise.py
"""

import os
import re
import ssl
import sys
from datetime import datetime
from urllib.request import urlopen, Request

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from database import get_conn, init_db

import html as html_mod

URL = "https://rankfranchise.com/search-results/?min-price=&max-price=&keyword="
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}


def normalizar_nome(nome):
    """Normaliza nome para matching: remove 'Franquia ', acentos, pontuação."""
    n = nome.upper().strip()
    n = re.sub(r"^FRANQUIA\s+", "", n)
    n = re.sub(r"[^A-Z0-9\s]", "", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def nome_limpo(nome_raw):
    """Remove prefixo 'Franquia ' redundante e limpa o nome."""
    n = nome_raw.strip()
    # Se começa com "Franquia " e o resto é um nome próprio, remove
    m = re.match(r"^Franquia\s+(.+)", n, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return n


def slugify(nome):
    slug = nome.lower().strip()
    slug = re.sub(r"[àáâãä]", "a", slug)
    slug = re.sub(r"[èéêë]", "e", slug)
    slug = re.sub(r"[ìíîï]", "i", slug)
    slug = re.sub(r"[òóôõö]", "o", slug)
    slug = re.sub(r"[ùúûü]", "u", slug)
    slug = re.sub(r"[ç]", "c", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def parse_investimento(texto):
    """Extrai min/max de '100.000 a 340.000' ou '350000'."""
    if not texto:
        return None, None
    limpo = texto.replace("R$", "").replace("r$", "").strip()
    # Formato: 100.000 a 340.000
    m = re.findall(r"([\d.]+)", limpo.replace(",", ""))
    valores = []
    for v in m:
        try:
            f = float(v.replace(".", ""))
            if f > 500:  # ignora valores pequenos
                valores.append(f)
        except ValueError:
            continue
    if not valores:
        # Tentar formato sem ponto: 350000
        m2 = re.findall(r"(\d{4,})", limpo)
        for v in m2:
            try:
                valores.append(float(v))
            except ValueError:
                continue
    if len(valores) >= 2:
        return min(valores), max(valores)
    if len(valores) == 1:
        return valores[0], valores[0]
    return None, None


def parse_retorno(texto):
    """Extrai meses de retorno: 'de 12 a 18 meses' -> (12, 18)."""
    if not texto:
        return None
    m = re.findall(r"(\d+)", texto)
    if len(m) >= 2:
        return f"{m[0]} a {m[1]} meses"
    if len(m) == 1:
        return f"{m[0]} meses"
    return None


def parse_faturamento(texto):
    """Extrai faturamento: 'R$80.000' -> 80000."""
    if not texto or "N/D" in texto:
        return None
    m = re.findall(r"[\d.]+", texto.replace(",", ""))
    for v in m:
        try:
            f = float(v.replace(".", ""))
            if f > 100:
                return f
        except ValueError:
            continue
    return None


def fetch_and_parse():
    """Busca e parseia a tabela do RankFranchise."""
    print("Buscando rankfranchise.com...")
    req = Request(URL, headers=HEADERS)
    with urlopen(req, timeout=30, context=SSL_CTX) as resp:
        raw = resp.read().decode("utf-8", errors="ignore")
    h = html_mod.unescape(raw)
    print(f"HTML: {len(h):,} chars")

    franquias = []
    rows = re.findall(r"<tr>(.*?)</tr>", h, re.DOTALL)

    for row in rows:
        if "<th" in row or "header" in row:
            continue

        # Rank e nome
        name_match = re.search(r"#(\d+)\s*</span>.*?<span>(.*?)</span>", row, re.DOTALL)
        if not name_match:
            continue

        rank = int(name_match.group(1))
        nome_raw = re.sub(r"<[^>]+>", "", name_match.group(2)).strip()

        # Logo
        logo = None
        logo_match = re.search(r'<img[^>]*src="(https?://rankfranchise\.com/wp-content/[^"]+)"', row)
        if logo_match:
            logo = logo_match.group(1)

        # Link detalhe
        link = None
        link_match = re.search(r'href="(https?://rankfranchise\.com/property/[^"]+)"', row)
        if link_match:
            link = link_match.group(1)

        # Colunas
        tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL)
        unidades_raw = re.sub(r"<[^>]+>", "", tds[1]).strip() if len(tds) > 1 else ""
        invest_raw = re.sub(r"<[^>]+>", "", tds[2]).strip() if len(tds) > 2 else ""
        retorno_raw = re.sub(r"<[^>]+>", "", tds[3]).strip() if len(tds) > 3 else ""
        taxa_raw = re.sub(r"<[^>]+>", "", tds[4]).strip() if len(tds) > 4 else ""
        fat_raw = re.sub(r"<[^>]+>", "", tds[5]).strip() if len(tds) > 5 else ""

        # Parse valores
        nome = nome_limpo(nome_raw)
        inv_min, inv_max = parse_investimento(invest_raw)

        num_unidades = None
        if unidades_raw:
            m = re.search(r"(\d+)", unidades_raw.replace(".", ""))
            if m:
                num_unidades = int(m.group(1))

        franquias.append({
            "rank": rank,
            "nome": nome,
            "nome_normalizado": normalizar_nome(nome),
            "slug": slugify(nome),
            "num_unidades": num_unidades,
            "investimento_min": inv_min,
            "investimento_max": inv_max,
            "retorno": parse_retorno(retorno_raw),
            "faturamento_medio": parse_faturamento(fat_raw),
            "logo_url": logo,
            "url_fonte": link,
        })

    print(f"Parseadas: {len(franquias)} franquias")
    return franquias


def importar():
    """Importa com upsert inteligente: atualiza existentes, insere novas."""
    init_db()
    conn = get_conn()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Buscar existentes e indexar por nome normalizado
    existentes = {}
    for r in conn.execute("SELECT id, nome FROM franquias").fetchall():
        norm = normalizar_nome(r["nome"])
        existentes[norm] = {"id": r["id"], "nome": r["nome"]}

    franquias = fetch_and_parse()

    atualizados = 0
    inseridos = 0
    ignorados = 0

    for f in franquias:
        norm = f["nome_normalizado"]

        if norm in existentes:
            # UPDATE: enriquecer registro existente sem sobrescrever dados do Portal
            conn.execute(
                """UPDATE franquias SET
                       num_unidades = COALESCE(?, num_unidades),
                       investimento_min = COALESCE(investimento_min, ?),
                       investimento_max = COALESCE(investimento_max, ?),
                       logo_url = COALESCE(logo_url, ?),
                       data_coleta = ?,
                       updated_at = datetime('now')
                   WHERE id = ?""",
                (
                    f["num_unidades"],
                    f["investimento_min"],
                    f["investimento_max"],
                    f["logo_url"],
                    now,
                    existentes[norm]["id"],
                ),
            )
            atualizados += 1
        else:
            # INSERT: nova franquia
            conn.execute(
                """INSERT INTO franquias(nome, slug, segmento, investimento_min, investimento_max,
                       num_unidades, logo_url, fonte, url_fonte, data_coleta)
                   VALUES(?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(nome) DO UPDATE SET
                       num_unidades = COALESCE(excluded.num_unidades, franquias.num_unidades),
                       investimento_min = COALESCE(excluded.investimento_min, franquias.investimento_min),
                       investimento_max = COALESCE(excluded.investimento_max, franquias.investimento_max),
                       logo_url = COALESCE(excluded.logo_url, franquias.logo_url),
                       data_coleta = excluded.data_coleta,
                       updated_at = datetime('now')""",
                (
                    f["nome"],
                    f["slug"],
                    None,  # segmento desconhecido no RF
                    f["investimento_min"],
                    f["investimento_max"],
                    f["num_unidades"],
                    f["logo_url"],
                    "RankFranchise",
                    f["url_fonte"],
                    now,
                ),
            )
            inseridos += 1

    conn.commit()

    # Log
    conn.execute(
        "INSERT INTO sync_log(fonte, status, registros_inseridos, erro) VALUES(?,?,?,?)",
        ("Import/RankFranchise", "ok", inseridos + atualizados, None),
    )
    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"  Resultado do import")
    print(f"  Atualizados (match): {atualizados}")
    print(f"  Inseridos (novos):   {inseridos}")
    print(f"  Total no banco:      {atualizados + inseridos}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    importar()
