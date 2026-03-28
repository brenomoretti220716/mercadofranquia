"""
Scraper de notícias sobre franchising.

Fontes:
  - ABF (WP REST API)
  - Portal do Franchising (HTML blog)
  - Entrepreneur Franchises (RSS)
  - FranchiseWire (RSS)

Uso:
  python3 api/scrapers/noticias.py                          # todas as fontes
  python3 api/scrapers/noticias.py --fonte abf --limite 5   # uma fonte
"""

import argparse
import html as html_mod
import json
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
TIMEOUT = 15
RATE_LIMIT = 1


def _fetch(url, accept=None):
    h = dict(HEADERS)
    if accept:
        h["Accept"] = accept
    req = Request(url, headers=h)
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
            inseridos += 1
        except Exception:
            pass
    conn.commit()
    conn.close()
    return inseridos


# ── ABF via WP REST API ─────────────────────────────────────────────────────

def scrape_abf(limite=20):
    """ABF noticias via WordPress REST API."""
    fonte = "ABF Noticias"
    try:
        data = _fetch(f"https://www.abf.com.br/wp-json/wp/v2/posts?per_page={limite}&categories=9", accept="application/json")
        posts = json.loads(data)
        noticias = []
        for p in posts:
            titulo = _clean(p.get("title", {}).get("rendered", ""))
            link = p.get("link", "")
            resumo = _clean(p.get("excerpt", {}).get("rendered", ""))
            conteudo = _clean(p.get("content", {}).get("rendered", ""))
            data_pub = p.get("date", "")[:10]
            if titulo and link:
                noticias.append({
                    "titulo": titulo, "url": link, "resumo": resumo, "conteudo": conteudo,
                    "fonte": fonte, "url_fonte": "https://www.abf.com.br/noticias-abf/",
                    "idioma": "pt", "data": data_pub,
                })
        return noticias
    except Exception as e:
        print(f"  [ERRO] {fonte}: {e}")
        return []


# ── Portal do Franchising (HTML blog) ────────────────────────────────────────

def scrape_portal(limite=20):
    """Portal do Franchising — artigos do blog."""
    fonte = "Portal do Franchising"
    try:
        html = _fetch("https://www.portaldofranchising.com.br/franquias/")
        h = html_mod.unescape(html)
        links = re.findall(
            r'<a[^>]*href="(https://www\.portaldofranchising\.com\.br/(?:franquias|falando-de-franquias)/[^"/]+/)"[^>]*>([^<]{20,100})',
            h,
        )
        seen = set()
        noticias = []
        for url, titulo in links:
            titulo = titulo.strip()
            if url in seen or len(titulo) < 20:
                continue
            seen.add(url)
            noticias.append({
                "titulo": titulo, "url": url, "fonte": fonte,
                "url_fonte": "https://www.portaldofranchising.com.br/franquias/",
                "idioma": "pt",
            })
            if len(noticias) >= limite:
                break
        return noticias
    except Exception as e:
        print(f"  [ERRO] {fonte}: {e}")
        return []


# ── Google News RSS ──────────────────────────────────────────────────────────

GOOGLE_NEWS_QUERIES = [
    "franquias brasil",
    "franchising brasil",
    "ABF franquias",
]

def scrape_google_news(limite=30):
    """Google News RSS — agrega VEJA, Exame, CNN, Valor, ISTOÉ, etc."""
    fonte_base = "Google News"
    all_noticias = []
    seen_urls = set()

    for query in GOOGLE_NEWS_QUERIES:
        try:
            url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
            xml_data = _fetch(url, accept="application/xml")
            root = ET.fromstring(xml_data)
            items = root.findall(".//item")

            for item in items:
                titulo = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                source = (item.findtext("source") or "Google News").strip()
                pub = (item.findtext("pubDate") or "")[:30]
                desc = _clean(item.findtext("description") or "")

                if not titulo or not link or link in seen_urls:
                    continue
                seen_urls.add(link)

                all_noticias.append({
                    "titulo": titulo,
                    "url": link,
                    "resumo": desc[:300],
                    "conteudo": desc,
                    "fonte": f"Google News/{source}",
                    "url_fonte": url,
                    "idioma": "pt",
                    "data": pub or None,
                })

            time.sleep(RATE_LIMIT)
        except Exception as e:
            print(f"  [ERRO] Google News query '{query}': {e}")

    # Limitar e retornar
    return all_noticias[:limite]


