FROM node:24-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_MAPBOX_TOKEN

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:1.31-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
