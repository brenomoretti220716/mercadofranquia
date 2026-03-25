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

## ⚙️ Como rodar localmente

```bash
# 1. Instale dependências
npm install

# 2. Configure o ambiente
cp .env.example .env
# Preencha os valores no .env

# 3. Rode o projeto
npm run dev
```

---

## 📌 Decisões de arquitetura importantes

| Decisão | Motivo | Data |
|---|---|---|
| _(a preencher conforme o projeto avança)_ | — | — |

---

## 🚧 O que NÃO fazer neste projeto

- _(a preencher conforme armadilhas forem descobertas)_
