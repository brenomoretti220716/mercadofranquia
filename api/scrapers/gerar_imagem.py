"""
Gera imagens com DALL-E 3 para notícias e cards Instagram.

Uso:
  python3 api/scrapers/gerar_imagem.py --tipo noticia --limite 3
  python3 api/scrapers/gerar_imagem.py --tipo todos --limite 10
"""

import argparse
import json
import os
import ssl
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError

_env_file = Path(__file__).parent.parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        if "=" in _line and not _line.startswith("#"):
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
IMAGES_DIR = Path(__file__).parent.parent / "static" / "imagens"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# ── Prompts por segmento ABF ────────────────────────────────────────────

PROMPTS_SEGMENTO = {
    "Saude/Beleza": "Modern Brazilian beauty salon or wellness clinic, bright natural lighting, clean white and warm tones, professional aesthetician at work, happy Brazilian client, upscale storefront",
    "Saúde, Beleza e Bem-Estar": "Modern Brazilian beauty salon or wellness clinic, bright natural lighting, clean white and warm tones, professional aesthetician at work, happy Brazilian client, upscale storefront",
    "Alimentação - FS": "Busy modern Brazilian restaurant franchise, bright warm lighting, food preparation area, friendly staff in uniform, colorful fresh food display, lunchtime atmosphere",
    "Alimentacao-FS": "Busy modern Brazilian restaurant franchise, bright warm lighting, food preparation area, friendly staff in uniform, colorful fresh food display, lunchtime atmosphere",
    "Alimentação - CD": "Brazilian food distribution operation, organized warehouse shelves, logistics in action, professional workers, delivery vehicles outside, modern supply chain",
    "Alimentacao-CD": "Brazilian food distribution operation, organized warehouse shelves, logistics in action, professional workers, delivery vehicles outside, modern supply chain",
    "Educação": "Modern Brazilian learning center, bright colorful classroom, engaged students and instructor, tablets and modern materials, motivated young Brazilians studying",
    "Educacao": "Modern Brazilian learning center, bright colorful classroom, engaged students and instructor, tablets and modern materials, motivated young Brazilians studying",
    "Casa e Construção": "Brazilian home improvement franchise showroom, well-organized materials display, professional consultant helping customer, bright lighting, modern design samples",
    "Casa e Construcao": "Brazilian home improvement franchise showroom, well-organized materials display, professional consultant helping customer, bright lighting, modern design samples",
    "Moda": "Stylish Brazilian fashion franchise boutique, well-lit modern store, organized clothing displays, fashionable Brazilian customers, contemporary retail design",
    "Hotelaria e Turismo": "Modern Brazilian hotel lobby, bright welcoming reception, friendly staff, Brazilian travelers, contemporary design with local cultural elements",
    "Serviços Automotivos": "Clean modern Brazilian auto service franchise, bright organized garage, professional mechanics in uniforms, modern equipment, suburban commercial area",
    "Servicos Automotivos": "Clean modern Brazilian auto service franchise, bright organized garage, professional mechanics in uniforms, modern equipment, suburban commercial area",
    "Comunicação/TI": "Modern Brazilian tech franchise store, bright contemporary retail, digital displays, friendly tech consultant, clean minimalist design, urban setting",
    "Comunicacao/TI": "Modern Brazilian tech franchise store, bright contemporary retail, digital displays, friendly tech consultant, clean minimalist design, urban setting",
    "Entretenimento e Lazer": "Vibrant Brazilian entertainment franchise, colorful energetic environment, happy Brazilian families, bright playful atmosphere, modern recreational facility",
    "Limpeza e Conservação": "Professional Brazilian cleaning franchise team in action, bright clean environment, modern equipment, uniformed team, commercial building setting",
    "Limpeza e Conservacao": "Professional Brazilian cleaning franchise team in action, bright clean environment, modern equipment, uniformed team, commercial building setting",
    "Serviços e Outros Negócios": "Professional Brazilian business services franchise office, bright modern workspace, consultant meeting client, contemporary office design",
    "Servicos e Outros Negocios": "Professional Brazilian business services franchise office, bright modern workspace, consultant meeting client, contemporary office design",
}

