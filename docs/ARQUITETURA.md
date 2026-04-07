# Arquitetura — Mercado Franquia

Atualizado: 2026-03-28

## Stack

| Camada | Tecnologia | Porta |
|---|---|---|
| Backend | Python 3, FastAPI, SQLite | 8000 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts | 3000 |
| Auth | NextAuth (credentials, JWT) | - |
| IA | Claude API (sonnet) | - |
| CI/CD | GitHub Actions | - |

## Banco de dados (17 tabelas, SQLite)

| Tabela | Registros | Fonte |
|---|---|---|
| macro_bcb | 7.159 | BCB (9 series) |
| pmc_ibge | 1.595 | IBGE/PMC (11 segmentos) |
| franquias | 1.387 | Portal Franchising + RankFranchise |
| caged_bcb | 870 | MTE/CAGED (6 setores) |
| macro_ibge | 270 | IBGE Contas Regionais |
| faturamento | 133 | ABF (anual + trimestral + 12m) |
| noticias_raw | 119 | Google News + ABF + Portal + Mapa |
| sync_log | 113 | Registro de syncs |
| relatorios | 28 | ABF PDFs |
| indicadores | 14 | ABF (empregos, redes, unidades) |
| ranking | 40 | ABF Top marcas |
| posts_instagram | 8 | Cards IA |
| carrosseis_instagram | 6 | Carrosseis IA |
| noticias_fila | 6 | Artigos processados |
| projecoes | 6 | ABF 2021-2026 |
| noticias_publicadas | 2 | Artigos aprovados |
| audit_log | 0 | Auditoria |

## API (40+ endpoints)

Dados: /api/faturamento, /api/indicadores, /api/ranking, /api/projecoes, /api/macro/bcb, /api/macro/ibge, /api/varejo/pmc, /api/emprego/caged, /api/consumidor/painel
Franquias: /api/franquias, /api/franquias/{slug}, /api/franquias/segmentos
Noticias: /api/noticias, /api/noticias/fila, /api/noticias/stats, /api/noticias/publicar, /api/noticias/rejeitar
Instagram: /api/instagram/posts, /api/instagram/card/{id}, /api/instagram/aprovar
Carrosseis: /api/carrosseis, /api/carrosseis/gerar, /api/carrosseis/{id}/slide/{n}
Fontes: /api/fontes/status, /api/fontes/sync/macro, /api/fontes/sync/noticias
Admin: /api/admin/stats, /api/audit, /api/sync/status

## Backoffice (4 modulos)

- Editorial: noticias, artigos, fila de revisao
- Studio Social: cards Instagram, carrosseis
- Inteligencia: dashboard dados (5 abas), franquias, relatorios, upload, fontes
- Sistema: logs de sync, auditoria
