"""
gerar_imagem.py — Gerador de imagens para Mercado Franquia
Modelo: gpt-image-1 via OpenAI API
Cascata de referência: og:image artigo → og:image franquia → prompt por segmento
"""

import argparse
import json
import os
import random
import ssl
import sys
import time
import unicodedata
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

# ── Carrega .env ────────────────────────────────────────────────────────

_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from database import get_conn

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")
IMAGES_DIR = Path(__file__).parent.parent / "static" / "imagens"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

HEADERS_BROWSER = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"
}

# ── Normalização de segmento ────────────────────────────────────────────

def _normalizar(texto: str) -> str:
    """Remove acentos e normaliza para lowercase sem espaços extras."""
    nfkd = unicodedata.normalize("NFKD", texto or "")
    sem_acento = "".join(c for c in nfkd if not unicodedata.combining(c))
    return sem_acento.lower().strip()


# ── Prompts por segmento ABF ────────────────────────────────────────────
# Chave normalizada (sem acento, lowercase) para evitar duplicatas

PROMPTS_SEGMENTO = {
    "saude, beleza e bem-estar": (
        "Modern Brazilian beauty salon or wellness clinic, bright natural lighting, "
        "clean white and warm tones, professional aesthetician at work, happy Brazilian client, upscale storefront"
    ),
    "saude/beleza": (
        "Modern Brazilian beauty salon or wellness clinic, bright natural lighting, "
        "clean white and warm tones, professional aesthetician at work, happy Brazilian client, upscale storefront"
    ),
    "alimentacao - fs": (
        "Busy modern Brazilian restaurant franchise, bright warm lighting, food preparation area, "
        "friendly staff in uniform, colorful fresh food display, lunchtime atmosphere"
    ),
    "alimentacao-fs": (
        "Busy modern Brazilian restaurant franchise, bright warm lighting, food preparation area, "
        "friendly staff in uniform, colorful fresh food display, lunchtime atmosphere"
    ),
    "alimentacao - cd": (
        "Brazilian food distribution operation, organized warehouse shelves, logistics in action, "
        "professional workers, delivery vehicles outside, modern supply chain"
    ),
    "alimentacao-cd": (
        "Brazilian food distribution operation, organized warehouse shelves, logistics in action, "
        "professional workers, delivery vehicles outside, modern supply chain"
    ),
    "educacao": (
        "Modern Brazilian learning center, bright colorful classroom, engaged students and instructor, "
        "tablets and modern materials, motivated young Brazilians studying"
    ),
    "casa e construcao": (
        "Brazilian home improvement franchise showroom, well-organized materials display, "
        "professional consultant helping customer, bright lighting, modern design samples"
    ),
    "moda": (
        "Stylish Brazilian fashion franchise boutique, well-lit modern store, "
        "organized clothing displays, fashionable Brazilian customers, contemporary retail design"
    ),
    "hotelaria e turismo": (
        "Modern Brazilian hotel lobby, bright welcoming reception, friendly staff, "
        "Brazilian travelers, contemporary design with local cultural elements"
    ),
    "servicos automotivos": (
        "Clean modern Brazilian auto service franchise, bright organized garage, "
        "professional mechanics in uniforms, modern equipment, suburban commercial area"
    ),
    "comunicacao/ti": (
        "Modern Brazilian tech franchise store, bright contemporary retail, digital displays, "
        "friendly tech consultant, clean minimalist design, urban setting"
    ),
    "entretenimento e lazer": (
        "Vibrant Brazilian entertainment franchise, colorful energetic environment, "
        "happy Brazilian families, bright playful atmosphere, modern recreational facility"
    ),
    "limpeza e conservacao": (
        "Professional Brazilian cleaning franchise team in action, bright clean environment, "
        "modern equipment, uniformed team, commercial building setting"
    ),
    "servicos e outros negocios": (
        "Professional Brazilian business services franchise office, bright modern workspace, "
        "consultant meeting client, contemporary office design"
    ),
}

