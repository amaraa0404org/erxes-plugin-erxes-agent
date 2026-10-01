# Build context is the REPO ROOT (vendor/ holds the SDK tarballs that
# api/package.json resolves via file:../vendor/*.tgz until @erxes/* lands on npm).
FROM node:22-alpine AS deps
WORKDIR /app/api
RUN corepack enable
COPY vendor /app/vendor
COPY api/package.json ./
RUN pnpm install --prod=false

FROM deps AS build
COPY api/tsconfig.json api/tsconfig.build.json ./
COPY api/src ./src
RUN pnpm build

FROM node:22-alpine
WORKDIR /app/api
ENV NODE_ENV=production
RUN corepack enable
COPY vendor /app/vendor
COPY api/package.json ./
RUN pnpm install --prod
COPY --from=build /app/api/dist ./dist
EXPOSE 3306
CMD ["node", "dist/main.js"]
