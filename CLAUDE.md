# CLAUDE.md — Mercado Franquia

> Leia este arquivo antes de qualquer ação.
> Não explica tudo — aponta onde cada explicação está.

---

## 🗺️ Visão geral rápida do projeto

O **Mercado Franquia** é uma plataforma digital que organiza, qualifica e dá transparência ao mercado de franquias no Brasil.

O foco é o **investidor** — não a marca. Quem acessa quer comparar franquias com dados reais, não propaganda.

Problema que resolve: informações sobre franquias hoje são dispersas, enviesadas e incomparáveis. A plataforma centraliza dados, cria critérios objetivos e apoia decisões de investimento mais seguras.

---

## 👥 Público-alvo

| Perfil | O que busca |
|---|---|
| Candidato a franqueado | Comparar opções com clareza antes de investir |
| Investidor / operador | Indicadores: payback, faturamento médio, crescimento |
| Franqueador | Visibilidade, leads qualificados, credibilidade |

---

## 🧩 Funcionalidades do produto

| Funcionalidade | Descrição |
|---|---|
| Ranking de franquias | Classificação por nº de unidades e crescimento |
| Página da franquia | Investimento, payback, faturamento, dados institucionais |
| Sistema de avaliações | Notas + comentários segmentados por perfil |
| Filtros inteligentes | Por investimento, segmento, desempenho, perfil |
| Geração de leads | Conexão direta candidato ↔ franqueador |
| Conteúdo editorial | Notícias, entrevistas, análises do mercado |

### Feature futura — Selo F500 (Franchising 500)
Será lançado apenas após a plataforma atingir escala. Valida franquias com dados auditados de faturamento real, comparando projeção vs. resultado. Exibido diretamente na plataforma.

---

## 🚀 Fases do projeto

| Fase | Foco | Status |
|---|---|---|
| 1 — Base e lançamento | Importação de dados, ranking, publicação do site | — |
| 2 — Engajamento | Avaliações, verificação de usuários, conteúdo | — |
| 3 — Monetização | Venda de leads, destaques patrocinados, publicidade | — |
| 4 — Confiança | Selo F500 — validação de dados auditados | Futura |

---

## 🧠 Como trabalhar neste projeto

- Fale como se eu fosse um leigo. Use analogias do mundo real.
- Evite jargão técnico. Quando usar, explique.
- Sempre em Português do Brasil.
- Seja direto. Sem enrolação, sem repetição.
- Quando criar um arquivo novo em `docs/`, adicione-o ao índice abaixo imediatamente com a data.

---

## 📐 Regras de código (não negocie)

- 🚫 Proibido valores hardcoded — use variáveis de ambiente (`.env`)
- 🚫 Proibido cores ou textos hardcoded no código — use tokens/constantes
- ✅ Todo `.env` deve ter um `.env.example` correspondente com as chaves (sem valores)
- ✅ Componentes React: pequenos, focados, sem funções de render aninhadas
- ✅ Imports absolutos sempre — nunca `../../../componente`
- ✅ Erros tratados de forma centralizada — nunca espalhados pelo código
- ✅ Async/await sempre — nunca callbacks aninhados
- ✅ Nomes de arquivos em kebab-case: `meu-componente.jsx`
- ✅ Antes de integrar qualquer serviço externo, pesquise a documentação oficial e documente em `docs/integracoes/`

---

## 📁 Estrutura de docs/

| Arquivo | Conteúdo | Última atualização |
|---|---|---|
| `docs/ARQUITETURA.md` | Estrutura do projeto, componentes, fluxo de dados | — |
| `docs/ROADMAP.md` | O que foi feito e o que vem a seguir | — |
| `docs/MUDANCAS.md` | Changelog com data de tudo | — |
| `docs/integracoes/` | Pasta com um .md por serviço externo integrado | — |

> ⚠️ Todo arquivo novo em docs/ entra aqui imediatamente com a data de criação.

---

## 🔌 Integrações ativas

| Serviço | Doc de referência | Status |
|---|---|---|
| _(adicione aqui)_ | `docs/integracoes/nome-do-servico.md` | ativo/inativo |

---

## 🏗️ Arquitetura atual

```
mercadofranquia/
├── api/                      # Backend Python
│   ├── main.py               # FastAPI — endpoints REST
│   ├── database.py           # Schema SQLite + seed de dados históricos ABF
│   ├── abf.db                # Banco (não versionado)
│   ├── requirements.txt      # Dependências com versões fixas
│   ├── .env / .env.example   # Variáveis de ambiente
│   └── README.md             # Documentação dos endpoints
├── inteligencia/             # Frontend Next.js
│   ├── app/                  # Pages (App Router)
│   │   ├── page.tsx          # Home
│   │   └── inteligencia/     # Dashboard de inteligência
│   ├── components/ui/        # shadcn/ui (badge, button, card, table)
│   ├── lib/                  # Utilitários
│   ├── .env.local            # NEXT_PUBLIC_API_URL
│   └── package.json
├── docs/                     # Documentação
├── Makefile                  # make dev, make api, make frontend, make install, make db, make clean
├── CLAUDE.md                 # Este arquivo
└── README.md                 # Visão geral do projeto
```

### Fluxo de dados
1. `database.py` cria o schema SQLite e popula com dados históricos da ABF (2014–2025)
2. `main.py` expõe os dados via REST (FastAPI) na porta 8000
3. O frontend Next.js consome a API e renderiza dashboards com Recharts

### Tecnologias
- **Backend:** Python 3, FastAPI, SQLite, pdfplumber, Claude API (extração de PDFs)
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Recharts, TanStack Table, shadcn/ui

---

## ⚙️ Como rodar localmente

```bash
# Instala tudo (Python + Node)
make install

# Configura ambiente
cp api/.env.example api/.env

# Popula o banco (se necessário)
make db

# Roda API + Frontend
make dev
```

Ou separadamente: `make api` (porta 8000) e `make frontend` (porta 3000).

---

## 📌 Decisões de arquitetura importantes

| Decisão | Motivo | Data |
|---|---|---|
| SQLite como banco | Simplicidade para MVP, dados read-heavy, zero infra | 2026-03-25 |
| Monorepo com api/ + inteligencia/ | Frontend e backend no mesmo repo facilita desenvolvimento | 2026-03-25 |
| Claude API para extração de PDFs | PDFs da ABF têm layout variável, IA generaliza melhor que parsing manual | 2026-03-25 |

---

## 🚧 O que NÃO fazer neste projeto

- Não commitar `abf.db`, `.env` ou `.env.local` — estão no `.gitignore`
- Não usar `../../../` em imports — sempre absolutos
- Não hardcodar cores, textos ou URLs no código
