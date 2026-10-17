# Serve os arquivos estáticos com nginx (Coolify: Build Pack "Dockerfile", porta 80, healthcheck em /)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY *.html *.js *.json *.svg *.ico *.png site.webmanifest /usr/share/nginx/html/
# troca o "?v=dev" dos scripts por um código do conteúdo: a cada deploy com mudança o link muda,
# e o navegador, o Cloudflare e o OBS buscam o arquivo novo em vez de usar o guardado
RUN cd /usr/share/nginx/html \
 && v=$(cat ondas.js dados.js nami.json | md5sum | cut -c1-10) \
 && sed -i "s/?v=dev/?v=$v/g" *.html
EXPOSE 80
