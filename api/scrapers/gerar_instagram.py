"""
Gera posts de Instagram a partir de notícias processadas.

Uso:
  python3 api/scrapers/gerar_instagram.py --limite 3
"""

import argparse
import json
import os
import re
import ssl
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError

# Carregar .env sem python-dotenv
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

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

PROMPT_INSTAGRAM = """Com base nesta noticia sobre franchising brasileiro, gere 4 posts para Instagram do Mercado Franquia.

Retorne APENAS JSON valido com array "posts", cada um com:
- tipo: "dado_principal" | "citacao" | "pergunta" | "chart"
- legenda: texto do post (max 150 chars, impactante, sem hashtags)
- hashtags: string com 10-15 hashtags relevantes separadas por espaco
- dado_destaque: numero ou fato principal para o card visual (ex: "R$ 301,7 bi", "+10,5%", "202 mil")
- subtexto: contexto em 1 frase curta (max 60 chars)

REGRAS por tipo:
- dado_principal: 1 numero impactante + contexto breve. Ex: dado="R$ 301,7 bi" subtexto="Faturamento do franchising em 2025"
- citacao: frase mais impactante do artigo entre aspas. dado="frase curta" subtexto="Fonte: ABF 2026"
- pergunta: pergunta que gera engajamento. dado="Voce sabia?" subtexto="pergunta provocativa curta"
- chart: dado comparativo. dado="Franchising +10,5%" subtexto="vs PIB +3,4%"

Exemplos de boas legendas:
- "O franchising brasileiro ultrapassou R$ 300 bi. Seu proximo negocio pode ser parte disso."
- "Saude e Beleza cresceu 14,6% em 2025. Voce esta capturando esse mercado?"

Retorne: {"posts": [...]}"""

# Logo em base64 (carregada uma vez)
import base64
_logo_path = Path(__file__).parent.parent / "static" / "logo_mercado_franquia.png"
_LOGO_B64 = ""
if _logo_path.exists():
    _LOGO_B64 = base64.b64encode(_logo_path.read_bytes()).decode()

_FONTS = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">'
_LOGO_IMG = f'<img src="data:image/png;base64,{_LOGO_B64}" style="width:140px">' if _LOGO_B64 else '<div style="color:#666;font-size:16px;text-transform:uppercase;letter-spacing:4px">Mercado Franquia</div>'

_BASE = f"""<html><head>{_FONTS}</head><body style="margin:0;padding:0">
<div style="width:1080px;height:1080px;background:linear-gradient(135deg,#0D0D0D 0%,#1A1A18 100%);position:relative;font-family:'Inter',system-ui,sans-serif;box-sizing:border-box;overflow:hidden">
<!-- Logo -->
<div style="position:absolute;top:50px;left:60px">{_LOGO_IMG}</div>
<div style="position:absolute;top:110px;left:60px;right:60px;height:1px;background:linear-gradient(90deg,#E8421A 0%,transparent 100%)"></div>
<!-- Content -->
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:160px 80px 100px;box-sizing:border-box">
{{content}}
</div>
<!-- Bottom bar -->
<div style="position:absolute;bottom:0;left:0;right:0;height:8px;background:#E8421A"></div>
<div style="position:absolute;bottom:20px;right:60px;color:#444;font-size:14px;font-family:'Inter'">mercadofranquia.com.br</div>
</div></body></html>"""


def _card(content_html):
    return _BASE.replace("{{content}}", content_html)


CARD_TEMPLATES = {
    "dado_principal": lambda dado, sub: _card(f"""
<div style="color:#E8421A;font-size:100px;font-weight:700;text-align:center;line-height:1.1;font-family:'Space Grotesk','Inter',sans-serif">{dado}</div>
<div style="color:#CCC;font-size:28px;margin-top:35px;text-align:center;line-height:1.4;max-width:800px">{sub}</div>
"""),

    "citacao": lambda dado, sub: _card(f"""
<div style="position:absolute;top:140px;left:50px;color:#E8421A;font-size:180px;opacity:0.15;font-family:serif;line-height:0.6">\u201C</div>
<div style="color:#FFF;font-size:34px;text-align:center;line-height:1.5;max-width:800px;font-style:italic;font-weight:400">{dado}</div>
<div style="color:#E8421A;font-size:20px;margin-top:35px;font-weight:600">{sub}</div>
"""),

    "pergunta": lambda dado, sub: _card(f"""
<div style="position:absolute;top:200px;right:80px;color:#E8421A;font-size:220px;opacity:0.1;font-weight:800;font-family:'Space Grotesk'">?</div>
<div style="color:#FFF;font-size:38px;text-align:center;line-height:1.4;max-width:800px;font-weight:700">{dado}</div>
<div style="color:#999;font-size:24px;margin-top:35px;text-align:center;line-height:1.4">{sub}</div>
<div style="color:#E8421A;font-size:20px;margin-top:25px;font-weight:600">Comente sua opiniao ↓</div>
"""),

    "chart": lambda dado, sub: _card(f"""
<div style="color:#E8421A;font-size:64px;font-weight:700;text-align:center;font-family:'Space Grotesk','Inter',sans-serif">{dado}</div>
<div style="width:650px;margin:35px 0">
  <div style="display:flex;align-items:center;gap:15px;margin-bottom:12px">
    <div style="color:#CCC;font-size:16px;width:120px;text-align:right">Franchising</div>
    <div style="flex:1;height:12px;background:#333;border-radius:6px"><div style="width:75%;height:100%;background:#E8421A;border-radius:6px"></div></div>
  </div>
  <div style="display:flex;align-items:center;gap:15px">
    <div style="color:#666;font-size:16px;width:120px;text-align:right">Comparativo</div>
    <div style="flex:1;height:12px;background:#333;border-radius:6px"><div style="width:35%;height:100%;background:#444;border-radius:6px"></div></div>
  </div>
</div>
<div style="color:#888;font-size:26px;text-align:center">{sub}</div>
"""),
}


