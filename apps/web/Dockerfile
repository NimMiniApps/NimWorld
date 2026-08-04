FROM node:22-alpine AS build
WORKDIR /app
# Workspace build: root manifest + all workspace packages needed for `npm ci`.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm ci
ARG NIMWORLD_BUILD_ID
ENV NIMWORLD_BUILD_ID=$NIMWORLD_BUILD_ID
RUN npm run build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
