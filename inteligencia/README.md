# Frontend — Mercado Franquia (Inteligência)

Dashboard de inteligência do mercado de franquias, construído com Next.js 16, React 19, Tailwind CSS 4 e Recharts.

## Como instalar

```bash
cd inteligencia
npm install
```

## Como rodar

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

O app roda em `http://localhost:3000`.

A API precisa estar rodando em `http://localhost:8000` (veja `api/README.md`).

## Variáveis de ambiente

Copie `.env.local` e ajuste se necessário:

| Variável | Descrição | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:8000` |

## Estrutura de componentes

```
inteligencia/
├── app/
│   ├── layout.tsx            # Layout raiz (metadata, fonts, providers)
│   ├── page.tsx              # Página inicial
│   ├── globals.css           # Estilos globais + Tailwind
│   └── inteligencia/
│       ├── page.tsx          # Página do dashboard de inteligência
│       └── dashboard.tsx     # Componente principal do dashboard (gráficos, tabelas)
├── components/
│   └── ui/                   # Componentes base (shadcn/ui)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── table.tsx
├── lib/                      # Utilitários (cn, utils)
├── public/                   # Assets estáticos
└── package.json
```

## Stack

- **Next.js 16** — framework React com App Router
- **React 19** — UI
- **Tailwind CSS 4** — estilização
- **Recharts** — gráficos
- **TanStack Table** — tabelas
- **shadcn/ui** — componentes base
- **react-simple-maps** — mapas
