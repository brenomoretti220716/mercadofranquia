"""
Gera gráficos editoriais SVG para inserção inline nas notícias.

Tipos do banco ABF (dados automáticos):
  - faturamento_segmento: linha temporal de um segmento ABF
  - faturamento_total: barras do faturamento total por ano
  - ranking: barras horizontais top 5 marcas
  - indicadores: linha de empregos diretos ao longo do tempo

Tipos do texto da notícia (dados do Claude):
  - comparacao: barras verticais comparando categorias
  - barras_simples: barras verticais simples
  - linha_temporal: linha com pontos ao longo do tempo
"""

import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from database import get_conn

GRAFICOS_DIR = Path(__file__).parent.parent / "static" / "graficos"
GRAFICOS_DIR.mkdir(parents=True, exist_ok=True)

COR_PRINCIPAL = "#D94F2B"
COR_SECUNDARIA = "#F4A261"
COR_FUNDO = "#FAFAFA"
COR_TEXTO = "#333333"
COR_GRID = "#E0E0E0"
CORES_MULTI = ["#D94F2B", "#F4A261", "#2A9D8F", "#264653", "#E76F51", "#606C38"]


def _setup_style():
    """Configura estilo limpo para todos os gráficos."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    plt.rcParams.update({
        "figure.facecolor": COR_FUNDO,
        "axes.facecolor": COR_FUNDO,
        "axes.edgecolor": COR_GRID,
        "axes.labelcolor": COR_TEXTO,
        "xtick.color": COR_TEXTO,
        "ytick.color": COR_TEXTO,
        "font.family": "sans-serif",
        "font.size": 10,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.grid": True,
        "grid.color": COR_GRID,
        "grid.alpha": 0.5,
    })
    return plt


def _fmt_bilhoes(valor_mm):
    """Converte milhões para bilhões formatado."""
    return f"R$ {valor_mm / 1000:.1f} bi"


def _ordem_periodo(periodo: str) -> int:
    """Converte período (ex: '1T2022', '2025') para valor numérico para ordenação."""
    m = re.match(r"(\d)T(\d{4})", periodo)
    if m:
        return int(m.group(2)) * 10 + int(m.group(1))
    m = re.match(r"(\d{4})", periodo)
    if m:
        return int(m.group(1)) * 10
    return 0


def _salvar_svg(fig, plt, noticia_id: int, posicao: int) -> str:
    """Salva SVG e retorna URL relativa."""
    filepath = GRAFICOS_DIR / f"grafico_{noticia_id}_{posicao}.svg"
    fig.savefig(filepath, format="svg", bbox_inches="tight")
    plt.close(fig)
    return f"/static/graficos/grafico_{noticia_id}_{posicao}.svg"


def _add_subtitle(ax, titulo: str, subtitulo: str | None = None, fonte: str | None = None):
    """Adiciona título, subtítulo e fonte ao gráfico."""
    ax.set_title(titulo, fontsize=12, fontweight="bold", color=COR_TEXTO, pad=12)
    if subtitulo:
        ax.text(0.5, 1.02, subtitulo, transform=ax.transAxes, ha="center", fontsize=9, color="#888")
    if fonte:
        ax.figure.text(0.99, 0.01, fonte, ha="right", fontsize=7, color="#AAA", style="italic")


# ── Tipos do banco ABF ──────────────────────────────────────────────────


def gerar_faturamento_segmento(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    plt = _setup_style()
    segmento = cfg.get("segmento", "") or "Total"
    conn = get_conn()
    rows = conn.execute(
        "SELECT periodo, valor_mm FROM faturamento WHERE segmento LIKE ? AND tipo_dado IN ('anual', '12m_acumulado')",
        (f"%{segmento}%",),
    ).fetchall()
    conn.close()

    if len(rows) < 2:
        return None

    rows_sorted = sorted(rows, key=lambda r: _ordem_periodo(r["periodo"]))
    if len(rows_sorted) > 10:
        rows_sorted = rows_sorted[-10:]
    periodos = [r["periodo"] for r in rows_sorted]
    valores = [r["valor_mm"] for r in rows_sorted]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(periodos, valores, color=COR_PRINCIPAL, linewidth=2.5, marker="o", markersize=6)
    ax.fill_between(range(len(periodos)), valores, alpha=0.1, color=COR_PRINCIPAL)
    for i, v in enumerate(valores):
        ax.annotate(_fmt_bilhoes(v), (i, v), textcoords="offset points", xytext=(0, 10), ha="center", fontsize=8, color=COR_TEXTO)
    ax.set_xticks(range(len(periodos)))
    ax.set_xticklabels(periodos, fontsize=9)
    ax.set_ylabel("Faturamento (R$ milhões)", fontsize=9)
    _add_subtitle(ax, cfg.get("titulo", f"Faturamento — {segmento}"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


def gerar_faturamento_total(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    from matplotlib.ticker import FuncFormatter
    plt = _setup_style()

    conn = get_conn()
    rows = conn.execute(
        "SELECT periodo, SUM(valor_mm) as total FROM faturamento WHERE tipo_dado = 'anual' GROUP BY periodo",
    ).fetchall()
    conn.close()

    rows_anos = [r for r in rows if re.match(r"^\d{4}$", r["periodo"])]
    rows_anos.sort(key=lambda r: int(r["periodo"]))
    if len(rows_anos) > 7:
        rows_anos = rows_anos[-7:]

    if len(rows_anos) < 2:
        return None

    periodos = [r["periodo"] for r in rows_anos]
    totais = [r["total"] for r in rows_anos]
    ultimo = periodos[-1]
    cores = ["#999" if p == "2020" else COR_PRINCIPAL if p == ultimo else "#E8A090" for p in periodos]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.bar(periodos, totais, color=cores, width=0.6, edgecolor="none")
    for bar, v in zip(bars, totais):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + max(totais) * 0.02, _fmt_bilhoes(v), ha="center", fontsize=8, color=COR_TEXTO)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"R$ {v / 1000:.0f} bi"))
    ax.set_ylabel("Faturamento Total", fontsize=9)

    # Anotações em pontos-chave
    if "2020" in periodos:
        idx_2020 = periodos.index("2020")
        val_2020 = totais[idx_2020]
        ax.annotate("Pandemia", xy=(idx_2020, val_2020), xytext=(idx_2020, val_2020 * 0.85),
                     arrowprops=dict(arrowstyle="->", color="#999"), fontsize=8, color="#999", ha="center")

    ax.annotate("Novo pico", xy=(len(periodos) - 1, totais[-1]),
                xytext=(len(periodos) - 1, totais[-1] + max(totais) * 0.07),
                fontsize=8, fontweight="bold", color=COR_PRINCIPAL, ha="center")

    # Linha de tendência
    import numpy as np
    x = np.arange(len(totais))
    z = np.polyfit(x, totais, 1)
    p = np.poly1d(z)
    ax.plot(periodos, p(x), color="#333", linewidth=1.5, linestyle="--", alpha=0.4)

    _add_subtitle(ax, cfg.get("titulo", "Faturamento Total — Franchising Brasil"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


def gerar_ranking(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    plt = _setup_style()

    conn = get_conn()
    rows = conn.execute(
        "SELECT marca, unidades, segmento FROM ranking WHERE ano = (SELECT MAX(ano) FROM ranking) ORDER BY posicao LIMIT 5",
    ).fetchall()
    conn.close()

    if not rows:
        return None

    marcas = [r["marca"] for r in rows][::-1]
    unidades = [r["unidades"] for r in rows][::-1]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.barh(marcas, unidades, color=COR_PRINCIPAL, height=0.5, edgecolor="none")
    for bar, v in zip(bars, unidades):
        ax.text(bar.get_width() + max(unidades) * 0.02, bar.get_y() + bar.get_height() / 2, f"{v:,}".replace(",", "."), va="center", fontsize=9, color=COR_TEXTO)
    ax.set_xlabel("Unidades", fontsize=9)
    _add_subtitle(ax, cfg.get("titulo", "Top 5 Franquias — Ranking ABF"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


def gerar_indicadores(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    plt = _setup_style()

    conn = get_conn()
    rows = conn.execute(
        "SELECT periodo, empregos_diretos FROM indicadores WHERE empregos_diretos IS NOT NULL",
    ).fetchall()
    conn.close()

    if len(rows) < 2:
        return None

    rows_sorted = sorted(rows, key=lambda r: _ordem_periodo(r["periodo"]))
    periodos = [r["periodo"] for r in rows_sorted]
    empregos = [r["empregos_diretos"] for r in rows_sorted]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(periodos, empregos, color=COR_PRINCIPAL, linewidth=2.5, marker="o", markersize=6)
    ax.fill_between(range(len(periodos)), empregos, alpha=0.1, color=COR_PRINCIPAL)
    for i, v in enumerate(empregos):
        label = f"{v / 1_000_000:.2f}M" if v >= 1_000_000 else f"{v / 1_000:.0f}K"
        ax.annotate(label, (i, v), textcoords="offset points", xytext=(0, 10), ha="center", fontsize=8, color=COR_TEXTO)
    ax.set_xticks(range(len(periodos)))
    ax.set_xticklabels(periodos, fontsize=9, rotation=45, ha="right")
    ax.set_ylabel("Empregos Diretos", fontsize=9)
    _add_subtitle(ax, cfg.get("titulo", "Empregos Diretos — Franchising Brasil"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


# ── Tipos do texto da notícia (dados do Claude) ─────────────────────────


def gerar_comparacao(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    """Barras verticais comparando categorias — dados extraídos do texto."""
    plt = _setup_style()
    dados = cfg.get("dados", [])
    if len(dados) < 2:
        return None

    dados_sorted = sorted(dados, key=lambda d: d["valor"], reverse=True)
    labels = [d["label"] for d in dados_sorted]
    valores = [d["valor"] for d in dados_sorted]
    max_val = max(valores)
    cores = [COR_PRINCIPAL if i == 0 else "#E8A090" for i in range(len(valores))]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.bar(range(len(labels)), valores, color=cores, width=0.6, edgecolor="none")
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=10, fontweight="bold")

    unidade = cfg.get("unidade", "")
    offset = max_val * 0.02
    for bar, v in zip(bars, valores):
        txt = f"{v:,.1f}".replace(",", ".") if isinstance(v, float) else f"{v:,}".replace(",", ".")
        if unidade:
            txt = f"{txt} {unidade}" if not unidade.startswith("R$") else f"{unidade} {txt}"
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + offset, txt, ha="center", va="bottom", fontsize=10, fontweight="bold", color=COR_TEXTO)

    _add_subtitle(ax, cfg.get("titulo", "Comparação"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


def gerar_barras_simples(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    """Barras verticais simples — dados extraídos do texto."""
    plt = _setup_style()
    dados = cfg.get("dados", [])
    if not dados:
        return None

    dados_sorted = sorted(dados, key=lambda d: d["valor"], reverse=True)
    labels = [d["label"] for d in dados_sorted]
    valores = [d["valor"] for d in dados_sorted]
    cores = [COR_PRINCIPAL if i == 0 else "#E8A090" for i in range(len(valores))]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.bar(range(len(labels)), valores, color=cores, width=0.6, edgecolor="none")
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=10, fontweight="bold")

    unidade = cfg.get("unidade", "")
    max_val = max(valores)
    offset = max_val * 0.02
    for bar, v in zip(bars, valores):
        txt = f"{v:,.1f}".replace(",", ".") if isinstance(v, float) else f"{v:,}".replace(",", ".")
        if unidade:
            txt = f"{txt} {unidade}" if not unidade.startswith("R$") else f"{unidade} {txt}"
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + offset, txt, ha="center", va="bottom", fontsize=10, fontweight="bold", color=COR_TEXTO)

    _add_subtitle(ax, cfg.get("titulo", "Dados"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


def gerar_linha_temporal(noticia_id: int, posicao: int, cfg: dict) -> str | None:
    """Linha com pontos ao longo do tempo — dados extraídos do texto."""
    plt = _setup_style()
    dados = cfg.get("dados", [])
    if len(dados) < 2:
        return None

    labels = [d["label"] for d in dados]
    valores = [d["valor"] for d in dados]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(labels, valores, color=COR_PRINCIPAL, linewidth=2.5, marker="o", markersize=6)
    ax.fill_between(range(len(labels)), valores, alpha=0.1, color=COR_PRINCIPAL)

    unidade = cfg.get("unidade", "")
    for i, v in enumerate(valores):
        txt = f"{v:,.1f}".replace(",", ".") if isinstance(v, float) else f"{v:,}".replace(",", ".")
        ax.annotate(txt, (i, v), textcoords="offset points", xytext=(0, 10), ha="center", fontsize=8, color=COR_TEXTO)

    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=9, rotation=45 if len(labels) > 5 else 0, ha="right" if len(labels) > 5 else "center")
    ax.set_ylabel(unidade, fontsize=9)
    _add_subtitle(ax, cfg.get("titulo", "Evolução"), cfg.get("subtitulo"), cfg.get("fonte"))

    fig.tight_layout()
    return _salvar_svg(fig, plt, noticia_id, posicao)


# ── Mapa de geradores ────────────────────────────────────────────────────

GERADORES = {
    "faturamento_segmento": gerar_faturamento_segmento,
    "faturamento_total": gerar_faturamento_total,
    "ranking": gerar_ranking,
    "indicadores": gerar_indicadores,
    "comparacao": gerar_comparacao,
    "barras_simples": gerar_barras_simples,
    "linha_temporal": gerar_linha_temporal,
}


def gerar_graficos(noticia_id: int, graficos_config: list[dict]) -> dict[int, str]:
    """
    Ponto de entrada principal.
    Recebe lista de graficos do Claude e gera SVGs.
    Retorna dict {posicao: url} dos gráficos gerados com sucesso.
    """
    urls = {}
    for cfg in graficos_config:
        tipo = cfg.get("tipo", "")
        posicao = cfg.get("posicao", 1)

        if tipo not in GERADORES:
            continue

        try:
            url = GERADORES[tipo](noticia_id, posicao, cfg)
            if url:
                urls[posicao] = url
                print(f"    Gráfico [{tipo}] pos={posicao} gerado para notícia {noticia_id}")
        except Exception as e:
            print(f"    Erro gráfico [{tipo}] pos={posicao} notícia {noticia_id}: {e}")

    return urls
