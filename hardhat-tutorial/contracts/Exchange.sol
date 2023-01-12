// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20 {
	address public cryptoDevTokenAddress;

	constructor(address _CryptoDevtoken) ERC20("CryptoDev LP Token", "CDLP") {
		require(_CryptoDevToken != address(0), "Token address passed is a null address");
		cryptoDevTokenAddress = _CryptoDevtoken;
	}

	function getReserve() public view returns(uint) {
		return ERC20(cryptoDevTokenAddress).balanceOf(address(this));
	}

	function addLiquidity(uint _amount) public payable returns(uint) {
		uint liquidity;
		uint ethBalance = address(this).balance;
		uint cryptoDevTokenReserve = getReserve();
		ERC20 cryptoDevToken = ERC20(cryptoDevTokenAddress);

		if(cryptoDevTokenReserve == 0) {
			cryptoDevToken.transferFrom(msg.sender, address(this), _amount);
			uint ethAmount = (ethReserve * _amount)/_totalSupply;
			uint cryptoDevTokenAmount = (getReserve() * _amount)/_totalSupply;
			_burn(msg.sender, _amount);
			payable(msg.sender).transfer(ethAmount);
			ERC20(cryptoDevTokenAddress).transfer(msg.sender, cryptoDevTokenAmount);
			return (ethAmount, cryptoDevTokenAmount);
		}
	}

	function getAmountOfToken(
		uint256 inputAmount,
		uint256 inputReserve,
		uint256 outputReserve
	) public pure returns(uint256) {
		require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
		uint256 inputAmountWithFee = inputAmount * 99;
		uint256 numerator = inputAmountWithFee * outputReserve;
		uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
		return numerator / denominator;
	}

}