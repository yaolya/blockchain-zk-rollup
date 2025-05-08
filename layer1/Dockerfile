FROM node:24-slim

WORKDIR /app

COPY package*.json ./

COPY layer1/ ./layer1/

COPY tsconfig.base.json ./

RUN npm install --workspace=layer1 --include-workspace-root

RUN chmod +x layer1/scripts/start-node.sh

WORKDIR /app/layer1

CMD ["./scripts/start-node.sh"]
