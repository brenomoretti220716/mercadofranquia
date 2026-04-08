# Franchise Web

Frontend do projeto Franchise, construído com Next.js.

## Pré-requisitos

- Node.js 20+
- npm ou yarn
- Docker + Docker Compose (opcional)

## Configuração de ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Ajuste os valores conforme o ambiente local.

### Variáveis de ambiente

| Variável | Obrigatória | Default | Descrição |
| --- | --- | --- | --- |
| `PORT` | Não | `3000` | Porta interna usada pelo app Next.js no container/processo. |
| `NODE_ENV` | Não | `development` | Define o ambiente de execução. |
| `NEXT_PUBLIC_API_URL` | Sim | `http://localhost:4000` | URL base da API backend consumida pelo frontend. |

## Rodando localmente (sem Docker)

Instale dependências:

```bash
npm install
```

Suba em modo desenvolvimento:

```bash
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

## Rodando com Docker

Antes de subir os containers, garanta que a rede externa exista:

```bash
docker network create proxy_net
```

### Desenvolvimento

```bash
docker compose up -d --build
```

### Produção (compose override)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Scripts úteis

- `npm run dev`: inicia em modo desenvolvimento
- `npm run build`: gera build de produção
- `npm run start`: inicia build standalone
- `npm run lint`: executa lint
- `npm run lint:fix`: corrige problemas de lint automaticamente

## Troubleshooting rápido

- Se o frontend não conectar na API, valide `NEXT_PUBLIC_API_URL` no `.env`.
- Se o compose falhar por rede, recrie `proxy_net`.
- Se a porta estiver em uso, altere `PORT` e/ou mapeamento do serviço.
