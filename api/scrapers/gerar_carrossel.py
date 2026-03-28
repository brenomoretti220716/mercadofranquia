"""
Gera carrosséis de Instagram (7 slides) com Claude API.

Uso:
  python3 api/scrapers/gerar_carrossel.py --tipo educacional
  python3 api/scrapers/gerar_carrossel.py --tipo ranking
"""

import argparse
import base64
import json
import os
import re
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
from database import get_conn, init_db

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Logos base64
_static = Path(__file__).parent.parent / "static"
_LOGO_B64 = (_static / "logo_base64.txt").read_text() if (_static / "logo_base64.txt").exists() else ""
_LOGO_CLARA_B64 = (_static / "logo_clara_base64.txt").read_text() if (_static / "logo_clara_base64.txt").exists() else _LOGO_B64

_LOGO_ESCURA = f'<img src="data:image/png;base64,{_LOGO_B64}" style="width:160px">' if _LOGO_B64 else '<div style="color:#FFF;font-size:18px;font-weight:700">MERCADO FRANQUIA</div>'
_LOGO_ESCURA_BIG = f'<img src="data:image/png;base64,{_LOGO_B64}" style="width:220px">' if _LOGO_B64 else '<div style="color:#FFF;font-size:24px;font-weight:700">MERCADO FRANQUIA</div>'
_LOGO_CLARA = f'<img src="data:image/png;base64,{_LOGO_CLARA_B64}" style="width:160px">' if _LOGO_CLARA_B64 else '<div style="color:#0D0D0D;font-size:18px;font-weight:700">MERCADO FRANQUIA</div>'
_FONTS = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">'

# ── SLIDE TEMPLATES ──────────────────────────────────────────────────────────

_PH = "___SLIDE_CONTENT___"

_DESIGN_A = f"""<html><head>{_FONTS}</head><body style="margin:0">
<div style="width:1080px;height:1080px;background:#0D0D0D;position:relative;font-family:'Inter',sans-serif;box-sizing:border-box;overflow:hidden">
<div style="position:absolute;top:40px;left:40px">{_LOGO_ESCURA}</div>
<div style="position:absolute;top:110px;left:40px;right:40px;height:1px;background:linear-gradient(90deg,#E8421A,transparent)"></div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:140px 60px 80px;box-sizing:border-box">
{_PH}
</div>
<div style="position:absolute;bottom:0;left:0;right:0;height:8px;background:#E8421A"></div>
<div style="position:absolute;bottom:20px;right:40px;color:#444;font-size:16px">___SLIDE_NUM___</div>
</div></body></html>"""

_DESIGN_B = f"""<html><head>{_FONTS}</head><body style="margin:0">
<div style="width:1080px;height:1080px;background:#FAFAF8;position:relative;font-family:'Inter',sans-serif;box-sizing:border-box;overflow:hidden">
<div style="position:absolute;top:0;left:0;right:0;height:8px;background:#E8421A"></div>
<div style="position:absolute;top:30px;right:40px">{_LOGO_CLARA}</div>
<div style="display:flex;flex-direction:column;padding:60px;padding-top:50px;box-sizing:border-box;height:100%">
{_PH}
</div>
<div style="position:absolute;bottom:20px;left:40px;color:#CCC;font-size:16px">___SLIDE_NUM___</div>
<div style="position:absolute;bottom:20px;right:40px;color:#CCC;font-size:14px">mercadofranquia.com.br</div>
</div></body></html>"""

_DESIGN_C = f"""<html><head>{_FONTS}</head><body style="margin:0">
<div style="width:1080px;height:1080px;background:#E8421A;position:relative;font-family:'Inter',sans-serif;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center">
<div style="margin-bottom:40px">{_LOGO_ESCURA_BIG}</div>
<div style="color:#FFF;font-size:52px;font-weight:800;text-align:center;margin-bottom:20px">Salve este post</div>
<div style="color:rgba(255,255,255,0.9);font-size:36px;text-align:center">↓</div>
<div style="position:absolute;bottom:40px;color:rgba(255,255,255,0.7);font-size:22px">mercadofranquia.com.br</div>
</div></body></html>"""


