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
    """Gera imagem para uma notícia."""
    conn = get_conn()
    row = conn.execute("SELECT imagem_prompt, imagem_status FROM noticias_fila WHERE id = ?", (noticia_id,)).fetchone()
    conn.close()

    if not row or not row["imagem_prompt"]:
        print(f"    Sem prompt de imagem para noticia {noticia_id}")
        return None

    if row["imagem_status"] == "gerado":
        print(f"    Imagem ja gerada para noticia {noticia_id}")
        return None

    prompt = f"Professional editorial photography for Brazilian business magazine. {row['imagem_prompt']}. Visual style: warm tones with orange and dark accents, cinematic lighting, shallow depth of field, NO TEXT, NO DOCUMENTS WITH TEXT, NO SCREENS WITH TEXT, clean surfaces, modern Brazilian business environment, Bloomberg/Economist editorial aesthetic, high contrast, photorealistic, 8K quality."

    conn = get_conn()
    conn.execute("UPDATE noticias_fila SET imagem_status = 'gerando' WHERE id = ?", (noticia_id,))
    conn.commit()
    conn.close()

    try:
        filepath = IMAGES_DIR / f"noticia_{noticia_id}.png"
        size = _generate_image(prompt, filepath, "1536x1024")
        imagem_url = f"/static/imagens/noticia_{noticia_id}.png"

        conn = get_conn()
        conn.execute("UPDATE noticias_fila SET imagem_url = ?, imagem_status = 'gerado' WHERE id = ?", (imagem_url, noticia_id))
        conn.commit()
        conn.close()

        print(f"    OK — {size // 1024}KB salvo em {filepath.name}")
        return imagem_url

    except Exception as e:
        conn = get_conn()
        conn.execute("UPDATE noticias_fila SET imagem_status = 'erro' WHERE id = ?", (noticia_id,))
        conn.commit()
        conn.close()
        print(f"    ERRO: {e}")
        return None


def gerar_imagem_card(card_id):
    """Gera imagem para card Instagram."""
    conn = get_conn()
    row = conn.execute("SELECT p.id, f.imagem_prompt FROM posts_instagram p LEFT JOIN noticias_fila f ON p.noticia_id = f.id WHERE p.id = ?", (card_id,)).fetchone()
    conn.close()

    if not row or not row["imagem_prompt"]:
        return None

    prompt = f"Modern Brazilian business photography, square format. {row['imagem_prompt']}. Warm orange and dark color palette matching brand colors, NO TEXT, NO LOGOS, NO DOCUMENTS, clean minimal composition, professional lighting, high quality photorealistic."

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
