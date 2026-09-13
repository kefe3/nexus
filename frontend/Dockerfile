FROM nginx:alpine

LABEL org.opencontainers.image.source="https://github.com/kefe3/nexus"
LABEL org.opencontainers.image.description="Nexus AI Studio Web Frontend Container"
COPY src/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