def gerar_posts(limite=5):
    if not ANTHROPIC_API_KEY:
        print("ERRO: ANTHROPIC_API_KEY nao configurada.")
        return 0

    conn = get_conn()
    # Notícias processadas que ainda não têm posts
    pendentes = conn.execute(
        """SELECT f.id, f.titulo_gerado, f.conteudo_gerado, f.resumo, f.segmento
           FROM noticias_fila f
           WHERE f.status = 'pendente'
           AND f.id NOT IN (SELECT DISTINCT noticia_id FROM posts_instagram WHERE noticia_id IS NOT NULL)
           ORDER BY f.created_at DESC LIMIT ?""",
        (limite,),
    ).fetchall()
    conn.close()

    if not pendentes:
        print("Nenhuma noticia sem posts Instagram.")
        return 0

    print(f"\n{'='*60}")
    print(f"  Gerando posts Instagram para {len(pendentes)} noticias")
    print(f"{'='*60}\n")

    total = 0
    erros = 0

    for row in pendentes:
        fila_id = row["id"]
        titulo = row["titulo_gerado"] or ""
        conteudo = row["conteudo_gerado"] or row["resumo"] or ""

        print(f"  [{total + erros + 1}/{len(pendentes)}] {titulo[:55]}...")

        user_msg = f"Titulo: {titulo}\nResumo: {row['resumo'] or ''}\nSegmento: {row['segmento'] or ''}\nConteudo: {conteudo[:1500]}"

        try:
            req_data = json.dumps({
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1500,
                "system": PROMPT_INSTAGRAM,
                "messages": [{"role": "user", "content": user_msg}],
            }).encode("utf-8")

            req = Request(
                "https://api.anthropic.com/v1/messages",
                data=req_data,
                headers={"content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
                method="POST",
            )

            try:
                with urlopen(req, timeout=60, context=SSL_CTX) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
            except HTTPError as http_err:
                body = http_err.read().decode("utf-8", errors="ignore")
                print(f"    API HTTP {http_err.code}: {body[:200]}")
                raise Exception(f"API HTTP {http_err.code}")

            raw_text = result["content"][0]["text"]
            raw_text = re.sub(r"```json|```", "", raw_text).strip()
            dados = json.loads(raw_text)

            posts = dados.get("posts", [])
            conn = get_conn()
            for p in posts:
                tipo = p.get("tipo", "dado_principal")
                dado = p.get("dado_destaque", "")
                sub = p.get("subtexto", "")
                template_fn = CARD_TEMPLATES.get(tipo, CARD_TEMPLATES["dado_principal"])
                card_html = template_fn(dado, sub)

                conn.execute(
                    """INSERT INTO posts_instagram(noticia_id, tipo, legenda, hashtags, dado_destaque, subtexto, card_html, status)
                       VALUES(?,?,?,?,?,?,?,?)""",
                    (fila_id, tipo, p.get("legenda", ""), p.get("hashtags", ""), dado, sub, card_html, "rascunho"),
                )
            conn.commit()
            conn.close()

            total += 1
            print(f"    OK — {len(posts)} posts gerados")

        except Exception as e:
            erros += 1
            print(f"    ERRO: {str(e)[:100]}")

        time.sleep(2)

    print(f"\n{'='*60}")
    print(f"  Noticias processadas: {total} | Erros: {erros}")
    print(f"{'='*60}\n")
    return total


def regenerar_cards(limite=100):
    """Re-renderiza card_html dos posts existentes com o template atual."""
    conn = get_conn()
    posts = conn.execute("SELECT id, tipo, dado_destaque, subtexto FROM posts_instagram ORDER BY id DESC LIMIT ?", (limite,)).fetchall()
    if not posts:
        print("Nenhum post para regenerar.")
        return 0

    print(f"\n{'='*60}")
    print(f"  Regenerando {len(posts)} cards com novo design")
    print(f"{'='*60}\n")

    count = 0
    for p in posts:
        tipo = p["tipo"] or "dado_principal"
        dado = p["dado_destaque"] or ""
        sub = p["subtexto"] or ""
        template_fn = CARD_TEMPLATES.get(tipo, CARD_TEMPLATES["dado_principal"])
        card_html = template_fn(dado, sub)
        conn.execute("UPDATE posts_instagram SET card_html = ? WHERE id = ?", (card_html, p["id"]))
        count += 1

    conn.commit()
    conn.close()
    print(f"  {count} cards atualizados.")
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera posts Instagram")
    parser.add_argument("--limite", type=int, default=5, help="Limite de noticias")
    parser.add_argument("--regenerar", action="store_true", help="Regenerar cards com novo design")
    args = parser.parse_args()

    if args.regenerar:
        regenerar_cards(limite=args.limite)
    else:
        gerar_posts(limite=args.limite)
