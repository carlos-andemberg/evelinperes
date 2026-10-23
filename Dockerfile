# Servidor pequeno em Node, sem dependências: serve as páginas e guarda as opções da live.
# Coolify: Build Pack "Dockerfile", porta 80, healthcheck em /, volume em /dados e a variável SENHA_EDICAO.
FROM node:22-alpine
WORKDIR /app
COPY servidor.js ./
COPY *.html *.js *.json *.svg *.ico *.png site.webmanifest ./publico/
COPY paineis ./publico/paineis
# troca o "?v=dev" dos scripts por um código do conteúdo: a cada deploy com mudança o link muda,
# e o navegador, o Cloudflare e o OBS buscam o arquivo novo em vez de usar o guardado
RUN rm -f publico/servidor.js \
 && cd publico \
 && v=$(cat ondas.js dados.js cenas.js trava.js modal.js sons.js nami.json | md5sum | cut -c1-10) \
 && sed -i "s/?v=dev/?v=$v/g" *.html
ENV PORTA=80 PASTA=/app/publico DADOS=/dados
EXPOSE 80
CMD ["node", "servidor.js"]
