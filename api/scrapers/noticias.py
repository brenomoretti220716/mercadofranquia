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

def _fetch_conteudo_artigo(url, max_chars=3000):
    """Busca o conteúdo real de um artigo extraindo parágrafos relevantes."""
    try:
        html = _fetch(url)
        paragrafos = re.findall(r"<p[^>]*>(.*?)</p>", html, re.DOTALL)
        textos = []
        for p in paragrafos:
            texto = _clean(p)
            if len(texto) > 80:
                textos.append(texto)
        conteudo = " ".join(textos)
        return conteudo[:max_chars]
    except Exception:
        return ""


def scrape_portal(limite=20):
    """Portal do Franchising — artigos do blog com conteúdo real."""
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
            conteudo = _fetch_conteudo_artigo(url)
            resumo = conteudo[:300] if conteudo else ""
            noticias.append({
                "titulo": titulo, "url": url, "conteudo": conteudo, "resumo": resumo,
                "fonte": fonte,
                "url_fonte": "https://www.portaldofranchising.com.br/franquias/",
                "idioma": "pt",
            })
            if len(noticias) >= limite:
                break
            time.sleep(RATE_LIMIT)
        return noticias
    except Exception as e:
        print(f"  [ERRO] {fonte}: {e}")
        return []


# ── Google News RSS ──────────────────────────────────────────────────────────

GOOGLE_NEWS_BR = [
    {"q": "franquias brasil", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419", "idioma": "pt"},
    {"q": "franchising brasil", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419", "idioma": "pt"},
    {"q": "ABF franquias", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419", "idioma": "pt"},
]

GOOGLE_NEWS_EN = [
    {"q": "franchise business 2026", "hl": "en", "gl": "US", "ceid": "US:en", "idioma": "en"},
    {"q": "franchising industry trends", "hl": "en", "gl": "US", "ceid": "US:en", "idioma": "en"},
    {"q": "franchise investment", "hl": "en", "gl": "US", "ceid": "US:en", "idioma": "en"},
    {"q": "franchising Brazil", "hl": "en", "gl": "US", "ceid": "US:en", "idioma": "en"},
]


def _scrape_google_news_queries(queries, limite=30):
    """Google News RSS genérico — aceita lista de queries com idioma."""
    all_noticias = []
    seen_urls = set()

    for qcfg in queries:
        try:
            url = f"https://news.google.com/rss/search?q={qcfg['q'].replace(' ', '+')}&hl={qcfg['hl']}&gl={qcfg['gl']}&ceid={qcfg['ceid']}"
            xml_data = _fetch(url, accept="application/xml")
            root = ET.fromstring(xml_data)

            for item in root.findall(".//item"):
                titulo = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                source = (item.findtext("source") or "Google News").strip()
                pub = (item.findtext("pubDate") or "")[:30]
                desc = _clean(item.findtext("description") or "")

                if not titulo or not link or link in seen_urls:
                    continue
                seen_urls.add(link)

                all_noticias.append({
                    "titulo": titulo, "url": link, "resumo": desc[:300], "conteudo": desc,
                    "fonte": f"Google News/{source}", "url_fonte": url,
                    "idioma": qcfg["idioma"], "data": pub or None,
                })

            time.sleep(RATE_LIMIT)
        except Exception as e:
            print(f"  [ERRO] Google News '{qcfg['q']}': {e}")

    return all_noticias[:limite]


def scrape_google_news_br(limite=30):
    """Google News BR — VEJA, CNN, ISTOÉ, Valor, etc."""
    return _scrape_google_news_queries(GOOGLE_NEWS_BR, limite)


def scrape_google_news_en(limite=30):
    """Google News EN — Franchise Times, Forbes, Bloomberg, etc."""
    return _scrape_google_news_queries(GOOGLE_NEWS_EN, limite)


# ── RSS genérico ─────────────────────────────────────────────────────────────

def parse_rss(url, fonte, idioma="en", limite=20):
    """Parse RSS feed."""
    try:
        xml = _fetch(url, accept="application/xml,text/xml,application/rss+xml")
        # Remove caracteres de controle inválidos no XML
        import re as _re
        xml_limpo = _re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', xml)
        root = ET.fromstring(xml_limpo)
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
    "google_news_br": {"nome": "Google News BR", "fn": scrape_google_news_br},
    "google_news_en": {"nome": "Google News EN", "fn": scrape_google_news_en},
    "abf": {"nome": "ABF Noticias", "fn": scrape_abf},
    "portal": {"nome": "Portal do Franchising", "fn": scrape_portal},
    "mapa": {"nome": "Mapa das Franquias", "fn": scrape_mapa},
    "ifa": {"nome": "IFA", "fn": lambda l: parse_rss("https://www.franchise.org/feed", "IFA", "en", l)},
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