PROMPT_PADRAO = (
    "Professional Brazilian franchise business, bright natural lighting, modern commercial setting, "
    "friendly staff, clean contemporary design, urban Brazilian neighborhood"
)

REGRAS_GLOBAIS = (
    "TECHNICAL: Photorealistic editorial photography, Canon 5D style, 35mm or 50mm lens, natural depth of field. "
    "LIGHTING: Match lighting to the scene energy — bright natural light for busy operational scenes, warm available light for intimate moments. Never the same lighting twice. "
    "COMPOSITION: Hero is the PLACE and ACTIVITY, not the people. Show: products, equipment, storefronts, food, tools, spaces in use. "
    "PEOPLE: Strictly optional. Never two people talking at a desk. If present: workers doing physical tasks, customers from behind, one person mid-action. "
    "REALISM: Active, lived-in scenes. Something is happening. Not a meeting room, not a posed conversation, not a handshake. "
    "ABSOLUTE PROHIBITIONS: NO readable text anywhere — all signs, storefronts, whiteboards, papers and screens must be blurred, out of focus, or turned away from camera. NO logos. NO watermarks. NO office meeting scenes. NO handshakes. Any signage must be bokeh/defocused background element only."
)


def _prompt_segmento(segmento: str | None) -> str:
    """Retorna o prompt base do segmento, normalizando a chave."""
    if not segmento:
        return PROMPT_PADRAO
    chave = _normalizar(segmento)
    return PROMPTS_SEGMENTO.get(chave, PROMPT_PADRAO)


def montar_prompt(contexto_noticia: str | None, segmento: str | None = None, instrucao_manual: str | None = None) -> str:
    """
    Monta prompt final com hierarquia clara:
    1. Contexto específico da notícia (mais importante)
    2. Ambiente visual do segmento ABF
    3. Regras técnicas globais
    """
    base_segmento = _prompt_segmento(segmento)
    contexto = (contexto_noticia or "").strip()
    instrucao = (instrucao_manual or "").strip()

    if instrucao and contexto:
        prompt = (
            f"EDITOR INSTRUCTION: {instrucao}. "
            f"SCENE: {contexto}. "
            f"ENVIRONMENT: {base_segmento}. "
            f"{REGRAS_GLOBAIS}"
        )
    elif contexto:
        prompt = (
            f"SCENE: {contexto}. "
            f"ENVIRONMENT: {base_segmento}. "
            f"{REGRAS_GLOBAIS}"
        )
    else:
        prompt = f"{base_segmento}. {REGRAS_GLOBAIS}"

    return prompt[:4000]


# ── Download e extração de imagens ──────────────────────────────────────

def _buscar_imagem_pexels(query: str) -> bytes | None:
    if not PEXELS_API_KEY:
        return None
    try:
        q = "+".join(query.split()[:6])
        page = random.randint(1, 3)
        url = f"https://api.pexels.com/v1/search?query={q}&per_page=5&orientation=landscape&page={page}"
        req = Request(url, headers={"Authorization": PEXELS_API_KEY, "User-Agent": HEADERS_BROWSER["User-Agent"]})
        with urlopen(req, timeout=15, context=SSL_CTX) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        photos = [f for f in data.get("photos", []) if f.get("width", 0) >= 1200]
        if photos:
            foto = photos[random.randint(0, min(2, len(photos) - 1))]
            img_url = foto["src"]["large2x"]
            img = _baixar_imagem_url(img_url)
            if img:
                print(f"      Pexels: {foto.get('photographer', '')} — {img_url[:60]}")
                return img
    except Exception as e:
        print(f"      Pexels erro: {e}")
    return None