def render_slide(slide, total_slides):
    """Renderiza um slide com o design correto."""
    num = slide.get("numero", 1)
    badge = slide.get("badge", "")
    titulo = slide.get("titulo_slide", "")
    conteudo = slide.get("conteudo", "")
    dado = slide.get("dado_destaque", "")
    fonte = slide.get("fonte", "")
    num_label = f"{num:02d}/{total_slides:02d}"

    # Slide 7 = encerramento (Design C)
    if num == total_slides:
        return _DESIGN_C

    # Ímpares (1,3,5) = Design A (escuro), Pares (2,4,6) = Design B (claro)
    if num % 2 == 1:
        if num == 1:
            # Capa
            content = f"""
<div style="color:#E8421A;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:30px;background:rgba(232,66,26,0.15);padding:8px 20px;border-radius:6px">{badge}</div>
<div style="color:#E8421A;font-size:110px;font-weight:700;text-align:center;line-height:1;font-family:'Space Grotesk',sans-serif;margin-bottom:25px">{dado}</div>
<div style="color:#FFF;font-size:32px;text-align:center;line-height:1.4;max-width:850px;font-weight:600">{titulo}</div>
<div style="color:#666;font-size:18px;margin-top:20px">{fonte}</div>"""
        else:
            # Dados (slides ímpares)
            content = f"""
<div style="color:#E8421A;font-size:90px;font-weight:700;text-align:center;line-height:1.1;font-family:'Space Grotesk',sans-serif;margin-bottom:25px">{dado}</div>
<div style="color:#FFF;font-size:30px;text-align:center;line-height:1.4;max-width:850px;font-weight:600;margin-bottom:15px">{titulo}</div>
<div style="color:#999;font-size:22px;text-align:center;line-height:1.5;max-width:800px">{conteudo}</div>
<div style="color:#555;font-size:16px;margin-top:20px">{fonte}</div>"""
        html = _DESIGN_A.replace(_PH, content)
    else:
        # Educacional (slides pares — Design B claro)
        content = f"""
<div style="color:#E8421A;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px">{badge}</div>
<div style="color:#0D0D0D;font-size:36px;font-weight:700;line-height:1.3;margin-bottom:25px">{titulo}</div>
<div style="color:#444;font-size:24px;line-height:1.6;margin-bottom:30px;flex:1">{conteudo}</div>
{f'<div style="background:#FFF0ED;border-left:4px solid #E8421A;padding:20px 25px;border-radius:0 8px 8px 0;margin-bottom:20px"><div style="color:#E8421A;font-size:40px;font-weight:700;font-family:Space Grotesk,sans-serif">{dado}</div></div>' if dado else ''}
<div style="color:#BBB;font-size:16px">{fonte}</div>"""
        html = _DESIGN_B.replace(_PH, content)

    return html.replace("___SLIDE_NUM___", num_label)


# ── PROMPTS POR TIPO ─────────────────────────────────────────────────────────

DADOS_CONTEXTO = """Dados disponiveis:
- Faturamento franchising 2025: R$ 301,7 bi (+10,5%) — ABF
- Lider: Saude/Beleza R$ 74,3 bi (+14,6%) — ABF
- Limpeza/Conservacao: maior crescimento (+16,8%) — ABF
- 202.444 unidades, 3.297 redes, 1,762 mi empregos — ABF
- Projecao 2026: +8% a +10% — ABF
- Selic: 14,6% a.a. — BCB | ICC: 127 pontos — BCB/FGV
- Endividamento familias: 75,7% — BCB | Desemprego: 5,4% — IBGE"""

