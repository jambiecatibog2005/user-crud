FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

# Palitan natin ang npm ci ng npm install para iwas lockfile mismatch
RUN npm install --no-audit --prefer-offline

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/www /usr/share/nginx/html

EXPOSE 8100

CMD ["nginx", "-g", "daemon off;"]