def buscar_e_salvar_pexels(noticia_id: int) -> str | None:
    """Busca foto no Pexels e salva direto sem passar por IA."""
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()
    global PEXELS_API_KEY
    PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")

    _SEGMENTO_PEXELS = {
        "Alimentacao-FS": "restaurant franchise food service Brazil",
        "Alimentacao-CD": "food distribution warehouse Brazil",
        "Saude/Beleza": "beauty salon wellness franchise Brazil",
        "Educacao": "education learning center franchise Brazil",
        "Casa e Construcao": "home improvement store franchise Brazil",
        "Moda": "fashion retail store franchise Brazil",
        "Hotelaria e Turismo": "hotel lobby tourism Brazil",
        "Servicos Automotivos": "auto service garage franchise Brazil",
        "Comunicacao/TI": "technology store franchise Brazil",
        "Entretenimento e Lazer": "entertainment leisure franchise Brazil",
        "Limpeza e Conservacao": "cleaning service professional Brazil",
        "Servicos e Outros Negocios": "business service office franchise Brazil",
        "Geral": "franchise business entrepreneur Brazil",
    }

    conn = get_conn()
    row = conn.execute(
        "SELECT titulo_gerado, imagem_prompt, segmento, imagem_instrucao_manual FROM noticias_fila WHERE id = ?",
        (noticia_id,),
    ).fetchone()
    conn.close()

    if not row:
        print(f"    Notícia {noticia_id} não encontrada")
        return None

    _TRADUCAO = {
        "franquia": "franchise", "franqueado": "franchisee", "franqueador": "franchisor",
        "empreendedor": "entrepreneur", "negócio": "business", "expansão": "expansion",
        "crescimento": "growth", "investimento": "investment", "setor": "sector",
        "mercado": "market", "redes": "networks", "alimentação": "food",
        "saúde": "health", "beleza": "beauty", "educação": "education",
        "limpeza": "cleaning", "moda": "fashion", "tecnologia": "technology",
    }
    _STOPWORDS_PT = {
        "para", "como", "mais", "sobre", "entre", "pelo", "pela",
        "mesmo", "ainda", "quando", "segundo", "apesar",
        "brasil", "brasileiro", "brasileira", "brasileiros",
    }

    instrucao = (row["imagem_instrucao_manual"] or "").strip() if "imagem_instrucao_manual" in row.keys() else ""
    if instrucao:
        query = instrucao
    else:
        segmento = (row["segmento"] or "").strip()
        query_segmento = _SEGMENTO_PEXELS.get(segmento, "franchise business Brazil")

        titulo_keywords = []
        if row["titulo_gerado"]:
            palavras = [w.strip(".,;:!?\"'()") for w in row["titulo_gerado"].split()]
            for p in palavras:
                if len(p) > 5 and p.lower() not in _STOPWORDS_PT:
                    traduzida = _TRADUCAO.get(p.lower(), p)
                    if traduzida.lower() not in query_segmento.lower():
                        titulo_keywords.append(traduzida)
                    if len(titulo_keywords) >= 3:
                        break

        if titulo_keywords:
            query = " ".join(titulo_keywords) + " " + query_segmento
        else:
            query = query_segmento

    print(f"      Pexels query: {query}")
    img = _buscar_imagem_pexels(query)
    if not img:
        print(f"    Pexels: nenhuma imagem encontrada para notícia {noticia_id}")
        return None

    filepath = IMAGES_DIR / f"noticia_{noticia_id}.png"
    with open(filepath, "wb") as f:
        f.write(img)
    print(f"      Arquivo salvo: {filepath} ({len(img) // 1024}KB)")

    imagem_url = f"/static/imagens/noticia_{noticia_id}.png"
    conn = get_conn()
    conn.execute(
        "UPDATE noticias_fila SET imagem_url = ?, imagem_status = 'gerado', imagem_referencia_fonte = 'pexels_direto' WHERE id = ?",
        (imagem_url, noticia_id),
    )
    conn.commit()
    conn.close()

    print(f"    ✓ Notícia {noticia_id} — Pexels direto ({len(img) // 1024}KB)")
    return imagem_url


