# Como importar o dump SQL

Este guia é para quem já recebeu o ficheiro `.sql` e quer carregar os dados num MySQL.

## Antes de começar

- Ter o **MySQL** a correr e acessível.
- Ter o **projeto** deste backend no computador (com o ficheiro `.env` a apontar para essa base de dados).
- Ter **Node.js** e **Yarn** instalados.

## Passo 1 — Criar/atualizar as tabelas no banco

Na pasta raiz do projeto, no terminal:

```bash
yarn prisma db push
```

Este comando alinha as tabelas do banco com o que o sistema espera. Só precisa de correr **uma vez** (ou de novo se o schema mudar).

## Passo 2 — Importar o ficheiro SQL

Substitua os valores entre `< >` pelos dados da sua base (utilizador, senha, servidor, porta e nome da base). O caminho no fim é onde está o ficheiro `.sql` que recebeu.

```bash
mysql -u <utilizador> -p -h <servidor> -P <porta> <nome_da_base> < caminho/para/o-dump.sql
```

Exemplo (valores fictícios):

```bash
mysql -u meu_user -p -h 127.0.0.1 -P 3306 minha_base < ~/Downloads/dump-dados.sql
```

Ao correr `-p`, o terminal pede a **palavra-passe** do MySQL (não aparece enquanto escreve — é normal).

Depois disto, os dados do dump ficam na base e a aplicação pode usar essa `DATABASE_URL` no `.env`.
