# Serve os arquivos estáticos com nginx (Coolify: Build Pack "Dockerfile", porta 80, healthcheck em /)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY *.html *.js *.json *.svg *.ico *.png site.webmanifest /usr/share/nginx/html/
EXPOSE 80
