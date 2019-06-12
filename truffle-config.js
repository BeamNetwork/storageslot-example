module.exports = {
  networks: {
    coverage: {
      host: '127.0.0.1',
      port: 8555,
      network_id: '*',
      gas: 17592186044415,
      gasPrice: 1,
    },
  },
  compilers: {
    solc: {
      version: 'node_modules/solc/index.js',
    },
  },
};
