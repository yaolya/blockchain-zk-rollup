## ZK-Rollup Implementation

[![Run tests](https://github.com/yaolya/blockchain-zk-rollup/actions/workflows/test.yml/badge.svg)](https://github.com/yaolya/blockchain-zk-rollup/actions/workflows/test.yml)

This repository contains the implementation of a master’s thesis project focused on a zero-knowledge rollup (zk-rollup) for Ethereum. Designed as a research-driven proof of concept, the project serves as a platform for exploring Layer 2 scaling strategies based on zero-knowledge proofs.

The project focuses on implementing the core components of a zk-rollup system, including transaction batching, proof generation, and state management, while also providing insights into the theoretical and practical aspects of Layer 2 scaling solutions.

### Architecture

- `layer1/`: Ethereum smart contracts and deployment scripts
  - Contracts for rollup verification, sequencer election via DPoS and baseline L1 transaction handling
  - State management

- `layer2/`: Rollup implementation
  - Coordinator: Submits zk-proofs and updated state roots to Layer 1
  - Sequencer: Collects transactions, builds batches, and triggers proof generation
  - VM: Executes transactions and maintains state
  - Circuits: Zero-knowledge circuit implementations

- `zk/`: Zero-knowledge proof system
  - Custom circuits using circom
  - Proof generation and verification logic
  - ZKit integration

- `analytics/`: Performance monitoring, logs and analysis tools

### Prerequisites
- Docker and Docker Compose
- Node.js (v16 or higher)

### Setup

1. Clone this repository:
```bash
git clone https://github.com/yaolya/blockchain-zk-rollup.git
cd blockchain-zk-rollup
```

2. Install dependencies:
```bash
npm install
```

### Launch the System

To start the default configuration with a single sequencer node:

```bash
docker compose up --build
```

To run with multiple Layer 2 sequencer nodes:

```bash
./generate-layer2-nodes.sh <number_of_nodes>
docker compose -f docker-compose.generated.yml up --build
```

This will start:
- A Hardhat node with deployed Layer 1 contracts
- One or more Layer 2 sequencer nodes
