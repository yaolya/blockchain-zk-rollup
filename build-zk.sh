#!/bin/bash

set -e

echo "Building zk verifiers..."
cd zk
npx hardhat zkit clean
rm -rf contracts/verifiers
npx hardhat zkit make
npx hardhat zkit verifiers
cd ..

echo "Copying generated folders..."

rm -rf layer1/contracts/verifiers
cp -r zk/contracts/verifiers layer1/contracts/

rm -rf layer2/generated-types
cp -r zk/generated-types layer2/

rm -rf layer2/zkit
cp -r zk/zkit layer2/

echo "Done: Verifiers built and directories synced."
