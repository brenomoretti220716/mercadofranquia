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
from scrapers.gerar_grafico import gerar_graficos

GRAFICOS_DIR = Path(__file__).parent.parent / "static" / "graficos"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """Voce e editor-chefe do Mercado Franquia, portal de inteligencia do franchising brasileiro.
Padrao editorial: The Economist (rigor de dados) + Endeavor Brasil (acessivel ao empreendedor) + Inc. Magazine (franchising pratico).

===============================================
REGRAS EDITORIAIS OBRIGATORIAS
===============================================

1. TITULO
- Tese clara em 60-70 caracteres
- Proibido: 'saiba como', 'veja', 'conheca', 'descubra'
- Use afirmacoes diretas ou perguntas provocativas
BOM: 'Saude e Beleza Cresce 3x Acima do Varejo — e a Tendencia Nao Para'
RUIM: 'Saiba como investir em franquias de saude em 2026'

2. ESTRUTURA OBRIGATORIA DO ARTIGO (600-800 palavras)
Siga EXATAMENTE esta ordem:

[PARAGRAFO 1 — GANCHO]
Maximo 1 dado numerico forte + contexto direto. Sem acumular multiplos numeros.
BOM: 'O franchising brasileiro gerou 1,8 milhao de empregos diretos em 2025 — crescimento de 5,8% sobre o ano anterior (ABF).'
RUIM: 'Com R$ 301,7 bi (+10,5%), 202.444 unidades, 3.297 redes e Selic a 14,6%, o setor...'

[PARAGRAFO 2 — CONTEXTO]
Por que isso importa agora. Conexao com cenario macro ou tendencia.

[MARCADOR: {{GRAFICO_1}}]
Grafico de maior impacto — comparacao principal ou dado mais forte da noticia.

[SECAO 1 — H2 DESCRITIVO]
Explicacao do metodo, tendencia ou fato principal.
Subtitulo deve ser uma afirmacao, nao um tema vago.
BOM: 'Treinamento Intensivo Reduz Rotatividade em 23%'
RUIM: 'O Modelo de Negocio'

[MARCADOR: {{GRAFICO_2}}]
Grafico de prova ou detalhe secundario.

[SECAO 2 — H2 DESCRITIVO]
Desenvolvimento. Inclua OBRIGATORIAMENTE um contraponto ou limitacao.
Ex: 'Por outro lado, o modelo exige maior investimento inicial e disciplina operacional...'

[SECAO 3 — 'O Que Dizem os Dados Macro']
Cruzamento com BCB/IBGE/ABF quando relevante.

[MARCADOR: {{GRAFICO_3}}]
Grafico macro do setor (faturamento, empregos, crescimento).

[CONCLUSAO]
O que o investidor/franqueado deve observar. Sem CTA generico. Sem repetir o que ja foi dito.

3. FONTES — QUALIFICACAO OBRIGATORIA
- Dados ABF verificaveis: '(ABF, Pesquisa de Desempenho 2025)'
- Dados BCB: '(Banco Central, fev/2026)'
- Dados IBGE: '(IBGE, PMC jan/2026)'
- Dados internos de empresas: '(dados internos [empresa], nao auditados externamente)'
- Estimativas setoriais: '(estimativa setorial, sem auditoria independente)'
- NUNCA escrever 'segundo especialistas' sem nomear a fonte

4. TOM
- Analitico, direto, sem adjetivos superfluos
- Proibido: 'incrivel', 'fantastico', 'revolucionario', 'transformador'
- CONTRAPONTO OBRIGATORIO: toda noticia deve ter pelo menos uma limitacao, risco ou visao critica
- EVITAR repeticao conceitual: nao diga a mesma ideia com palavras diferentes em secoes distintas

5. DADOS DE CONTEXTO (usar quando relevante)
- Faturamento franchising 2025: R$ 301,7 bi (+10,5%) — ABF
- Lider: Saude/Beleza R$ 74,3 bi (+14,6%) — ABF
- Maior crescimento 2025: Limpeza/Conservacao (+16,8%) — ABF
- 202.444 unidades, 3.297 redes, 1,8 mi empregos diretos — ABF
- Projecao 2026: +8% a +10% — ABF
- Selic: 14,6% a.a. — BCB mar/2026
- ICC: 127 pontos (favoravel) — BCB/FGV
- Endividamento familias: 75,7% da renda — BCB
- Desemprego: 5,4% (minima historica) — BCB/IBGE

6. SEGMENTO ABF
Identifique: Alimentacao-FS, Alimentacao-CD, Saude/Beleza, Moda, Educacao, Casa e Construcao, Hotelaria e Turismo, Servicos Automotivos, Comunicacao/TI, Entretenimento e Lazer, Limpeza e Conservacao, Servicos e Outros Negocios.
Se a noticia for em ingles, traduza e adapte para o contexto brasileiro.

7. GRAFICOS — CRITERIO RIGOROSO
Gere APENAS graficos que acrescentam evidencia direta ao argumento da noticia.

REGRAS:
- Maximo 3, minimo 0
- So gere grafico se tiver dado quantitativo real para mostrar
- GRAFICO 1 (posicao=1): apenas se a noticia tiver comparacao ou dado de impacto proprio — use tipo comparacao ou barras_simples com dados extraidos do texto
- GRAFICO 2 (posicao=2): apenas se houver segundo dado relevante diferente do primeiro
- GRAFICO 3 (posicao=3): apenas se a noticia mencionar crescimento do setor, empregos ou faturamento — use faturamento_total ou indicadores do banco ABF
- Use [] se a noticia for sobre evento, inauguracao, premiacao sem dados quantitativos relevantes
- NUNCA gere grafico generico so para preencher espaco
- NUNCA repita o mesmo tipo de dado em dois graficos diferentes

Tipos disponiveis:
- comparacao | barras_simples | linha_temporal: dados extraidos do TEXTO DA NOTICIA
- faturamento_segmento | faturamento_total | ranking | indicadores: buscam dados do banco ABF automaticamente

Cada grafico deve ter:
- tipo, titulo (afirmacao direta), subtitulo (opcional), fonte (citacao explicita)
- dados: lista de {label, valor} quando tipo for comparacao/barras_simples/linha_temporal
- unidade: %, R$ bi, unidades, etc.
- posicao: 1, 2 ou 3

TITULOS DOS GRAFICOS: provocativos, nao descritivos.
BOM: "Franchising Cresce Mesmo com Selic Alta — Mas Risco Operacional Sobe"
RUIM: "Faturamento do Franchising 2014-2025"

INTERPRETACAO OBRIGATORIA: apos cada marcador {{GRAFICO_N}} no HTML, inclua:
<p class="grafico-interpretacao"><strong>O que isso significa:</strong> [direcionamento estrategico direto para o investidor/franqueado — o que ele deve fazer ou observar com base nesse dado. Maximo 2 frases. Tom analitico, nao didatico.]</p>

===============================================
RETORNE APENAS JSON VALIDO (sem markdown):
===============================================
{
  "titulo": "tese direta 60-70 chars",
  "titulo_h1": "mais longo e chamativo",
  "conteudo": "HTML 600-800 palavras com marcadores {{GRAFICO_1}} {{GRAFICO_2}} {{GRAFICO_3}} nas posicoes corretas",
  "resumo": "2 frases impactantes max 150 chars",
  "meta_description": "155 chars com palavra-chave",
  "segmento": "...",
  "tags": ["5-7 tags"],
  "palavra_chave_principal": "...",
  "imagem_prompt": "Reuters/AFP editorial photograph for THIS specific story. Focus on ENVIRONMENT and OBJECTS in action. Lighting must match scene energy. NO TEXT NO LOGOS.",
  "relevancia": 7,
  "fontes_usadas": [{"nome": "ABF", "tipo": "relatorio", "dado": "faturamento R$ 301,7 bi", "periodo": "2025", "citacao": "(ABF, 2025)"}],
  "graficos": [
    {
      "tipo": "comparacao",
      "titulo": "Expansao Estruturada Supera Modelo Tradicional em 40%",
      "subtitulo": "Crescimento relativo por modelo de expansao",
      "fonte": "Dados internos BrandONE, nao auditados externamente",
      "dados": [{"label": "Estruturado", "valor": 140}, {"label": "Tradicional", "valor": 100}],
      "unidade": "indice base 100",
      "posicao": 1
    }
  ]
}"""


