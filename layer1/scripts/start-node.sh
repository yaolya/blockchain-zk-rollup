#!/bin/bash
set -e

# Start Hardhat node in the background
npx hardhat node &

# Save the node process ID
NODE_PID=$!

# Wait for Hardhat node
echo "[*] Waiting 5s for Hardhat node to be ready..."
sleep 5

echo "[*] Deploying contracts..."
npx hardhat run scripts/deployContracts.ts --network localhost

# Forward stop signals correctly
trap "kill $NODE_PID" SIGINT SIGTERM

# Keep container running (while node is alive)
wait $NODE_PID
