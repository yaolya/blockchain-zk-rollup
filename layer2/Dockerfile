FROM node:24-slim

WORKDIR /app

COPY package*.json ./

COPY layer2/ ./layer2/

COPY tsconfig.base.json ./

RUN npm install --workspace=layer2 --include-workspace-root

RUN chmod +x layer2/scripts/generateEnv.ts

WORKDIR /app/layer2

ENTRYPOINT ["npm", "run"]
CMD ["start"]