PROMPTS = {
    "educacional": f"""Crie carrossel "Voce sabia?" sobre franchising brasileiro. 7 slides.
{DADOS_CONTEXTO}
Slide 1: Capa com dado impactante. Slides 2-5: cada slide uma ideia com dado e fonte. Slide 6: contexto macro. Slide 7: encerramento.
Retorne JSON: {{"titulo": "...", "hashtags": "5 hashtags", "slides": [{{"numero": 1, "badge": "VOCE SABIA?", "titulo_slide": "...", "conteudo": "2-3 frases", "dado_destaque": "R$ 301,7 bi", "fonte": "ABF 2025"}}]}}""",

    "verdade_mito": f"""Crie carrossel "Verdade ou Mito?" sobre franquias. 7 slides.
{DADOS_CONTEXTO}
Slide 1: afirmacao polemica. Slide 2: revelar + dado real. Slides 3-5: contexto. Slide 6: impacto para investidor. Slide 7: encerramento.
Retorne JSON: {{"titulo": "...", "hashtags": "5 hashtags", "slides": [...]}}""",

    "ranking": f"""Crie carrossel "Top 5" sobre segmentos de franquias. 7 slides.
{DADOS_CONTEXTO}
Slide 1: capa "Top 5..." com dado total. Slides 2-6: um item por slide com posicao e dado. Slide 7: encerramento.
Retorne JSON: {{"titulo": "...", "hashtags": "5 hashtags", "slides": [...]}}""",

    "noticia_analise": f"""Crie carrossel "O que ninguem contou" sobre franchising. 7 slides.
{DADOS_CONTEXTO}
Slide 1: manchete impactante. Slide 2: dado exclusivo. Slides 3-5: analise com dados. Slide 6: impacto. Slide 7: encerramento.
Retorne JSON: {{"titulo": "...", "hashtags": "5 hashtags", "slides": [...]}}""",

    "pratico": f"""Crie carrossel pratico "5 coisas para saber antes de abrir uma franquia". 7 slides.
{DADOS_CONTEXTO}
Slide 1: capa provocativa. Slides 2-6: dica acionavel com dado de suporte. Slide 7: encerramento.
Retorne JSON: {{"titulo": "...", "hashtags": "5 hashtags", "slides": [...]}}""",
}


def gerar_carrossel(tipo="educacional"):
    if not ANTHROPIC_API_KEY:
        print("ERRO: ANTHROPIC_API_KEY nao configurada.")
        return None

    if tipo not in PROMPTS:
        print(f"Tipo invalido: {tipo}. Opcoes: {', '.join(PROMPTS.keys())}")
        return None

    print(f"Gerando carrossel tipo '{tipo}'...")
    init_db()

    try:
        req_data = json.dumps({
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 3000,
            "system": "Voce e editor do Mercado Franquia. Retorne APENAS JSON valido sem markdown.",
            "messages": [{"role": "user", "content": PROMPTS[tipo]}],
        }).encode("utf-8")

        req = Request(
            "https://api.anthropic.com/v1/messages",
            data=req_data,
            headers={"content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
            method="POST",
        )

        try:
            with urlopen(req, timeout=90, context=SSL_CTX) as resp:
                result = json.loads(resp.read().decode("utf-8"))
        except HTTPError as e:
            print(f"API HTTP {e.code}: {e.read().decode()[:200]}")
            return None

        raw = re.sub(r"```json|```", "", result["content"][0]["text"]).strip()
        dados = json.loads(raw)
        slides = dados.get("slides", [])

        # Renderizar HTML de cada slide
        for s in slides:
            s["html"] = render_slide(s, len(slides))

        # Salvar no banco
        conn = get_conn()
        conn.execute(
            "INSERT INTO carrosseis_instagram(tipo, titulo, slides_json, hashtags, design) VALUES(?,?,?,?,?)",
            (tipo, dados.get("titulo", ""), json.dumps(slides, ensure_ascii=False), dados.get("hashtags", ""), "misto"),
        )
        conn.commit()
        carrossel_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.close()

        print(f"OK — {len(slides)} slides gerados. ID: {carrossel_id}")
        print(f"Titulo: {dados.get('titulo')}")
        return carrossel_id

    except Exception as e:
        print(f"ERRO: {e}")
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera carrossel Instagram")
    parser.add_argument("--tipo", type=str, default="educacional", choices=list(PROMPTS.keys()))
    args = parser.parse_args()
    gerar_carrossel(tipo=args.tipo)