def _chamar_claude(titulo: str, idioma: str, conteudo: str, instrucao: str | None = None) -> dict:
    """Chama Claude API e retorna o JSON parseado."""
    user_msg = f"Titulo original: {titulo}\nIdioma: {idioma}\nConteudo: {conteudo[:3000]}"
    if instrucao:
        user_msg += f"\n\nINSTRUCAO DO EDITOR: {instrucao}"

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
        raise Exception(f"API HTTP {http_err.code}: {body[:300]}")

    raw_text = result["content"][0]["text"]
    raw_text = re.sub(r"```json|```", "", raw_text).strip()
    return json.loads(raw_text)


def _processar_graficos(fila_id: int, conteudo_html: str, graficos_config: list) -> tuple[str, int]:
    """Gera gráficos e substitui marcadores no HTML. Retorna (html_atualizado, qtd_gerados)."""
    graficos_gerados = 0

    if graficos_config and fila_id:
        urls = gerar_graficos(fila_id, graficos_config)
        for posicao, url in urls.items():
            marcador = f"{{{{GRAFICO_{posicao}}}}}"
            tag = f'<div class="grafico-inline" data-grafico="{url}"></div>'
            conteudo_html = conteudo_html.replace(marcador, tag)
            graficos_gerados += 1

        if graficos_gerados > 0:
            primeira_url = next(iter(urls.values()))
            conn = get_conn()
            conn.execute(
                "UPDATE noticias_fila SET grafico_url = ?, conteudo_gerado = ? WHERE id = ?",
                (primeira_url, conteudo_html, fila_id),
            )
            conn.commit()
            conn.close()

    # Remove marcadores não usados
    conteudo_limpo = re.sub(r"\{\{GRAFICO_\d+\}\}", "", conteudo_html)
    if conteudo_limpo != conteudo_html:
        conteudo_html = conteudo_limpo
        conn = get_conn()
        conn.execute("UPDATE noticias_fila SET conteudo_gerado = ? WHERE id = ?", (conteudo_limpo, fila_id))
        conn.commit()
        conn.close()

    return conteudo_html, graficos_gerados


