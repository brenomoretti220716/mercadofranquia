# Franchise Back

API backend do projeto Franchise, construida com NestJS + Prisma.

## Pre-requisitos

- Node.js 20+
- npm
- Banco MySQL acessivel
- Redis acessivel
- Docker + Docker Compose (opcional)

## Configuracao de ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Atualize os valores de acordo com seu ambiente (principalmente DB, Redis, JWT e SMTP).

### Variaveis de ambiente

| Variavel | Obrigatoria | Default | Descricao |
| --- | --- | --- | --- |
| `NODE_ENV` | Nao | `development` | Ambiente de execucao da API. |
| `PORT` | Nao | `4000` | Porta HTTP da aplicacao. |
| `DATABASE_URL` | Sim | `mysql://franchise_user:franchise_password@localhost:3306/franchise_db` | String de conexao MySQL do Prisma. |
| `REDIS_HOST` | Nao | `localhost` | Host do Redis para cache. |
| `REDIS_PORT` | Nao | `6379` | Porta do Redis. |
| `REDIS_PASSWORD` | Nao | vazio | Senha do Redis, se houver. |
| `REDIS_TTL` | Nao | `300` | TTL padrao do cache em segundos. |
| `JWT_SECRET` | Sim | - | Segredo para assinar tokens JWT. |
| `JWT_EXPIRES_IN` | Nao | `1h` | Duracao padrao dos tokens JWT. |
| `SMTP_HOST` | Nao | `smtp.gmail.com` | Host SMTP para envio de emails. |
| `SMTP_PORT` | Nao | `587` | Porta SMTP. |
| `SMTP_SECURE` | Nao | `false` | Define uso de TLS implicito no SMTP. |
| `SMTP_USER` | Sim | - | Usuario SMTP para envio. |
| `SMTP_PASS` | Sim | - | Senha/app password SMTP. |
| `SMTP_FROM` | Nao | `"Sistema de Franquias <email>"` | Remetente padrao dos emails. |
| `UPLOAD_PATH` | Nao | `./uploads` | Diretorio local de uploads. |
| `BASE_URL` | Nao | `http://localhost:4000` | URL base para montar links publicos. |
| `API_URL` | Nao | `http://localhost:4000` | URL base usada em alguns servicos de upload/download. |
| `GROQ_API_KEY` | Nao | vazio | Chave da integracao Groq (scraping/IA). |
| `PUBLIC_ENVIRONMENT` | Nao | `development` | Flag usada por schedulers/fluxos de scraping. |
| `PUPPETEER_EXECUTABLE_PATH` | Nao | vazio | Caminho customizado do binario do Chromium. |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | Nao | vazio | Flag de build/teste para pular download do Chromium. |

## Instalacao e execucao local

Instale as dependencias:

```bash
npm install
```

Execute em modo desenvolvimento:

```bash
npm run dev
```

Execute build + producao local:

```bash
npm run build
npm run start:prod
```

## Execucao com Docker

Este repositorio usa `docker-compose.yml` e `docker-compose.prod.yml`.

Antes de subir os containers, garanta as redes externas:

```bash
docker network create proxy_net
docker network create db_net
```

Subir stack:

```bash
docker compose up -d --build
```

Para cenario de producao:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Documentacao da API (Swagger/Scalar)

- Interface Scalar: `GET /api-docs`
- OpenAPI JSON: `GET /api-docs/json`

Observacoes:

- As rotas de negocio da API sao documentadas via decorators do `@nestjs/swagger` nos controllers.
- Rotas de infraestrutura (`/api-docs`, `/api-docs/json` e `/uploads/*`) nao representam endpoints de negocio.

## Scripts uteis

- `npm run dev`: inicia Nest com watch
- `npm run build`: gera build
- `npm run start:prod`: executa build compilado
- `npm run lint`: roda ESLint com auto-fix
- `npm run test`: roda testes
- `npm run list-segments`: script utilitario de segmentos
