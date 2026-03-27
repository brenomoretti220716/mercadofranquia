"""
Scraper de franquias do Portal do Franchising (ABF).

Fonte: franquias.portaldofranchising.com.br
Uso:
  python3 api/scrapers/franquias_abf.py                          # todas as categorias
  python3 api/scrapers/franquias_abf.py --segmento alimentacao   # uma categoria
  python3 api/scrapers/franquias_abf.py --segmento alimentacao --limit 5  # limitado
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
from urllib.error import URLError

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from database import get_conn, init_db

# ── Configuração ─────────────────────────────────────────────────────────────

BASE_URL = "https://franquias.portaldofranchising.com.br"

SEGMENTOS = {
    "alimentacao": "Alimentação",
    "casa-e-construcao": "Casa e Construção",
    "comunicacao-informatica-e-eletronicos": "Comunicação, Informática e Eletrônicos",
    "servicos-educacionais": "Serviços Educacionais",
    "entretenimento-e-lazer": "Entretenimento e Lazer",
    "hotelaria-e-turismo": "Hotelaria e Turismo",
    "limpeza-e-conservacao": "Limpeza e Conservação",
    "moda": "Moda",
    "saude-beleza-e-bem-estar": "Saúde, Beleza e Bem-Estar",
    "servicos-automotivos": "Serviços Automotivos",
    "servicos-e-outros-negocios": "Serviços e Outros Negócios",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

RATE_LIMIT = 1  # segundos entre requests


# ── Helpers ──────────────────────────────────────────────────────────────────

def _fetch_html(url):
    """Busca HTML de uma URL com headers realistas."""
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=30, context=SSL_CTX) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def _parse_investimento(texto):
    """Extrai min e max de '255.000 a 320.000' ou 'A partir de 50.000'."""
    if not texto:
        return None, None
    numeros = re.findall(r"[\d.]+", texto.replace(".", "").replace(",", "."))
    valores = []
    for n in numeros:
        try:
            v = float(n)
            if v > 100:  # ignora valores pequenos (ex: porcentagens)
                valores.append(v)
        except ValueError:
            continue
    if len(valores) >= 2:
        return min(valores), max(valores)
    if len(valores) == 1:
        return valores[0], valores[0]
    return None, None


def _slugify(nome):
    """Gera slug a partir do nome."""
    slug = nome.lower().strip()
    slug = re.sub(r"[àáâãä]", "a", slug)
    slug = re.sub(r"[èéêë]", "e", slug)
    slug = re.sub(r"[ìíîï]", "i", slug)
    slug = re.sub(r"[òóôõö]", "o", slug)
    slug = re.sub(r"[ùúûü]", "u", slug)
    slug = re.sub(r"[ç]", "c", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def _extract_text(src, pattern, group=1, default=None):
    """Extrai texto via regex, decodificando HTML entities."""
    match = re.search(pattern, src, re.DOTALL | re.IGNORECASE)
    if not match:
        return default
    return html_mod.unescape(match.group(group).strip())


# ── Parser de listagem ───────────────────────────────────────────────────────

def parse_listagem(raw_html, segmento_nome):
    """Extrai franquias de uma página de listagem por segmento."""
    raw_html = html_mod.unescape(raw_html)
    franquias = []

    # Dividir em cards usando data-id como âncora (mais robusto)
    # Cada card começa com <div ... data-id="NNNNN" ...>
    partes = re.split(r'(?=<div[^>]*data-id="\d+")', raw_html)

    for card_html in partes:
        if 'data-id="' not in card_html:
            continue

        # Nome
        nome = _extract_text(card_html, r'class="card-title[^"]*"[^>]*>(.*?)</p>')
        if not nome:
            continue

        # Link individual
        link = _extract_text(card_html, r'href="(https?://franquias\.portaldofranchising[^"]*franquia[^"]*)"')

        # Logo
        logo = _extract_text(card_html, r'data-src="([^"]*(?:png|jpg|jpeg|webp|svg)[^"]*)"')

        # Descrição
        descricao = _extract_text(card_html, r'class="card-text[^"]*"[^>]*>(.*?)</p>')

        # Investimento do texto
        inv_texto = _extract_text(card_html, r'class="investment-values"[^>]*>(.*?)</p>')
        inv_min, inv_max = _parse_investimento(inv_texto)

        # Investimento do data attribute (fallback)
        inv_data = _extract_text(card_html, r'data-investment-less="(\d+)"')
        if inv_data and not inv_min:
            inv_min = float(inv_data)
            inv_max = inv_min

        # Segmento do badge
        seg_badge = _extract_text(card_html, r'badge-segment[^>]*>(.*?)</span>')

        franquias.append({
            "nome": nome.strip(),
            "slug": _slugify(nome),
            "segmento": seg_badge or segmento_nome,
            "investimento_min": inv_min,
            "investimento_max": inv_max,
            "logo_url": logo,
            "url_fonte": link,
            "descricao": descricao,
        })

    return franquias


# ── Parser de página individual ──────────────────────────────────────────────

def parse_detalhe(raw_html):
    """Extrai dados detalhados de uma página individual de franquia."""
    h = html_mod.unescape(raw_html)
    dados = {}

    # Número de unidades — "Quantas unidades tem no Brasil?" seguido de número
    unidades = _extract_text(h, r'Quantas unidades.*?<strong[^>]*>.*?(\d[\d.,]+)', default=None)
    if not unidades:
        # Fallback: Total: NNN ou Franqueadas: NNN
        unidades = _extract_text(h, r'(?:Total|Franqueadas?)\s*[:\-]?\s*(\d[\d.,]+)')
    if unidades:
        dados["num_unidades"] = int(unidades.replace(".", "").replace(",", ""))

    # Site oficial — link externo que não é do próprio portal
    site = _extract_text(h, r'href="(https?://(?!franquias\.portal|static\.portal|www\.portal|api\.)[^"]+)"[^>]*>[^<]*(?:site|oficial|visitar|acessar)', default=None)
    if not site:
        site = _extract_text(h, r'(?:Site|Website)\s*[:\-]?\s*.*?href="(https?://(?!franquias\.portal|static\.portal)[^"]+)"')
    dados["site_oficial"] = site

    # Selo ABF
    dados["selo_abf"] = bool(re.search(r"selo.*?excel[eê]ncia|excel[eê]ncia.*?franchising", h, re.IGNORECASE))

    return dados


# ── Scraper principal ────────────────────────────────────────────────────────

def scrape_segmento(slug_segmento, nome_segmento, limit=None):
    """Scrape todas as franquias de um segmento."""
    url = f"{BASE_URL}/franquias-de-{slug_segmento}/"
    print(f"  Buscando: {url}")

    try:
        html = _fetch_html(url)
    except (URLError, Exception) as e:
        print(f"  [ERRO] Não foi possível acessar {url}: {e}")
        return []

    franquias = parse_listagem(html, nome_segmento)
    print(f"  Encontradas: {len(franquias)} franquias")

    if limit:
        franquias = franquias[:limit]

    # Buscar detalhes de cada franquia
    for i, f in enumerate(franquias):
        if f.get("url_fonte"):
            time.sleep(RATE_LIMIT)
            try:
                detalhe_html = _fetch_html(f["url_fonte"])
                detalhes = parse_detalhe(detalhe_html)
                f.update(detalhes)
                print(f"    [{i+1}/{len(franquias)}] {f['nome']} — {f.get('num_unidades', '?')} unidades")
            except Exception as e:
                print(f"    [{i+1}/{len(franquias)}] {f['nome']} — erro detalhe: {e}")
        else:
            print(f"    [{i+1}/{len(franquias)}] {f['nome']} — sem link individual")

    return franquias


def salvar_franquias(franquias):
    """Salva franquias no banco com upsert por nome."""
    conn = get_conn()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    inseridos = 0

    for f in franquias:
        conn.execute(
            """INSERT INTO franquias(nome, slug, segmento, investimento_min, investimento_max,
                   num_unidades, logo_url, site_oficial, descricao, selo_abf, fonte, url_fonte,
                   data_coleta)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(nome) DO UPDATE SET
                   slug=excluded.slug,
                   segmento=excluded.segmento,
                   investimento_min=COALESCE(excluded.investimento_min, franquias.investimento_min),
                   investimento_max=COALESCE(excluded.investimento_max, franquias.investimento_max),
                   num_unidades=COALESCE(excluded.num_unidades, franquias.num_unidades),
                   logo_url=COALESCE(excluded.logo_url, franquias.logo_url),
                   site_oficial=COALESCE(excluded.site_oficial, franquias.site_oficial),
                   descricao=COALESCE(excluded.descricao, franquias.descricao),
                   selo_abf=excluded.selo_abf,
                   url_fonte=excluded.url_fonte,
                   data_coleta=excluded.data_coleta,
                   updated_at=datetime('now')""",
            (
                f["nome"], f["slug"], f["segmento"],
                f.get("investimento_min"), f.get("investimento_max"),
                f.get("num_unidades"), f.get("logo_url"),
                f.get("site_oficial"), f.get("descricao"),
                f.get("selo_abf", False),
                "ABF/PortalFranchising", f.get("url_fonte"),
                now,
            ),
        )
        inseridos += 1

    conn.commit()
    conn.close()
    return inseridos


def _log_sync(fonte, status, registros=0, erro=None):
    """Registra resultado no sync_log."""
    conn = get_conn()
    conn.execute(
        "INSERT INTO sync_log(fonte, status, registros_inseridos, erro) VALUES(?,?,?,?)",
        (fonte, status, registros, erro),
    )
    conn.commit()
    conn.close()


def scrape_all(segmentos_filter=None, limit=None):
    """Executa scraping de todas as categorias (ou filtradas)."""
    print(f"\n{'='*60}")
    print(f"  Scraper Portal do Franchising — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    init_db()
    todas = []

    segmentos_to_scrape = {}
    if segmentos_filter:
        for s in segmentos_filter:
            if s in SEGMENTOS:
                segmentos_to_scrape[s] = SEGMENTOS[s]
            else:
                print(f"  [AVISO] Segmento '{s}' não encontrado. Opções: {', '.join(SEGMENTOS.keys())}")
    else:
        segmentos_to_scrape = SEGMENTOS

    for slug, nome in segmentos_to_scrape.items():
        print(f"\n[{nome}]")
        try:
            franquias = scrape_segmento(slug, nome, limit=limit)
            if franquias:
                inseridos = salvar_franquias(franquias)
                _log_sync(f"Scraper/{nome}", "ok", inseridos)
                todas.extend(franquias)
            else:
                _log_sync(f"Scraper/{nome}", "ok", 0)
        except Exception as e:
            _log_sync(f"Scraper/{nome}", "erro", 0, str(e))
            print(f"  [ERRO] {nome}: {e}")

        time.sleep(RATE_LIMIT)

    print(f"\n{'='*60}")
    print(f"  Total: {len(todas)} franquias coletadas")
    print(f"{'='*60}\n")

    return todas


# ── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scraper de franquias ABF")
    parser.add_argument("--segmento", type=str, help="Slug do segmento (ex: alimentacao)")
    parser.add_argument("--limit", type=int, help="Limite de franquias por segmento")
    args = parser.parse_args()

    segmentos = [args.segmento] if args.segmento else None
    scrape_all(segmentos_filter=segmentos, limit=args.limit)