PROMPT_PADRAO = "Professional Brazilian franchise business, bright natural lighting, modern commercial setting, friendly staff, clean contemporary design, urban Brazilian neighborhood"

REGRAS_GLOBAIS = "REQUIREMENTS: Bright well-lit environment, natural daylight, Brazilian people, photorealistic editorial photography, NO text NO logos NO signs with readable text, NO stock photo poses, high resolution sharp focus, warm color temperature, real business environment NOT staged"


def montar_prompt(imagem_prompt, segmento=None):
    """Monta prompt completo com base visual do segmento + contexto da notícia."""
    base = PROMPTS_SEGMENTO.get(segmento or "", PROMPT_PADRAO)
    contexto = (imagem_prompt or "").strip()
    return f"{base}. {contexto}. {REGRAS_GLOBAIS}"[:4000]


# ── Busca de imagem de referência ────────────────────────────────────────

HEADERS_BROWSER = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"}


def _baixar_imagem_url(url):
    """Baixa imagem de uma URL. Retorna bytes ou None."""
    try:
        req = Request(url, headers=HEADERS_BROWSER)
        with urlopen(req, timeout=15, context=SSL_CTX) as resp:
            ct = resp.headers.get("Content-Type", "")
            if "image" not in ct and not url.endswith((".jpg", ".jpeg", ".png", ".webp")):
                return None
            data = resp.read(8 * 1024 * 1024)  # max 8MB
            if len(data) < 10_000:  # min 10KB
                return None
            return data
    except Exception:
        return None


def _extrair_og_image(url):
    """Busca og:image de uma URL de página web."""
    try:
        import re as _re
        req = Request(url, headers=HEADERS_BROWSER)
        with urlopen(req, timeout=12, context=SSL_CTX) as resp:
            html = resp.read(200_000).decode("utf-8", errors="ignore")
        # og:image
        m = _re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"', html, _re.IGNORECASE)
        if not m:
            m = _re.search(r'<meta[^>]*content="([^"]+)"[^>]*property="og:image"', html, _re.IGNORECASE)
        if m:
            img_url = m.group(1)
            if img_url.startswith("//"):
                img_url = "https:" + img_url
            return img_url
    except Exception:
        pass
    return None


def buscar_imagem_referencia(noticia_id):
    """Cascata: og:image artigo → og:image franquia → None."""
    conn = get_conn()
    row = conn.execute(
        "SELECT r.url, f.titulo_gerado FROM noticias_raw r JOIN noticias_fila f ON f.raw_id = r.id WHERE f.id = ?",
        (noticia_id,),
    ).fetchone()
    conn.close()

    if not row:
        return None, "sem_referencia"

    # Tentativa 1: og:image do artigo original
    if row["url"]:
        og_url = _extrair_og_image(row["url"])
        if og_url:
            img = _baixar_imagem_url(og_url)
            if img:
                return img, "og_image_artigo"

    # Tentativa 2: franquia mencionada → buscar site
    if row["titulo_gerado"]:
        import re as _re
        # Extrair nome de franquia do título
        match = _re.search(r"(?:Franquia|rede|marca)\s+([A-Z][A-Za-zÀ-ú\s&']+)", row["titulo_gerado"])
        if match:
            nome = match.group(1).strip()[:30]
            conn = get_conn()
            franquia = conn.execute("SELECT site_oficial FROM franquias WHERE nome LIKE ? AND site_oficial IS NOT NULL LIMIT 1", (f"%{nome}%",)).fetchone()
            conn.close()
            if franquia and franquia["site_oficial"]:
                og_url = _extrair_og_image(franquia["site_oficial"])
                if og_url:
                    img = _baixar_imagem_url(og_url)
                    if img:
                        return img, "og_image_franquia"

    return None, "sem_referencia"


