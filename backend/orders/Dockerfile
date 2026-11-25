FROM node:24-slim

RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npx nest build gateway && npx nest build orders && npx nest build users && npx nest build payments

ENV NODE_ENV=production
ENV APP_NAME=gateway

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