def _baixar_imagem_url(url: str) -> bytes | None:
    """Baixa imagem de uma URL. Retorna bytes ou None."""
    try:
        req = Request(url, headers=HEADERS_BROWSER)
        with urlopen(req, timeout=15, context=SSL_CTX) as resp:
            ct = resp.headers.get("Content-Type", "")
            if "image" not in ct and not url.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                return None
            data = resp.read(8 * 1024 * 1024)  # max 8MB
            if len(data) < 10_000:  # min 10KB — descarta ícones e placeholders
                return None
            return data
    except Exception:
        return None


def _extrair_og_image(url: str) -> str | None:
    """Extrai og:image de uma página web."""
    try:
        import re as _re
        req = Request(url, headers=HEADERS_BROWSER)
        with urlopen(req, timeout=12, context=SSL_CTX) as resp:
            html = resp.read(200_000).decode("utf-8", errors="ignore")
        # Tenta og:image em ambas as ordens de atributos
        for pattern in [
            r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
            r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']',
        ]:
            m = _re.search(pattern, html, _re.IGNORECASE)
            if m:
                img_url = m.group(1)
                if img_url.startswith("//"):
                    img_url = "https:" + img_url
                return img_url
    except Exception:
        pass
    return None


def _imagem_e_relevante(img_bytes: bytes, titulo: str | None) -> bool:
    """
    Heurística simples: rejeita imagens muito pequenas (logos, ícones)
    que provavelmente não são fotografias editoriais.
    Tamanho mínimo: 50KB para garantir foto real.
    """
    return len(img_bytes) >= 50_000


def buscar_imagem_referencia(noticia_id: int) -> tuple[bytes | None, str]:
    """
    Cascata de referência visual:
    1. og:image do artigo original (mais relevante — foto da notícia)
    2. og:image do site oficial da franquia mencionada no título
    3. Fallback: None → gera do zero com prompt por segmento
    """
    conn = get_conn()
    row = conn.execute(
        """
        SELECT r.url, f.titulo_gerado, f.segmento, f.imagem_referencia_manual
        FROM noticias_raw r
        JOIN noticias_fila f ON f.raw_id = r.id
        WHERE f.id = ?
        """,
        (noticia_id,),
    ).fetchone()
    conn.close()

    if not row:
        return None, "sem_referencia"

    titulo = row["titulo_gerado"] or ""

    # ── Tentativa 0: referência manual ───────────────────────────
    ref_manual = row["imagem_referencia_manual"] if "imagem_referencia_manual" in row.keys() else None
    if ref_manual:
        img = _baixar_imagem_url(ref_manual)
        if img and _imagem_e_relevante(img, titulo):
            print(f"      Referência: manual ({len(img) // 1024}KB)")
            return img, "referencia_manual"

    # ── Tentativa 1: og:image do artigo original ─────────────────────
    if row["url"]:
        og_url = _extrair_og_image(row["url"])
        if og_url:
            img = _baixar_imagem_url(og_url)
            if img and _imagem_e_relevante(img, titulo):
                print(f"      Referência: og:image do artigo ({len(img) // 1024}KB)")
                return img, "og_image_artigo"
            elif img:
                print(f"      og:image do artigo muito pequena ({len(img) // 1024}KB) — descartada")

    # ── Tentativa 2: franquia mencionada no título ────────────────────
    if titulo:
        import re as _re

        # Padrões para extrair nome de franquia do título
        padroes = [
            r"(?:Franquia|rede|marca|grupo|rede\s+de\s+lojas)\s+([A-Z][A-Za-zÀ-ú\s&'\-]{2,30})",
            r"([A-Z][A-Za-zÀ-ú]{2,20}(?:\s+[A-Z][A-Za-zÀ-ú]{2,15})?)\s+(?:abre|expande|cresce|lança|anuncia|inaugura)",
            r"^([A-Z][A-Za-zÀ-ú\s&'\-]{2,25})(?:\s*[:,-]|\s+registra|\s+fecha|\s+atinge)",
        ]

        nome_franquia = None
        for padrao in padroes:
            match = _re.search(padrao, titulo)
            if match:
                nome_franquia = match.group(1).strip()[:40]
                break

        if nome_franquia:
            conn = get_conn()
            franquia = conn.execute(
                "SELECT site_oficial FROM franquias WHERE nome LIKE ? AND site_oficial IS NOT NULL LIMIT 1",
                (f"%{nome_franquia}%",),
            ).fetchone()
            conn.close()

            if franquia and franquia["site_oficial"]:
                og_url = _extrair_og_image(franquia["site_oficial"])
                if og_url:
                    img = _baixar_imagem_url(og_url)
                    if img and _imagem_e_relevante(img, titulo):
                        print(f"      Referência: og:image de {nome_franquia} ({len(img) // 1024}KB)")
                        return img, "og_image_franquia"

    # ── Sem referência — gera do zero ────────────────────────────────
    print(f"      Sem referência visual — gerando por segmento")
    return None, "sem_referencia"


