pragma solidity ^0.5.9;

contract StorageSlotExample {
    struct StructExample {
        uint256 a;
    }

    uint256 public storage[0x1234] a;
    uint256 public storage["hello"] b;
    uint256 public c;
    mapping(uint256 => bool) public d;

    StructExample public f;

    uint256 public storage[0xB0F566E5E54AD5F271B39DA0D24B21FD2C693A146CC0643B02F3481C94580329] overlap;

    constructor() public {
        a = 1;
        b = 2;
        c = 3;
        d[0x123] = true;
        f.a = 5;
    }

    function get1234Slot() external pure returns (uint256 offset) {
        assembly {
            offset := a_slot
        }
    }

    function getHelloSlot() external pure returns (uint256 offset) {
        assembly {
            offset := b_slot
        }
    }

    function getRegularSlot() external pure returns (uint256 offset) {
        assembly {
            offset := c_slot
        }
    }

    function getOverlapSlot() external pure returns (uint256 offset) {
        assembly {
            offset := overlap_slot
        }
    }

}
