FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @gym-erp/shared build
RUN pnpm --filter api build
RUN pnpm --filter api --prod deploy /prod/api

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /prod/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