# ── Chamadas OpenAI ─────────────────────────────────────────────────────

def _gerar_com_referencia(prompt: str, img_bytes: bytes, filepath: Path, size: str = "1536x1024") -> int:
    """
    Gera imagem usando referência visual (image-to-image via /images/edits).
    Usa multipart/form-data conforme exigido pela API.
    Retorna tamanho em bytes da imagem salva.
    """
    import io
    import uuid

    try:
        from PIL import Image as _Image
        buf = io.BytesIO(img_bytes)
        img_pil = _Image.open(buf).convert("RGBA")
        out = io.BytesIO()
        img_pil.save(out, format="PNG")
        png_bytes = out.getvalue()
    except Exception as e:
        raise Exception(f"Conversao PNG falhou: {e}")

    boundary = uuid.uuid4().hex
    body = b""
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="model"\r\n\r\n'
    body += b"gpt-image-1\r\n"
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="prompt"\r\n\r\n'
    body += prompt.encode("utf-8") + b"\r\n"
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="size"\r\n\r\n'
    body += size.encode() + b"\r\n"
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="quality"\r\n\r\n'
    body += b"high\r\n"
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="image[]"; filename="reference.png"\r\n'
    body += b"Content-Type: image/png\r\n\r\n"
    body += png_bytes + b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    req = Request(
        "https://api.openai.com/v1/images/edits",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
        method="POST",
    )

    with urlopen(req, timeout=180, context=SSL_CTX) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    return _salvar_resultado(result, filepath)


def _gerar_sem_referencia(prompt: str, filepath: Path, size: str = "1536x1024") -> int:
    """
    Gera imagem do zero via /images/generations.
    Retorna tamanho em bytes da imagem salva.
    """
    import base64 as b64mod

    req_data = json.dumps({
        "model": "gpt-image-1",
        "prompt": prompt,
        "n": 1,
        "size": size,
        "quality": "high",
    }).encode("utf-8")

    req = Request(
        "https://api.openai.com/v1/images/generations",
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=180, context=SSL_CTX) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        print(f"      GPT Image HTTP {e.code}: {body[:300]}")
        raise

    return _salvar_resultado(result, filepath)


def _salvar_resultado(result: dict, filepath: Path) -> int:
    """Salva imagem do resultado da API (b64_json ou url). Retorna tamanho."""
    import base64 as b64mod

    item = result.get("data", [{}])[0]

    if "b64_json" in item:
        img_bytes = b64mod.b64decode(item["b64_json"])
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        return len(img_bytes)

    if "url" in item:
        dl_req = Request(item["url"])
        with urlopen(dl_req, timeout=60, context=SSL_CTX) as dl_resp:
            data = dl_resp.read()
        with open(filepath, "wb") as f:
            f.write(data)
        return len(data)

    raise Exception(f"Formato de resposta desconhecido: {list(item.keys())}")


