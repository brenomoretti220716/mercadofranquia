"""
Processa notícias raw com Claude AI — gera título, conteúdo editorial e classificação.

Uso:
  python3 api/scrapers/processar_noticias.py --limite 3
"""

import argparse
import json
import os
import re
import ssl
import sys
import time
from datetime import datetime
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

SYSTEM_PROMPT = """Voce e editor-chefe do Mercado Franquia, maior portal de inteligencia do franchising brasileiro.
Reescreva a noticia com voz editorial propria, linguagem profissional e objetiva.
Quando relevante, adicione contexto dos dados do setor brasileiro:
- Faturamento 2025: R$ 301,7 bi (+10,5%)
- Lider: Saude/Beleza com R$ 74,3 bi
- 202.444 unidades ativas, 3.297 redes
- 1,8 mi empregos diretos
- Projecao 2026: +8% a +10%
Se a noticia for em ingles, traduza e adapte para o contexto brasileiro.
Identifique o segmento ABF relacionado entre: Alimentacao-FS, Alimentacao-CD, Saude/Beleza, Moda, Educacao, Casa e Construcao, Hotelaria e Turismo, Servicos Automotivos, Comunicacao/TI, Entretenimento e Lazer, Limpeza e Conservacao, Servicos e Outros Negocios.
Retorne APENAS um JSON valido: {"titulo": "...", "conteudo": "... (400-600 palavras)", "resumo": "... (2 frases)", "segmento": "...", "tags": ["tag1", "tag2", "tag3"], "relevancia": 7}"""


def processar(limite=10):
    if not ANTHROPIC_API_KEY:
        print("ERRO: ANTHROPIC_API_KEY nao configurada. Defina a variavel de ambiente.")
        return 0

    conn = get_conn()
    pendentes = conn.execute(
        "SELECT id, titulo, conteudo_bruto, resumo_bruto, idioma FROM noticias_raw WHERE processado = 0 ORDER BY created_at DESC LIMIT ?",
        (limite,),
    ).fetchall()
    conn.close()

    if not pendentes:
        print("Nenhuma noticia pendente para processar.")
        return 0

    print(f"\n{'='*60}")
    print(f"  Processando {len(pendentes)} noticias com IA")
    print(f"{'='*60}\n")

    processados = 0
    erros = 0

    for row in pendentes:
        raw_id = row["id"]
        titulo = row["titulo"]
        conteudo = row["conteudo_bruto"] or row["resumo_bruto"] or ""
        idioma = row["idioma"]

        print(f"  [{processados + erros + 1}/{len(pendentes)}] {titulo[:60]}...")

        user_msg = f"Titulo original: {titulo}\nIdioma: {idioma}\nConteudo: {conteudo[:2000]}"

        try:
            req_data = json.dumps({
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1500,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_msg}],
            }).encode("utf-8")

            req = Request(
                "https://api.anthropic.com/v1/messages",
                data=req_data,
                headers={
                    "content-type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
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

            conn = get_conn()
            conn.execute(
                """INSERT INTO noticias_fila(raw_id, titulo_gerado, conteudo_gerado, resumo, segmento, tags, relevancia, status)
                   VALUES(?,?,?,?,?,?,?,?)""",
                (
                    raw_id,
                    dados.get("titulo", titulo),
                    dados.get("conteudo", ""),
                    dados.get("resumo", ""),
                    dados.get("segmento", ""),
                    json.dumps(dados.get("tags", []), ensure_ascii=False),
                    dados.get("relevancia", 5),
                    "pendente",
                ),
            )
            conn.execute("UPDATE noticias_raw SET processado = 1 WHERE id = ?", (raw_id,))
            conn.commit()
            conn.close()

            processados += 1
            print(f"    OK — segmento: {dados.get('segmento')}, relevancia: {dados.get('relevancia')}")

        except Exception as e:
            erros += 1
            print(f"    ERRO: {str(e)[:80]}")
            conn = get_conn()
            conn.execute("UPDATE noticias_raw SET processado = -1 WHERE id = ?", (raw_id,))
            conn.commit()
            conn.close()

        time.sleep(2)

    print(f"\n{'='*60}")
    print(f"  Processados: {processados} | Erros: {erros}")
    print(f"{'='*60}\n")
    return processados


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Processa noticias com IA")
    parser.add_argument("--limite", type=int, default=10, help="Limite de noticias")
    args = parser.parse_args()
    processar(limite=args.limite)
