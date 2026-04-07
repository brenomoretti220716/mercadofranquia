# Mercado Franquia

Plataforma de inteligência do mercado de franquias no Brasil. Centraliza dados da ABF (Associação Brasileira de Franchising), cria indicadores objetivos e apoia decisões de investimento.

## Arquitetura

```
mercadofranquia/
├── api/                  # Backend — FastAPI + SQLite
│   ├── main.py           # Endpoints REST
│   ├── database.py       # Schema + seed de dados históricos
│   ├── abf.db            # Banco SQLite (não versionado)
│   └── requirements.txt
├── inteligencia/         # Frontend — Next.js 16 + React 19
│   ├── app/              # Pages e layouts (App Router)
│   ├── components/       # Componentes UI (shadcn/ui)
│   └── package.json
├── docs/                 # Documentação do projeto
│   ├── ARQUITETURA.md
│   ├── ROADMAP.md
│   ├── MUDANCAS.md
│   └── integracoes/
├── CLAUDE.md             # Instruções para o Claude Code
├── Makefile              # Comandos rápidos
└── .gitignore
```

## Como instalar

```bash
# 1. Clone o repositório
git clone <repo-url> && cd mercadofranquia

# 2. Instale tudo
make install

# 3. Configure o ambiente
cp api/.env.example api/.env
# Preencha ANTHROPIC_API_KEY no api/.env se quiser usar extração de PDF

# 4. Popule o banco (se necessário)
make db
```

## Como rodar

```bash
# API + Frontend juntos
make dev

# Ou separadamente:
make api        # http://localhost:8000 (docs: /docs)
make frontend   # http://localhost:3000
```

## Comandos disponíveis

| Comando | O que faz |
|---|---|
| `make dev` | Roda API e frontend em paralelo |
| `make api` | Roda só a API (porta 8000) |
| `make frontend` | Roda só o frontend (porta 3000) |
| `make install` | Instala dependências Python e Node |
| `make db` | Recria e popula o banco de dados |
| `make clean` | Remove node_modules, .next, __pycache__ |

## Stack

- **Backend:** Python 3, FastAPI, SQLite, pdfplumber
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Recharts, shadcn/ui
- **IA:** Claude API para extração de dados de PDFs da ABF

## Roadmap

Veja `docs/ROADMAP.md` para o plano completo.

| Fase | Foco | Status |
|---|---|---|
| 1 — Base | Dados, ranking, site | Em andamento |
| 2 — Engajamento | Avaliações, conteúdo | Planejado |
| 3 — Monetização | Leads, patrocínios | Planejado |
| 4 — Confiança | Selo F500 | Futuro |
