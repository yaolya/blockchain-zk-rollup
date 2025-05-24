pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template BatchProofWithPoseidon(n) {
    signal input initialState;
    signal input finalState;
    signal input txs[n];

    signal sum[n + 1];
    signal poseidonHashes[n];
    signal output result;

    component hashers[n];

    sum[0] <== initialState;

    for (var i = 0; i < n; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== txs[i];
        hashers[i].inputs[1] <== i;

        poseidonHashes[i] <== hashers[i].out;

        sum[i + 1] <== sum[i] + poseidonHashes[i];
    }

    result <== sum[n];
    finalState === result;
}

component main = BatchProofWithPoseidon(400);
