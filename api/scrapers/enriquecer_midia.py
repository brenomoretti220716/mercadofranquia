"""
Enriquece franquias com og:image e meta description dos sites oficiais.

Só preenche campos vazios — nunca sobrescreve dados existentes.

Uso:
  python3 api/scrapers/enriquecer_midia.py             # todas com site_oficial
  python3 api/scrapers/enriquecer_midia.py --limit 5   # teste
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


def _fetch_html(url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
        raw = resp.read(500_000)  # limita a 500KB
        return raw.decode("utf-8", errors="ignore")


def _meta(html, prop):
    """Extrai conteúdo de uma meta tag por property ou name."""
    for attr in ["property", "name"]:
        m = re.search(
            rf'<meta[^>]*{attr}="{prop}"[^>]*content="([^"]+)"',
            html, re.IGNORECASE,
        )
        if m:
            return html_mod.unescape(m.group(1).strip())
        # Ordem invertida (content antes de property)
        m = re.search(
            rf'<meta[^>]*content="([^"]+)"[^>]*{attr}="{prop}"',
            html, re.IGNORECASE,
        )
        if m:
            return html_mod.unescape(m.group(1).strip())
    return None


def extrair_og(html):
    """Extrai og:image, og:description e og:title."""
    return {
        "og_image": _meta(html, "og:image"),
        "og_description": _meta(html, "og:description") or _meta(html, "description"),
        "og_title": _meta(html, "og:title"),
    }


def main():
    parser = argparse.ArgumentParser(description="Enriquece franquias com og:image e description")
    parser.add_argument("--limit", type=int, help="Limite de franquias")
    args = parser.parse_args()

    init_db()
    conn = get_conn()

    rows = conn.execute(
        """SELECT id, nome, site_oficial, descricao, imagem_og
           FROM franquias
           WHERE site_oficial IS NOT NULL AND site_oficial != ''
           ORDER BY nome"""
    ).fetchall()
    conn.close()

    if args.limit:
        rows = rows[:args.limit]

    print(f"\n{'='*60}")
    print(f"  Enriquecimento de mídia — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  {len(rows)} franquias com site oficial")
    print(f"{'='*60}\n")

    ok_image = 0
    ok_desc = 0
    erros = 0

    for i, row in enumerate(rows):
        fid = row["id"]
        nome = row["nome"]
        site = row["site_oficial"]
        desc_atual = row["descricao"]
        img_atual = row["imagem_og"]

        time.sleep(RATE_LIMIT)

        try:
            html = _fetch_html(site)
            og = extrair_og(html)

            updates = []
            params = []

            # imagem_og: sempre salva (campo dedicado)
            if og["og_image"] and not img_atual:
                updates.append("imagem_og = ?")
                params.append(og["og_image"])
                ok_image += 1

            # descricao: só se vazio
            if og["og_description"] and not desc_atual and len(og["og_description"]) > 20:
                updates.append("descricao = ?")
                params.append(og["og_description"][:500])
                ok_desc += 1

            info = []
            if og["og_image"] and not img_atual:
                info.append("img")
            if og["og_description"] and not desc_atual:
                info.append(f"desc({len(og['og_description'])}ch)")

            if updates:
                updates.append("updated_at = datetime('now')")
                params.append(fid)
                conn = get_conn()
                conn.execute(f"UPDATE franquias SET {', '.join(updates)} WHERE id = ?", params)
                conn.commit()
                conn.close()

            status = ", ".join(info) if info else "sem dados novos"
            print(f"  [{i+1}/{len(rows)}] {nome:35s} -> {status}")

        except Exception as e:
            erros += 1
            err = str(e)[:50]
            print(f"  [{i+1}/{len(rows)}] {nome:35s} -> ERRO: {err}")

    # Log no sync_log
    conn = get_conn()
    conn.execute(
        "INSERT INTO sync_log(fonte, status, registros_inseridos, erro) VALUES(?,?,?,?)",
        (
            "Enriquecimento/mídia",
            "ok" if erros == 0 else "parcial",
            ok_image + ok_desc,
            f"{erros} erros de conexão" if erros else None,
        ),
    )
    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"  og:image extraídos:     {ok_image}")
    print(f"  descriptions extraídas: {ok_desc}")
    print(f"  Erros de conexão:       {erros}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
