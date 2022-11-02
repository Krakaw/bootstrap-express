FROM node:18 AS build

WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:18-slim
RUN sed -i -e's/ main/ main contrib non-free/g' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install --no-install-recommends -y ca-certificates curl tini && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /home/node/app
COPY --from=build --chown=node:node /home/node/app/build /home/node/app/package.json /home/node/app/package-lock.json ./
COPY --from=build --chown=node:node /home/node/app/node_modules ./node_modules
USER node
EXPOSE 3004
ENV NODE_OPTIONS "--enable-source-maps"
ENTRYPOINT [ "tini", "--", "node", "src/index.js" ]
