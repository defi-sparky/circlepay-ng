// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockUSDC
 * @notice Test USDC token for local Hardhat testing only.
 *         Do NOT deploy to any real network.
 * @dev Mimics USDC: 6 decimals, mintable by anyone (test only).
 */
contract MockUSDC {
    string public constant name     = "USD Coin";
    string public constant symbol   = "USDC";
    uint8  public constant decimals = 6;

    uint256 public totalSupply;

    mapping(address => uint256)                     private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Anyone can mint in tests
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        totalSupply    += amount;
        emit Transfer(address(0), to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "MockUSDC: insufficient allowance");
        if (allowed != type(uint256).max) {
            _allowances[from][msg.sender] -= amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(_balances[from] >= amount, "MockUSDC: insufficient balance");
        _balances[from] -= amount;
        _balances[to]   += amount;
        emit Transfer(from, to, amount);
    }
}