def _limpar_graficos_antigos(noticia_id: int):
    """Remove SVGs antigos de uma notícia."""
    import glob
    padrao = str(GRAFICOS_DIR / f"grafico_{noticia_id}_*.svg")
    for f in glob.glob(padrao):
        try:
            os.remove(f)
        except Exception:
            pass


def reprocessar_noticia(noticia_id: int, instrucao: str | None = None) -> bool:
    """
    Reprocessa uma notícia existente na fila.
    Busca o raw original, chama Claude, atualiza o registro e regera gráficos.
    Retorna True se sucesso, False se erro.
    """
    if not ANTHROPIC_API_KEY:
        print("ERRO: ANTHROPIC_API_KEY nao configurada.")
        return False

    conn = get_conn()
    fila = conn.execute("SELECT raw_id, versao FROM noticias_fila WHERE id = ?", (noticia_id,)).fetchone()
    if not fila:
        conn.close()
        print(f"  Notícia {noticia_id} não encontrada na fila.")
        return False

    raw = conn.execute(
        "SELECT id, titulo, conteudo_bruto, resumo_bruto, idioma, fonte FROM noticias_raw WHERE id = ?",
        (fila["raw_id"],),
    ).fetchone()
    conn.close()

    if not raw:
        print(f"  Raw {fila['raw_id']} não encontrado.")
        return False

    titulo = raw["titulo"]
    conteudo = raw["conteudo_bruto"] or raw["resumo_bruto"] or ""
    idioma = raw["idioma"]

    print(f"  [Reprocessando] {titulo[:60]}...")

    try:
        dados = _chamar_claude(titulo, idioma, conteudo, instrucao)
        conteudo_html = dados.get("conteudo", "")

        # Limpa gráficos antigos
        _limpar_graficos_antigos(noticia_id)

        versao = (fila["versao"] or 1) + 1
        conn = get_conn()
        conn.execute(
            """UPDATE noticias_fila SET
                titulo_gerado = ?, conteudo_gerado = ?, resumo = ?, meta_description = ?,
                palavra_chave = ?, imagem_prompt = ?, segmento = ?, tags = ?,
                relevancia = ?, fontes_usadas = ?, graficos = ?, versao = ?, grafico_url = NULL,
                status_editorial = 'revisao'
            WHERE id = ?""",
            (
                dados.get("titulo_h1") or dados.get("titulo", titulo),
                conteudo_html,
                dados.get("resumo", ""),
                dados.get("meta_description", ""),
                dados.get("palavra_chave_principal", ""),
                dados.get("imagem_prompt", ""),
                dados.get("segmento", ""),
                json.dumps(dados.get("tags", []), ensure_ascii=False),
                dados.get("relevancia", 5),
                json.dumps(dados.get("fontes_usadas", []), ensure_ascii=False),
                json.dumps(dados.get("graficos", []), ensure_ascii=False),
                versao,
                noticia_id,
            ),
        )
        conn.commit()
        conn.close()

        # Gerar novos gráficos
        graficos_config = dados.get("graficos", [])
        conteudo_html, graficos_gerados = _processar_graficos(noticia_id, conteudo_html, graficos_config)

        palavras = len(dados.get("conteudo", "").split())
        graf_info = f" | graf: {graficos_gerados}" if graficos_gerados else ""
        print(f"    OK v{versao} — {palavras} palavras | seg: {dados.get('segmento')}{graf_info}")
        return True

    except Exception as e:
        print(f"    ERRO reprocessando {noticia_id}: {str(e)[:100]}")
        return False


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

        try:
            dados = _chamar_claude(titulo, idioma, conteudo)

            fonte_original = row["fonte"] if "fonte" in row.keys() else ""
            conteudo_html = dados.get("conteudo", "")

            graficos_config = dados.get("graficos", [])

            conn = get_conn()
            conn.execute(
                """INSERT INTO noticias_fila(raw_id, titulo_gerado, conteudo_gerado, resumo, meta_description, palavra_chave, imagem_prompt, segmento, tags, relevancia, status, status_editorial, fontes_usadas, fonte_original, graficos)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    raw_id,
                    dados.get("titulo_h1") or dados.get("titulo", titulo),
                    conteudo_html,
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
                    json.dumps(graficos_config, ensure_ascii=False),
                ),
            )
            fila_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            conn.execute("UPDATE noticias_raw SET processado = 1 WHERE id = ?", (raw_id,))
            conn.commit()
            conn.close()

            # Gerar gráficos
            conteudo_html, graficos_gerados = _processar_graficos(fila_id, conteudo_html, graficos_config)

            palavras = len(dados.get("conteudo", "").split())
            processados += 1
            graf_info = f" | graf: {graficos_gerados}" if graficos_gerados else ""
            print(f"    OK — {palavras} palavras | seg: {dados.get('segmento')} | rel: {dados.get('relevancia')}{graf_info}")

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