# ── Geração por tipo ────────────────────────────────────────────────────

def gerar_imagem_noticia(noticia_id: int) -> str | None:
    """
    Gera imagem editorial para uma notícia.
    Usa cascata de referência: artigo → franquia → segmento.
    """
    conn = get_conn()
    row = conn.execute(
        "SELECT imagem_prompt, imagem_status, segmento, titulo_gerado, imagem_referencia_manual, imagem_instrucao_manual FROM noticias_fila WHERE id = ?",
        (noticia_id,),
    ).fetchone()
    conn.close()

    if not row:
        print(f"    Notícia {noticia_id} não encontrada")
        return None

    if row["imagem_status"] == "gerado":
        print(f"    Imagem já gerada para notícia {noticia_id}")
        return None

    if not row["imagem_prompt"]:
        print(f"    Sem prompt de imagem para notícia {noticia_id}")
        return None

    instrucao_manual = row["imagem_instrucao_manual"]
    referencia_manual = row["imagem_referencia_manual"]
    prompt = montar_prompt(row["imagem_prompt"], row["segmento"], instrucao_manual)
    filepath = IMAGES_DIR / f"noticia_{noticia_id}.png"

    # Marca como gerando
    conn = get_conn()
    conn.execute("UPDATE noticias_fila SET imagem_status = 'gerando' WHERE id = ?", (noticia_id,))
    conn.commit()
    conn.close()

    ref_fonte = "sem_referencia"

    try:
        # Prioridade: referência manual do editor > cascata automática
        img_ref = None
        if referencia_manual:
            if referencia_manual.startswith("/tmp/"):
                try:
                    with open(referencia_manual, "rb") as f:
                        img_ref = f.read()
                    ref_fonte = "referencia_manual_upload"
                    print(f"      Referência manual (upload): {referencia_manual}")
                except Exception as e:
                    print(f"      Erro lendo arquivo local {referencia_manual}: {e}")
            else:
                img_ref = _baixar_imagem_url(referencia_manual)
                if img_ref:
                    ref_fonte = "referencia_manual"
                    print(f"      Referência manual: {referencia_manual[:80]}")
            if not img_ref:
                print(f"      Referência manual falhou — usando cascata automática")

        if not img_ref:
            img_ref, ref_fonte = buscar_imagem_referencia(noticia_id)

        if img_ref:
            try:
                size = _gerar_com_referencia(prompt, img_ref, filepath, "1536x1024")
            except Exception as ref_err:
                print(f"      Referência falhou ({ref_err}) — gerando sem referência")
                size = _gerar_sem_referencia(prompt, filepath, "1536x1024")
                ref_fonte = "sem_referencia_fallback"
        else:
            size = _gerar_sem_referencia(prompt, filepath, "1536x1024")

        imagem_url = f"/static/imagens/noticia_{noticia_id}.png"

        conn = get_conn()
        conn.execute(
            "UPDATE noticias_fila SET imagem_url = ?, imagem_status = 'gerado', imagem_referencia_fonte = ? WHERE id = ?",
            (imagem_url, ref_fonte, noticia_id),
        )
        conn.commit()
        conn.close()

        print(f"    ✓ Notícia {noticia_id} — {size // 1024}KB [{ref_fonte}]")
        return imagem_url

    except Exception as e:
        conn = get_conn()
        conn.execute("UPDATE noticias_fila SET imagem_status = 'erro' WHERE id = ?", (noticia_id,))
        conn.commit()
        conn.close()
        print(f"    ✗ Notícia {noticia_id} — ERRO: {e}")
        return None


