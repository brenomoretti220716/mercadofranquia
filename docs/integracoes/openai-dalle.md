# Integracao — OpenAI DALL-E 3

Atualizado: 2026-03-28

**Servico:** DALL-E 3 via OpenAI API
**URL:** https://api.openai.com/v1/images/generations
**Documentacao:** https://platform.openai.com/docs/api-reference/images
**Uso:** Geracao de imagens para noticias e cards Instagram
**Custo:** ~US$ 0.04 por imagem HD 1792x1024, ~US$ 0.04 por 1024x1024
**Configuracao:** OPENAI_API_KEY no .env e GitHub Secrets
**Modelo:** dall-e-3
**Qualidade:** hd
**Estilo:** natural (fotorrealista)

## Tamanhos por tipo

| Tipo | Tamanho | Uso |
|---|---|---|
| Noticia | 1792x1024 | Imagem de capa landscape |
| Card Instagram | 1024x1024 | Quadrado para posts |

## Prompt padrao

Noticias: "Professional business photography, Brazilian franchise market, {imagem_prompt}. Style: editorial, Bloomberg/Economist aesthetic, high contrast, cinematic lighting, no text, no logos, photorealistic."

Cards: "Modern Brazilian business environment, {imagem_prompt}. Style: clean, professional, vibrant colors with orange accents, no text, no logos."

## Arquivos

- api/scrapers/gerar_imagem.py — gerador
- api/static/imagens/ — imagens salvas (nao versionadas)

## Status no banco

- pendente: aguardando geracao
- gerando: chamada DALL-E em andamento
- gerado: imagem salva localmente
- erro: falha na geracao
