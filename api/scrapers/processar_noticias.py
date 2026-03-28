"""
Processa notícias raw com Claude AI — gera artigos SEO completos.

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

SYSTEM_PROMPT = """Voce e editor-chefe do Mercado Franquia, portal de inteligencia do franchising brasileiro.
Escreva no padrao editorial The Economist (rigor de dados) + Endeavor Brasil (acessivel ao empreendedor) + Inc. Magazine (franchising pratico).

REGRAS EDITORIAIS OBRIGATORIAS:

1. TITULO: tese clara em 60-70 chars. Nao use verbos fracos ('saiba como', 'veja'). Use afirmacoes diretas ou perguntas provocativas.
   BOM: 'Saude e Beleza Cresce 3x Acima do Varejo — e a Tendencia Nao Para'
   RUIM: 'Saiba como investir em franquias de saude em 2026'

2. PRIMEIRO PARAGRAFO: dado numerico de impacto + contexto em 2-3 frases. Sem rodeios.
   BOM: 'O segmento de Saude e Beleza faturou R$ 74,3 bilhoes em 2025 (ABF, mar/2026) — crescimento de 14,6%, o dobro da media do setor.'
   RUIM: 'O mercado de franquias e um setor muito importante para a economia brasileira...'

3. FONTES EXPLICITAS em todo dado numerico:
   - Dados ABF: '(ABF, Pesquisa de Desempenho 2025)'
   - Dados BCB: '(Banco Central, fev/2026)'
   - Dados IBGE: '(IBGE, PMC jan/2026)'
   - Nunca usar 'segundo especialistas' sem nomear

4. ESTRUTURA (600-800 palavras):
   - Lead (2 paragrafos): dado de impacto + contexto + por que importa agora
   - 3-4 secoes com subtitulos H2 descritivos (nao vagos como 'O Cenario Atual')
   - 1 secao obrigatoria 'O Que Dizem os Dados Macro' cruzando com BCB/IBGE quando relevante
   - Conclusao (1 paragrafo): o que o investidor/franqueado deve observar — sem CTA generico

5. TOM: analitico, direto, sem adjetivos desnecessarios. Nao use 'incrivel', 'fantastico', 'revolucionario'.

6. CONTEXTO DE DADOS (usar quando relevante):
   - Faturamento franchising 2025: R$ 301,7 bi (+10,5%) — ABF
   - Lider: Saude/Beleza R$ 74,3 bi (+14,6%) — ABF
   - Limpeza/Conservacao: maior crescimento 2025 (+16,8%) — ABF
   - 202.444 unidades, 3.297 redes, 1,8 mi empregos — ABF
   - Projecao 2026: +8% a +10% — ABF
   - Selic: 14,6% a.a. — BCB
   - ICC: 127 pontos (favoravel) — BCB/FGV
   - Endividamento familias: 75,7% da renda — BCB
   - Desemprego: 5,4% (minima historica) — BCB/IBGE

Se a noticia for em ingles, traduza e adapte para o contexto brasileiro.
Identifique o segmento ABF: Alimentacao-FS, Alimentacao-CD, Saude/Beleza, Moda, Educacao, Casa e Construcao, Hotelaria e Turismo, Servicos Automotivos, Comunicacao/TI, Entretenimento e Lazer, Limpeza e Conservacao, Servicos e Outros Negocios.

Retorne APENAS JSON valido (sem markdown, sem codigo):
{"titulo": "tese direta 60-70 chars", "titulo_h1": "mais longo e chamativo", "conteudo": "HTML 600-800 palavras com h2 descritivos, p, strong para dados-chave", "resumo": "2 frases impactantes max 150 chars", "meta_description": "155 chars com palavra-chave", "segmento": "...", "tags": ["5-7 tags"], "palavra_chave_principal": "...", "imagem_prompt": "descricao em ingles para geracao de imagem", "relevancia": 7, "fontes_usadas": [{"nome": "ABF", "tipo": "relatorio", "dado": "faturamento R$ 301,7 bi", "periodo": "2025", "citacao": "(ABF, 2025)"}]}"""


def processar(limite=10):
    if not ANTHROPIC_API_KEY:
        print("ERRO: ANTHROPIC_API_KEY nao configurada.")
        return 0

    conn = get_conn()
    pendentes = conn.execute(
        "SELECT id, titulo, conteudo_bruto, resumo_bruto, idioma, fonte FROM noticias_raw WHERE processado = 0 ORDER BY created_at DESC LIMIT ?",
        (limite,),
    ).fetchall()
    conn.close()

    if not pendentes:
        print("Nenhuma noticia pendente.")
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

        user_msg = f"Titulo original: {titulo}\nIdioma: {idioma}\nConteudo: {conteudo[:3000]}"

        try:
            req_data = json.dumps({
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 4000,
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
                with urlopen(req, timeout=90, context=SSL_CTX) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
            except HTTPError as http_err:
                body = http_err.read().decode("utf-8", errors="ignore")
                print(f"    API HTTP {http_err.code}: {body[:300]}")
                raise Exception(f"API HTTP {http_err.code}")

            raw_text = result["content"][0]["text"]
            raw_text = re.sub(r"```json|```", "", raw_text).strip()
            dados = json.loads(raw_text)

            fonte_original = row["fonte"] if "fonte" in row.keys() else ""

            conn = get_conn()
            conn.execute(
                """INSERT INTO noticias_fila(raw_id, titulo_gerado, conteudo_gerado, resumo, meta_description, palavra_chave, imagem_prompt, segmento, tags, relevancia, status, status_editorial, fontes_usadas, fonte_original)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    raw_id,
                    dados.get("titulo_h1") or dados.get("titulo", titulo),
                    dados.get("conteudo", ""),
                    dados.get("resumo", ""),
                    dados.get("meta_description", ""),
                    dados.get("palavra_chave_principal", ""),
                    dados.get("imagem_prompt", ""),
                    dados.get("segmento", ""),
                    json.dumps(dados.get("tags", []), ensure_ascii=False),
                    dados.get("relevancia", 5),
                    "pendente",
                    "revisao",
                    json.dumps(dados.get("fontes_usadas", []), ensure_ascii=False),
                    fonte_original,
                ),
            )
            conn.execute("UPDATE noticias_raw SET processado = 1 WHERE id = ?", (raw_id,))
            conn.commit()
            conn.close()

            palavras = len(dados.get("conteudo", "").split())
            processados += 1
            print(f"    OK — {palavras} palavras | seg: {dados.get('segmento')} | rel: {dados.get('relevancia')}")

        except Exception as e:
            erros += 1
            print(f"    ERRO: {str(e)[:100]}")
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
