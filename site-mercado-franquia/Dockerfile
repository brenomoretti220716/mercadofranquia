# Build stage

FROM node:alpine AS builder

RUN apk add --no-cache openssl chromium

WORKDIR /app

COPY package*.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate

RUN yarn build

RUN apk add --no-cache chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN yarn cache clean

ARG PORT

ENV PORT=${PORT}

EXPOSE ${PORT}

# Declare volume mount point for persistent uploads
# Note: Actual volume must be created and mounted at runtime
VOLUME ["/app/uploads"]

CMD [ "yarn", "start:prod" ]