def _gerar_com_referencia(prompt, img_bytes, filepath, size="1536x1024"):
    """Gera imagem usando referência visual via /images/edits."""
    import base64 as b64mod
    import uuid

    boundary = uuid.uuid4().hex

    body_parts = []
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\ngpt-image-1\r\n".encode())
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"prompt\"\r\n\r\n{prompt}\r\n".encode())
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"n\"\r\n\r\n1\r\n".encode())
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"size\"\r\n\r\n{size}\r\n".encode())
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"ref.png\"\r\nContent-Type: image/png\r\n\r\n".encode())
    body_parts.append(img_bytes)
    body_parts.append(f"\r\n--{boundary}--\r\n".encode())

    body = b"".join(body_parts)

    req = Request(
        "https://api.openai.com/v1/images/edits",
        data=body,
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=180, context=SSL_CTX) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body_err = e.read().decode("utf-8", errors="ignore")
        print(f"    Edit API HTTP {e.code}: {body_err[:200]}")
        raise

    item = result.get("data", [{}])[0]

    if "b64_json" in item:
        with open(filepath, "wb") as f:
            f.write(b64mod.b64decode(item["b64_json"]))
        return os.path.getsize(filepath)

    if "url" in item:
        dl_req = Request(item["url"])
        with urlopen(dl_req, timeout=60, context=SSL_CTX) as dl_resp:
            data = dl_resp.read()
        with open(filepath, "wb") as f:
            f.write(data)
        return len(data)

    raise Exception(f"Formato desconhecido: {list(item.keys())}")


# ── Geração padrão (sem referência) ─────────────────────────────────────

def _generate_image(prompt, filepath, size="1536x1024"):
    """Chama GPT Image 1.5, detecta formato de resposta e salva imagem."""
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
        print(f"    GPT Image HTTP {e.code}: {body[:300]}")
        raise

    item = result.get("data", [{}])[0]
    print(f"    Resposta keys: {list(item.keys())}")

    # Tentar b64_json primeiro (gpt-image-1 retorna isso por padrão)
    if "b64_json" in item:
        img_bytes = b64mod.b64decode(item["b64_json"])
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        return len(img_bytes)

    # Fallback: URL (dall-e-3 e alguns modelos)
    if "url" in item:
        url = item["url"]
        dl_req = Request(url)
        with urlopen(dl_req, timeout=60, context=SSL_CTX) as dl_resp:
            data = dl_resp.read()
        with open(filepath, "wb") as f:
            f.write(data)
        return len(data)

    print(f"    ERRO: formato de resposta desconhecido: {list(item.keys())}")
    raise Exception(f"Formato desconhecido: {list(item.keys())}")


def gerar_imagem_noticia(noticia_id):
    """Gera imagem para uma notícia usando prompt do segmento."""
    conn = get_conn()
    row = conn.execute("SELECT imagem_prompt, imagem_status, segmento FROM noticias_fila WHERE id = ?", (noticia_id,)).fetchone()
    conn.close()

    if not row or not row["imagem_prompt"]:
        print(f"    Sem prompt de imagem para noticia {noticia_id}")
        return None

    if row["imagem_status"] == "gerado":
        print(f"    Imagem ja gerada para noticia {noticia_id}")
        return None

    prompt = montar_prompt(row["imagem_prompt"], row["segmento"] if "segmento" in row.keys() else None)

    conn = get_conn()
    conn.execute("UPDATE noticias_fila SET imagem_status = 'gerando' WHERE id = ?", (noticia_id,))
    conn.commit()
    conn.close()

    try:
        filepath = IMAGES_DIR / f"noticia_{noticia_id}.png"

        # Cascata de referência
        img_ref, ref_fonte = buscar_imagem_referencia(noticia_id)
        if img_ref:
            print(f"    Usando referencia: {ref_fonte} ({len(img_ref) // 1024}KB)")
            try:
                size = _gerar_com_referencia(prompt, img_ref, filepath, "1536x1024")
            except Exception as ref_err:
                print(f"    Referencia falhou ({ref_err}), gerando sem referencia...")
                size = _generate_image(prompt, filepath, "1536x1024")
                ref_fonte = "sem_referencia"
        else:
            print(f"    Sem referencia — prompt por segmento")
            size = _generate_image(prompt, filepath, "1536x1024")

        imagem_url = f"/static/imagens/noticia_{noticia_id}.png"

        conn = get_conn()
        conn.execute("UPDATE noticias_fila SET imagem_url = ?, imagem_status = 'gerado', imagem_referencia_fonte = ? WHERE id = ?", (imagem_url, ref_fonte, noticia_id))
        conn.commit()
        conn.close()

        print(f"    OK — {size // 1024}KB salvo em {filepath.name} (ref: {ref_fonte})")
        return imagem_url

    except Exception as e:
        conn = get_conn()
        conn.execute("UPDATE noticias_fila SET imagem_status = 'erro' WHERE id = ?", (noticia_id,))
        conn.commit()
        conn.close()
        print(f"    ERRO: {e}")
        return None


