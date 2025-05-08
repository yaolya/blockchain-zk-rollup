pragma circom 2.0.0;

template BatchProof(n) {
    signal input initialState;
    signal input finalState;
    signal input txs[n];

    signal sum[n + 1];
    signal output result;

    sum[0] <== initialState;

    for (var i = 0; i < n; i++) {
        sum[i + 1] <== sum[i] + txs[i];
    }

    result <== sum[n];
    finalState === result;
}

component main = BatchProof(5);
