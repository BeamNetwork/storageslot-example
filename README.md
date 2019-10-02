[![Build Status](https://travis-ci.com/eco/storageslot-example.svg?token=poXnpmiA2RAigkqypVN5&branch=master)](https://travis-ci.com/eco/storageslot-example)
[![Coverage Status](https://coveralls.io/repos/github/eco/storageslot-example/badge.svg?branch=master)](https://coveralls.io/github/eco/storageslot-example?branch=master)
[![codecov](https://codecov.io/gh/eco/storageslot-example/branch/master/graph/badge.svg)](https://codecov.io/gh/eco/storageslot-example)

# storageslot-example
Example of solidity with explicit storage slots

## Quick-start guide

```
nvm use
npm install
npm run lint
npm run test
npm run coverage
npm run format
```

## Why?

Storage slot specification allows specifying the underlying
storage slot for Solidity state variables, which makes upgrading contracts
less error-prone.

As an example, a contract like:
```
contract StorageSlotExample {
    uint256 public storage[0x1234] a;
}
```
Will create a contract where the first storage element is mapped to storage
slot 0x1234 instead of storage slot 0. This allows a future version of the
contract to add or remove state variables without changing the on-chain
storage layout. An alternate (and likely recommended) syntax is
```
contract StorageSlotExample {
    uint256 public storage["io.beam.storageslot.a"] a;
}
```
This will use map element `a` to storage slot
`keccak256('io.beam.storageslot.a')`.

## State

This is a small, working example with unit tests, linter, prettier and code
coverage. Code generation incudes sanity checks (overlapping slots etc), and
the linter includes rules to encourage storage specification consistency.

The syntax for the storage slot specification has been neither
finalized nor discussed. As such, this example should be taken only as a suggested
starting point for discussion and a feasibility study of integrating the new
syntax in toolchains.

This includes patched and working versions of:
* [Solidity](https://github.com/eco/solidity/tree/storageslot)
  * [solc-js](https://github.com/eco/solc-js/tree/storageslot)
  * [solidity-antlr4](https://github.com/eco/solidity-antlr4/tree/storageslot)
    * [solhint](https://github.com/eco/solhint/tree/storageslot)
    * [solidity-parser-antlr](https://github.com/eco/solidity-parser-antlr/tree/storageslot)
      * [prettier-plugin-solidity](https://github.com/eco/prettier-plugin-solidity/tree/storageslot)
      * [solidity-coverage](https://github.com/eco/solidity-coverage/tree/storageslot)
  * [solparse](https://github.com/eco/solparse/tree/storageslot)
    * [Ethlint/solium](https://github.com/eco/Ethlint/tree/storageslot)

List is shown in practical dependency order, which will drive the order of
PRs.

### Open question: Bit offsets

Should it be possible to specify the bit offset as well as storage offset?
When not specifying storage slots, a contract like
```
constract PackedExample {
   uint128 public a;
   uint128 public b;
}
```
will store both elements in storage slot `0`, with element b at a
128-bit offset. It is feasible to do the same with a slot specification,
potentially something like `uint128 public storage[0:128] b`. The only
known use-case is when retroactively adding storage slot specifiers to an
already-deployed contract that uses less-than-256bit types. Is that
sufficient motivation to add this extended syntax now?

### Open question: Numerical slots

Numerical slots are very practical when adding specifications to a new
revision of a contract that already has storage deployed. However, it
doesn't feel like a good practice to use it in new contracts.

Our current recommendation for this is to allow it in the compiler, but make
it a default error-level complaint in the linters. Thus, it becomes
something the user has to explicitly (and hopefully counciously) allow.
