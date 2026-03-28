"""
Scraper de notícias sobre franchising de fontes brasileiras e internacionais.

Uso:
  python3 api/scrapers/noticias.py                          # todas as fontes
  python3 api/scrapers/noticias.py --fonte abf --limite 5   # uma fonte, limitado
"""

import argparse
import html as html_mod
import os
import re
import ssl
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError

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
TIMEOUT = 10
RATE_LIMIT = 1


def _fetch(url):
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def _clean(text):
    if not text:
        return ""
    text = html_mod.unescape(text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:800]


def _log_sync(fonte, status, registros=0, erro=None):
    conn = get_conn()
    conn.execute(
        "INSERT INTO sync_log(fonte, status, registros_inseridos, erro) VALUES(?,?,?,?)",
        (fonte, status, registros, erro),
    )
    conn.commit()
    conn.close()


def _inserir(noticias):
    conn = get_conn()
    inseridos = 0
    for n in noticias:
        try:
            conn.execute(
                """INSERT OR IGNORE INTO noticias_raw(titulo, url, conteudo_bruto, resumo_bruto, fonte, url_fonte, idioma, data_publicacao)
                   VALUES(?,?,?,?,?,?,?,?)""",
                (n["titulo"], n["url"], n.get("conteudo"), n.get("resumo"), n["fonte"], n.get("url_fonte"), n.get("idioma", "pt"), n.get("data")),
            )
            if conn.total_changes:
                inseridos += 1
        except Exception:
            pass
    conn.commit()
    conn.close()
    return inseridos


# ── FONTES RSS ──────────────────────────────────────────────────────────────

def parse_rss(url, fonte, idioma="en", limite=20):
    """Parse RSS feed genérico."""
    try:
        xml = _fetch(url)
        root = ET.fromstring(xml)
        items = root.findall(".//item")[:limite]
        noticias = []
        for item in items:
            titulo = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            desc = _clean(item.findtext("description", ""))
            pub_date = item.findtext("pubDate", "")
            if titulo and link:
                noticias.append({
                    "titulo": titulo,
                    "url": link,
                    "resumo": desc[:300],
                    "conteudo": desc,
                    "fonte": fonte,
                    "url_fonte": url,
                    "idioma": idioma,
                    "data": pub_date[:30] if pub_date else None,
                })
        return noticias
    except Exception as e:
        print(f"  [ERRO RSS] {fonte}: {e}")
        return []


# ── FONTES HTML BRASILEIRAS ─────────────────────────────────────────────────

def scrape_html_generic(url, fonte, pattern_title, pattern_link, base_url="", limite=20):
    """Scrape genérico de HTML usando regex."""
    try:
        html = _fetch(url)
        h = html_mod.unescape(html)
        noticias = []

        titles = re.findall(pattern_title, h, re.DOTALL | re.IGNORECASE)
        links = re.findall(pattern_link, h, re.DOTALL | re.IGNORECASE)

        for i in range(min(len(titles), len(links), limite)):
            titulo = _clean(titles[i])
            link = links[i].strip()
            if not link.startswith("http"):
                link = base_url + link
            if titulo and link and len(titulo) > 10:
                noticias.append({
                    "titulo": titulo,
                    "url": link,
                    "fonte": fonte,
                    "url_fonte": url,
                    "idioma": "pt",
                })
        return noticias
    except Exception as e:
        print(f"  [ERRO HTML] {fonte}: {e}")
        return []


# ── DEFINIÇÃO DAS FONTES ────────────────────────────────────────────────────

FONTES = {
    "abf": {
        "nome": "ABF Noticias",
        "tipo": "html",
        "url": "https://www.abf.com.br/noticias-abf/",
        "pattern_title": r'<h[23][^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*>(.*?)</a>',
        "pattern_link": r'<h[23][^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"',
    },
    "portal_franchising": {
        "nome": "Portal do Franchising",
        "tipo": "html",
        "url": "https://www.portaldofranchising.com.br/noticias/",
        "pattern_title": r'<h[234][^>]*>\s*<a[^>]*>(.*?)</a>',
        "pattern_link": r'<h[234][^>]*>\s*<a[^>]*href="([^"]+)"',
        "base_url": "https://www.portaldofranchising.com.br",
    },
    "franchise_times": {
        "nome": "Franchise Times",
        "tipo": "rss",
        "url": "https://www.franchisetimes.com/feed/",
        "idioma": "en",
    },
    "entrepreneur": {
        "nome": "Entrepreneur Franchises",
        "tipo": "rss",
        "url": "https://www.entrepreneur.com/topic/franchises/feed",
        "idioma": "en",
    },
    "franchisewire": {
        "nome": "FranchiseWire",
        "tipo": "rss",
        "url": "https://www.franchisewire.com/feed/",
        "idioma": "en",
    },
}


def coletar(fontes_filter=None, limite=20):
    print(f"\n{'='*60}")
    print(f"  Coleta de noticias — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    init_db()
    total = 0

    fontes_to_use = {}
    if fontes_filter:
        for f in fontes_filter:
            if f in FONTES:
                fontes_to_use[f] = FONTES[f]
    else:
        fontes_to_use = FONTES

    for key, cfg in fontes_to_use.items():
        print(f"[{cfg['nome']}]")
        try:
            if cfg["tipo"] == "rss":
                noticias = parse_rss(cfg["url"], cfg["nome"], cfg.get("idioma", "en"), limite)
            else:
                noticias = scrape_html_generic(
                    cfg["url"], cfg["nome"],
                    cfg["pattern_title"], cfg["pattern_link"],
                    cfg.get("base_url", ""), limite,
                )

            if noticias:
                inseridos = _inserir(noticias)
                total += inseridos
                _log_sync(f"Noticias/{cfg['nome']}", "ok", inseridos)
                print(f"  Coletadas: {len(noticias)} | Novas: {inseridos}")
            else:
                _log_sync(f"Noticias/{cfg['nome']}", "ok", 0)
                print(f"  Nenhuma noticia encontrada")

        except Exception as e:
            _log_sync(f"Noticias/{cfg['nome']}", "erro", 0, str(e)[:200])
            print(f"  ERRO: {e}")

        time.sleep(RATE_LIMIT)

    print(f"\n{'='*60}")
    print(f"  Total novas noticias: {total}")
    print(f"{'='*60}\n")
    return total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scraper de noticias franchising")
    parser.add_argument("--fonte", type=str, help="Chave da fonte (ex: abf, franchise_times)")
    parser.add_argument("--limite", type=int, default=20, help="Limite por fonte")
    args = parser.parse_args()

    fontes = [args.fonte] if args.fonte else None
    coletar(fontes_filter=fontes, limite=args.limite)