def gerar_imagem_card(card_id):
    """Gera imagem para card Instagram usando prompt do segmento."""
    conn = get_conn()
    row = conn.execute("SELECT p.id, f.imagem_prompt, f.segmento FROM posts_instagram p LEFT JOIN noticias_fila f ON p.noticia_id = f.id WHERE p.id = ?", (card_id,)).fetchone()
    conn.close()

    if not row or not row["imagem_prompt"]:
        return None

    prompt = montar_prompt(row["imagem_prompt"], row["segmento"] if "segmento" in row.keys() else None)

    try:
        filepath = IMAGES_DIR / f"card_{card_id}.png"
        size = _generate_image(prompt, filepath, "1024x1024")
        imagem_url = f"/static/imagens/card_{card_id}.png"

        conn = get_conn()
        conn.execute("UPDATE posts_instagram SET imagem_url = ? WHERE id = ?", (imagem_url, card_id))
        conn.commit()
        conn.close()

        print(f"    OK — card {card_id}: {size // 1024}KB")
        return imagem_url

    except Exception as e:
        print(f"    ERRO card {card_id}: {e}")
        return None


def gerar_todas(tipo="todos", limite=10):
    if not OPENAI_API_KEY:
        print("AVISO: OPENAI_API_KEY nao configurada. Pulando geracao de imagens.")
        return 0

    print(f"\n{'='*60}")
    print(f"  Gerando imagens DALL-E 3 (tipo={tipo}, limite={limite})")
    print(f"{'='*60}\n")

    total = 0

    if tipo in ("noticia", "todos"):
        conn = get_conn()
        pendentes = conn.execute(
            "SELECT id, titulo_gerado FROM noticias_fila WHERE imagem_prompt IS NOT NULL AND (imagem_status IS NULL OR imagem_status = 'pendente') LIMIT ?",
            (limite,),
        ).fetchall()
        conn.close()

        for row in pendentes:
            print(f"  Noticia [{row['id']}] {(row['titulo_gerado'] or '')[:50]}...")
            result = gerar_imagem_noticia(row["id"])
            if result:
                total += 1
            time.sleep(2)

    if tipo in ("card", "todos"):
        conn = get_conn()
        pendentes = conn.execute(
            "SELECT p.id FROM posts_instagram p LEFT JOIN noticias_fila f ON p.noticia_id = f.id WHERE p.imagem_url IS NULL AND f.imagem_prompt IS NOT NULL LIMIT ?",
            (limite,),
        ).fetchall()
        conn.close()

        for row in pendentes:
            print(f"  Card [{row['id']}]...")
            result = gerar_imagem_card(row["id"])
            if result:
                total += 1
            time.sleep(2)

    print(f"\n  Total imagens geradas: {total}\n")
    return total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera imagens DALL-E 3")
    parser.add_argument("--tipo", default="todos", choices=["noticia", "card", "todos"])
    parser.add_argument("--limite", type=int, default=10)
    args = parser.parse_args()
    gerar_todas(tipo=args.tipo, limite=args.limite)