def gerar_imagem_card(card_id: int) -> str | None:
    """
    Gera imagem quadrada (1024x1024) para card Instagram.
    Usa a mesma cascata de referência da notícia associada.
    """
    conn = get_conn()
    row = conn.execute(
        """
        SELECT p.id, p.noticia_id, f.imagem_prompt, f.segmento, f.titulo_gerado
        FROM posts_instagram p
        LEFT JOIN noticias_fila f ON p.noticia_id = f.id
        WHERE p.id = ?
        """,
        (card_id,),
    ).fetchone()
    conn.close()

    if not row or not row["imagem_prompt"]:
        print(f"    Card {card_id} sem prompt")
        return None

    prompt = montar_prompt(row["imagem_prompt"], row["segmento"])
    filepath = IMAGES_DIR / f"card_{card_id}.png"

    try:
        # Cards também usam cascata de referência via noticia_id
        img_ref, ref_fonte = None, "sem_referencia"
        if row["noticia_id"]:
            img_ref, ref_fonte = buscar_imagem_referencia(row["noticia_id"])

        if img_ref:
            try:
                size = _gerar_com_referencia(prompt, img_ref, filepath, "1024x1024")
            except Exception:
                size = _gerar_sem_referencia(prompt, filepath, "1024x1024")
                ref_fonte = "sem_referencia_fallback"
        else:
            size = _gerar_sem_referencia(prompt, filepath, "1024x1024")

        imagem_url = f"/static/imagens/card_{card_id}.png"

        conn = get_conn()
        conn.execute("UPDATE posts_instagram SET imagem_url = ? WHERE id = ?", (imagem_url, card_id))
        conn.commit()
        conn.close()

        print(f"    ✓ Card {card_id} — {size // 1024}KB [{ref_fonte}]")
        return imagem_url

    except Exception as e:
        print(f"    ✗ Card {card_id} — ERRO: {e}")
        return None


# ── Orquestrador ────────────────────────────────────────────────────────

def gerar_todas(tipo: str = "todos", limite: int = 10) -> int:
    if not OPENAI_API_KEY:
        print("AVISO: OPENAI_API_KEY não configurada. Abortando.")
        return 0

    print(f"\n{'=' * 60}")
    print(f"  Geração de imagens — tipo={tipo}, limite={limite}")
    print(f"{'=' * 60}\n")

    total = 0

    if tipo in ("noticia", "todos"):
        conn = get_conn()
        pendentes = conn.execute(
            """
            SELECT id, titulo_gerado FROM noticias_fila
            WHERE imagem_prompt IS NOT NULL
              AND (imagem_status IS NULL OR imagem_status IN ('pendente', 'erro'))
            ORDER BY id DESC
            LIMIT ?
            """,
            (limite,),
        ).fetchall()
        conn.close()

        print(f"  Notícias pendentes: {len(pendentes)}\n")
        for row in pendentes:
            print(f"  [{row['id']}] {(row['titulo_gerado'] or '')[:60]}...")
            result = gerar_imagem_noticia(row["id"])
            if result:
                total += 1
            time.sleep(3)  # respeita rate limit OpenAI

    if tipo in ("card", "todos"):
        conn = get_conn()
        pendentes = conn.execute(
            """
            SELECT p.id FROM posts_instagram p
            LEFT JOIN noticias_fila f ON p.noticia_id = f.id
            WHERE p.imagem_url IS NULL
              AND f.imagem_prompt IS NOT NULL
            ORDER BY p.id DESC
            LIMIT ?
            """,
            (limite,),
        ).fetchall()
        conn.close()

        print(f"\n  Cards pendentes: {len(pendentes)}\n")
        for row in pendentes:
            print(f"  Card [{row['id']}]...")
            result = gerar_imagem_card(row["id"])
            if result:
                total += 1
            time.sleep(3)

    print(f"\n{'=' * 60}")
    print(f"  Total gerado: {total} imagens")
    print(f"{'=' * 60}\n")
    return total


# ── CLI ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gerador de imagens — Mercado Franquia")
    parser.add_argument("--tipo", default="todos", choices=["noticia", "card", "todos"])
    parser.add_argument("--limite", type=int, default=10)
    args = parser.parse_args()
    gerar_todas(tipo=args.tipo, limite=args.limite)
