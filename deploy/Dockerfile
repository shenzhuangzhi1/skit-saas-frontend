FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist-prod/ /usr/share/nginx/html/
RUN cd /usr/share/nginx/html/legal && sha256sum -c SHA256SUMS

EXPOSE 80
