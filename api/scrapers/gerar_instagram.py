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
from urllib.request import urlopen, Request
from urllib.error import HTTPError

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


CARD_TEMPLATES = {
    "dado_principal": """<div style="width:1080px;height:1080px;background:linear-gradient(180deg,#0D0D0D 0%,#1A1A1A 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;padding:80px;box-sizing:border-box">
<div style="color:#666;font-size:16px;text-transform:uppercase;letter-spacing:4px;margin-bottom:60px">Mercado Franquia</div>
<div style="color:#E8421A;font-size:90px;font-weight:800;text-align:center;line-height:1.1">{dado}</div>
<div style="color:#CCC;font-size:26px;margin-top:30px;text-align:center">{subtexto}</div>
<div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:#E8421A"></div>
</div>""",

    "citacao": """<div style="width:1080px;height:1080px;background:linear-gradient(180deg,#0D0D0D 0%,#1A1A1A 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;padding:80px;box-sizing:border-box">
<div style="color:#666;font-size:16px;text-transform:uppercase;letter-spacing:4px;margin-bottom:40px">Mercado Franquia</div>
<div style="color:#E8421A;font-size:120px;line-height:0.6;margin-bottom:20px">"</div>
<div style="color:#FFF;font-size:32px;text-align:center;line-height:1.4;max-width:800px;font-style:italic">{dado}</div>
<div style="color:#888;font-size:20px;margin-top:30px">{subtexto}</div>
<div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:#E8421A"></div>
</div>""",

    "pergunta": """<div style="width:1080px;height:1080px;background:linear-gradient(180deg,#0D0D0D 0%,#1A1A1A 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;padding:80px;box-sizing:border-box">
<div style="color:#666;font-size:16px;text-transform:uppercase;letter-spacing:4px;margin-bottom:40px">Mercado Franquia</div>
<div style="color:#E8421A;font-size:100px;font-weight:800;margin-bottom:20px">?</div>
<div style="color:#FFF;font-size:36px;text-align:center;line-height:1.3;max-width:800px;font-weight:600">{dado}</div>
<div style="color:#888;font-size:22px;margin-top:30px;text-align:center">{subtexto}</div>
<div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:#E8421A"></div>
</div>""",

    "chart": """<div style="width:1080px;height:1080px;background:linear-gradient(180deg,#0D0D0D 0%,#1A1A1A 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;padding:80px;box-sizing:border-box">
<div style="color:#666;font-size:16px;text-transform:uppercase;letter-spacing:4px;margin-bottom:60px">Mercado Franquia</div>
<div style="color:#E8421A;font-size:60px;font-weight:800;text-align:center">{dado}</div>
<div style="width:600px;height:8px;background:#333;border-radius:4px;margin:30px 0"><div style="width:70%;height:100%;background:#E8421A;border-radius:4px"></div></div>
<div style="color:#888;font-size:28px;text-align:center">{subtexto}</div>
<div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:#E8421A"></div>
</div>""",
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
                template = CARD_TEMPLATES.get(tipo, CARD_TEMPLATES["dado_principal"])
                card_html = template.replace("{dado}", dado).replace("{subtexto}", sub)

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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera posts Instagram")
    parser.add_argument("--limite", type=int, default=5, help="Limite de noticias")
    args = parser.parse_args()
    gerar_posts(limite=args.limite)
