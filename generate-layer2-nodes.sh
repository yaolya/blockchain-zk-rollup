#!/bin/bash

ACCOUNTS_FILE="./layer1/hardhat_test_accounts.json"
NUM_NODES=$1

if [ -z "$NUM_NODES" ]; then
  echo "Usage: ./generate-layer2-nodes.sh <number_of_nodes>"
  exit 1
fi

if ! [ -f "$ACCOUNTS_FILE" ]; then
  echo "Missing $ACCOUNTS_FILE"
  exit 1
fi

cp docker-compose.base.yml docker-compose.generated.yml

for i in $(seq 1 $NUM_NODES); do
  NODE_ID="node$i"
  PORT=$((3000 + i)) 

  INDEX=$((i - 1))

  PRIVATE_KEY=$(jq -r ".[$INDEX].privateKey" "$ACCOUNTS_FILE")


  if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "null" ]; then
    echo "Not enough accounts in $ACCOUNTS_FILE for $NODE_ID"
    exit 1
  fi

cat >> docker-compose.generated.yml <<EOL
  layer2-$NODE_ID:
    build:
      context: .
      dockerfile: ./layer2/Dockerfile
    container_name: layer2-$NODE_ID
    depends_on:
      - layer1
    environment:
      - NODE_ID=$NODE_ID
      - SEQUENCER_PRIVATE_KEY=$PRIVATE_KEY
    volumes:
      - ./shared:/app/shared
      - ./analytics/logs/$NODE_ID:/app/layer2/analytics/logs/$NODE_ID
    networks:
      - blockchain-net

EOL
done

cat >> docker-compose.generated.yml <<EOL
networks:
  blockchain-net:
    driver: bridge
EOL

echo "Generated docker-compose.generated.yml with $NUM_NODES layer2 nodes"
