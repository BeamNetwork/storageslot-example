/* eslint-env mocha */
/* global artifacts, contract, web3 */

const chai = require('chai');
const bnChai = require('bn-chai');

const { BN, toBN } = web3.utils;
const { expect } = chai;
chai.use(bnChai(BN));

const StorageSlotExample = artifacts.require('StorageSlotExample');

contract('StorageSlotExample', () => {
  let example;

  beforeEach(async () => {
    example = await StorageSlotExample.new();
  });

  it('Has correct storage slot for a', async () => {
    expect(await example.get1234Slot()).to.eq.BN(0x1234);
  });

  it('Has correct storage slot for b', async () => {
    expect(await example.getHelloSlot()).to.eq.BN(toBN(web3.utils.soliditySha3('hello')));
  });

  it('Has correct storage slot for c', async () => {
    expect(await example.getRegularSlot()).to.eq.BN(2);
  });

  it('Matches precomputed offset for d[0x123]', async () => {
    // Unintended effect: Can alias storage from things in maps
    expect(await example.getOverlapSlot())
      .to.eq.BN(toBN(web3.utils.soliditySha3(toBN(0x123), toBN(0x3))));
    expect(await example.overlap()).to.eq.BN(1);
  });
});
