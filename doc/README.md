# Upgradable contracts and storage

When deploying smart contracts to Ethereum, the implementation and code is
considered final and immutable. This has both advantages and disadvantages.
One of the disadvantages is the contract cannot be updated to account for
changes in the Ethereum environment. As an example, the current token
standard is ERC20, but there are numerous newer token standards at various
stages of standardization. How would one add support for a newer standard to
an already-deployed token?

### Upgradable contracts

To resolve this problem, there's numerous implementations of upgradable
contract patterns. All of them are based on the use of proxies -- instead of
interfacing directly with the contract, the user interfaces with the proxy,
and the proxy borrows the implementation on-the-fly from the implementation
contract. Which implementation contract is borrowed from can be changed,
thus effectively getting upgradability.

For a more detailed write-up, see the documentation for
[ZeppelinOS](https://docs.zeppelinos.org/docs/writing_contracts.html)

One notable and important difference when implementing with a proxy is that
the storage for the contract (i.e.; balances for tokens) are stored on the
proxy, not on the implementation contract. The implementation contract is just a code
repository.

## Storage slots

Upgradability introduces an issue when contracts are maintained and updated
over time. We'll illustrate with an example. Assume the following
implementation contract:

```
contract A is Initializable {
  uint256 public a;
  uint256 public c;

  function initialize(address sender) public initializer {
    super.initialize(sender);
    a = 2;
    c = 4;
  }

  function incC() public {
    c = c + 1;
  }
}
```

Solidity uses names for storage variables, but the Ethereum VM just uses
storage slot numbers. Thus, the solidity compiler translates the above code
into something like:

```
initialize(): {
  storage[0] = 2;
  storage[1] = 4;
}

a(): {
  return storage[0];
}

c(): {
  return storage[1];
}

incC(): {
  storage[1] = storage[1] + 1;
}
```

Apologies for the pseudocode. Assume this contract is deployed at addres
```0x123``` and the proxy is deployed at address ```0xabc``` and told to use
the implementation at address ```0x123```.
```0x123``` at this point has no storage; all the storage is on the proxy
(at ```0xabc```), and currently looks like:
```
0: 2
1: 4
```

If we now call incC once, the value of c increments as expected, and the
storage is:
```
0: 2
1: 5
```

Now, assume we need to do an upgrade to the contract and add some
functionality, and the new version of the contract looks like this:

```
contract A2 is Initializable {
  uint256 public a;
  uint256 public b;
  uint256 public c;

  function initialize(address sender) public initializer {
    super.initialize(sender);
    a = 2;
    b = 1;
    c = 4;
  }

  function incC() public {
    c = c + 1;
  }
}
```

Behind the scenes, this translates to:
```
initialize(): {
  storage[0] = 2;
  storage[1] = 1;
  storage[2] = 4;
}

a(): {
  return storage[0];
}

b(): {
  return storage[1];
}

c(): {
  return storage[2];
}

incC(): {
  storage[2] = storage[2] + 1;
}
```

If we now update the proxy to point to this new version, we have a bit of a
problem. Since we inserted ```b``` between ```a``` and ```c```, and the
solidity compiler just assings storage slots in the order it encountered the
variables, we're now in a situation where calling ```b()``` returns 5, since
```b``` has storage slot 1, which uses to be the storage slot for ```c```.
Calling ```c()``` returns 0; there's nothing in storage slot 2 yet.

### Additional complications

The above can be mitigated by only appending storage variables. However, for
most non-trivial production deployments, there's also contract inheritence
to deal with. If our contract ```A``` depends on contract ```B```, then any
variables added to ```B``` will move _all_ the variables in ```A```. This
problem is amplified if ```B``` is a contract maintained by someone else, a
common case if ```A``` is a token, and ```B``` is a ERC20 base
implementation.

# Proposed solution

As a solution to the above, we propose to augment solidity to allow
specifying storage slots or labels. As an example, the original contract
would look like:

```
contract A is Initializable {
  uint256 public storage("first") a;
  uint256 public storage("second") c;

  function initialize(address sender) public initializer {
    super.initialize(sender);
    a = 2;
    c = 4;
  }

  function incC() public {
    c = c + 1;
  }
}
```

Behind the scenes, the compiler would assign ```a``` and ```c``` to the hash
of the string ```first``` and ```second``` respectively, or
```0x692e3fbb06193c3a65b6ccb60c9ec6fb32af21c16d3f6ac10039258c2a5d4d2d``` and
```0x45318970bfff215a328f56895f3a97d4f276a44c24c135c12c37867a1f667b8a```.
Thus, the contract becomes:

```
initialize(): {
  storage[0x692e3fbb06193c3a65b6ccb60c9ec6fb32af21c16d3f6ac10039258c2a5d4d2d] = 2;
  storage[0x45318970bfff215a328f56895f3a97d4f276a44c24c135c12c37867a1f667b8a] = 4;
}

a(): {
  return storage[0x692e3fbb06193c3a65b6ccb60c9ec6fb32af21c16d3f6ac10039258c2a5d4d2d];
}

c(): {
  return storage[0x45318970bfff215a328f56895f3a97d4f276a44c24c135c12c37867a1f667b8a];
}

incC(): {
  storage[0x45318970bfff215a328f56895f3a97d4f276a44c24c135c12c37867a1f667b8a] = storage[0x45318970bfff215a328f56895f3a97d4f276a44c24c135c12c37867a1f667b8a] + 1;
}
```

This is similar to Zeppelin's discussions around
[unstructured storage](https://blog.zeppelinos.org/upgradeability-using-unstructured-storage/),
but implements it at the compiler level to make the code easier to read,
write and maintain. In this model, variables can be added or removed to the
contract itself or any of the parents (assuming the parents also label their
storage slots).