# ── RSS genérico ─────────────────────────────────────────────────────────────

def parse_rss(url, fonte, idioma="en", limite=20):
    """Parse RSS feed."""
    try:
        xml = _fetch(url, accept="application/xml,text/xml,application/rss+xml")
        root = ET.fromstring(xml)
        items = root.findall(".//item")[:limite]
        noticias = []
        for item in items:
            titulo = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            desc = _clean(item.findtext("description") or "")
            pub = (item.findtext("pubDate") or "")[:30]
            if titulo and link:
                noticias.append({
                    "titulo": titulo, "url": link, "resumo": desc[:300], "conteudo": desc,
                    "fonte": fonte, "url_fonte": url, "idioma": idioma, "data": pub or None,
                })
        return noticias
    except Exception as e:
        print(f"  [ERRO RSS] {fonte}: {e}")
        return []


# ── Mapa das Franquias (WP REST API) ─────────────────────────────────────────

def scrape_mapa(limite=20):
    """Mapa das Franquias — WP REST API."""
    fonte = "Mapa das Franquias"
    try:
        data = _fetch(f"https://mapadasfranquias.com.br/wp-json/wp/v2/posts?per_page={limite}", accept="application/json")
        posts = json.loads(data)
        noticias = []
        for p in posts:
            titulo = _clean(p.get("title", {}).get("rendered", ""))
            link = p.get("link", "")
            resumo = _clean(p.get("excerpt", {}).get("rendered", ""))
            conteudo = _clean(p.get("content", {}).get("rendered", ""))
            data_pub = p.get("date", "")[:10]
            if titulo and link and "/noticia/" in link:
                noticias.append({
                    "titulo": titulo, "url": link, "resumo": resumo, "conteudo": conteudo,
                    "fonte": fonte, "url_fonte": "https://mapadasfranquias.com.br/",
                    "idioma": "pt", "data": data_pub,
                })
        return noticias
    except Exception as e:
        print(f"  [ERRO] {fonte}: {e}")
        return []


# ── FONTES ───────────────────────────────────────────────────────────────────

FONTES = {
    "google_news": {"nome": "Google News BR", "fn": scrape_google_news},
    "abf": {"nome": "ABF Noticias", "fn": scrape_abf},
    "portal": {"nome": "Portal do Franchising", "fn": scrape_portal},
    "mapa": {"nome": "Mapa das Franquias", "fn": scrape_mapa},
    "entrepreneur": {"nome": "Entrepreneur Franchises", "fn": lambda l: parse_rss("https://www.entrepreneur.com/topic/franchises/feed", "Entrepreneur", "en", l)},
    "franchisewire": {"nome": "FranchiseWire", "fn": lambda l: parse_rss("https://www.franchisewire.com/feed/", "FranchiseWire", "en", l)},
}


def coletar(fontes_filter=None, limite=20):
    print(f"\n{'='*60}")
    print(f"  Coleta de noticias — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    init_db()
    total = 0

    to_use = {k: v for k, v in FONTES.items() if not fontes_filter or k in fontes_filter}

    for key, cfg in to_use.items():
        print(f"[{cfg['nome']}]")
        try:
            noticias = cfg["fn"](limite)
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
    parser.add_argument("--fonte", type=str, help="Chave da fonte (ex: abf, portal)")
    parser.add_argument("--limite", type=int, default=20, help="Limite por fonte")
    args = parser.parse_args()
    fontes = [args.fonte] if args.fonte else None
    coletar(fontes_filter=fontes, limite=args.limite)
