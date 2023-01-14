import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { BigNumber, providers, utils } from "ethers";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
	getCDTokensBalance,
	getEtherBalance,
	getLPTokensBalance,
	getReserveOfCDTokens,
} from "../utils/getAmounts";
import {
	getTokensAfterRemove,
	removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
	const zero = BigNumber.from(0);
	const [loading, setLoading] = useState(false);
	const [liquidityTab, setLiquidityTab] = useState(false);
	const [ethBalance, setEthBalance] = useState(zero);
	const [reservedCD, setReservedCD] = useState(zero);
	const [etherBalanceContract, setEthBalanceContract] = useState(zero);
	const [cdBalance, setCDBalance] = useState(zero);
	const [lpBalance, setLPBalance] = useState(zero);
	const [addEther, setAddEther] = useState(zero);
	const [addCDTokens, setAddCDTokens] = useState(zero);
	const [removeEther, setRemoveEther] = useState(zero);
	const [removeCD, setRemoveCD] = useState(zero);
	const [removeLPTokens, setRemoveLPTokens] = useState("0");
	const [swapAmount, setSwapAmount] = useState("");
	const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] =
		useState(zero);
	const [ethSelected, setEthSelected] = useState(true);
	const web3ModalRef = useRef();
	const [walletConnected, setWalletConnected] = useState(false);

	const getAmounts = async () => {
		try {
			const provider = await getProviderOrSigner(false);
			const signer = await getProviderOrSigner(true);
			const address = await signer.getAddress();

			const _ethBalance = await getEtherBalance(provider, address);
			const _cdBalance = await getCDTokensBalance(provider, address);
			const _lpBalance = await getLPTokensBalance(provider, address);
			const _reservedCD = await getReserveOfCDTokens(provider, address);
			const _ethBalanceContract = await getEtherBalance(provider, null, true);
			setEthBalance(_ethBalance);
			setCDBalance(_cdBalance);
			setLPBalance(_lpBalance);
			setReservedCD(_reservedCD);
			setEthBalanceContract(_ethBalanceContract);
		} catch (error) {
			console.error(error);
		}
	};

	const _swapTokens = async () => {
		try {
			const swapAmountWei = utils.parseEther(swapAmount);
			if (!swapAmountWei.eq(zero)) {
				const signer = await getProviderOrSigner(true);
				setLoading(true);
				await swapTokens(
					signer,
					swapAmountWei,
					tokenToBeReceivedAfterSwap,
					ethSelected
				);
				setLoading(false);
				await getAmounts();
				setSwapAmount("");
			}
		} catch (error) {
			console.error(error);
			setLoading(false);
			setSwapAmount("");
		}
	};

	const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
		try {
			const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
			if (!_swapAmountWEI.eq(zero)) {
				const provider = await getProviderOrSigner();
				const _ethBalance = await getEtherBalance(provider, null, true);
				const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
					_swapAmountWEI,
					provider,
					ethSelected,
					_ethBalance,
					reservedCD
				);
				setTokenToBeReceivedAfterSwap(amountOfTokens);
			} else {
				setTokenToBeReceivedAfterSwap(zero);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const _addLiquidity = async () => {
		try {
			const addEtherWei = utils.parseEther(addEther.toString());
			if (!addCDTokens.eq(zero) && !addEtherWai.eq(zero)) {
				const signer = await getProviderOrSigner(true);
				setLoading(true);
				await addLiquidity(
					signer,
					addCDTokens,
					addEtherWei
				);
				setLoading(false);
				setAddCDTokens(zero);
				await getAmounts();
			} else {
				setAddCDTokens(zero);
			}
		} catch (error) {
			console.error(error);
			setLoading(false);
			setAddCDTokens(zero)
		}
	};

	const _removeLiquidity = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const removeLPTokensWei = utils.parseEther(removeLPTokens);
			setLoading(true);
			await removeLiquidity(signer, removeLPTokensWei);
			setLoading(false);
			await getAmounts();
			setRemoveCD(zero);
			setRemoveEther(zero);
		} catch (error) {
			console.error(error);
			setLoading(false);
			setRemoveCD(zero);
			setRemoveEther(zero);
		}
	};

	const _getTokensAfterRemove = async (_removeLPTokens) => {
		try {
			const provider = await getProviderOrSigner();
			const removeLPTokenWei = utils.parseEther(_removeLPTokens);
			const _ethBalance = await getEtherBalance(provider, null, true);
			const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
			const { _removeEther, _removeCD } = await getTokensAfterRemove(
				provider,
				removeLPTokenWei,
				_ethBalance,
				cryptoDevTokenReserve
			);
			setRemoveEther(_removeEther);
			setRemoveCD(_removeCD);
		} catch (error) {
			console.error(error);
		}
	};

	const connectWallet = async () => {
		try {
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (err) {
			console.error(err);
		}
	};

	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);
		const { chainId } = await web3Provider.getNetwork();
		if (chainId !== 5) {
			window.alert("Change the network to Goerli");
			throw new Error("Change network to Goerli");
		}

		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}
		return web3Provider;
	};

	useEffect(() => {
		if (!walletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "goerli",
				providerOptions: {},
				disableInjectedProvider: false,
			});
			connectWallet();
			getAmounts();
		}
	}, [walletConnected]);

	const renderButton = () => {
		if (!walletConnected) {
			return (
				<button onClick={connectWallet} className={styles.button}>
					Connect your wallet
				</button>
			);
		}

		if (loading) {
			return <button className={styles.button}>Loading...</button>;
		}

		if (liquidityTab) {
			return (
				<div>
					<div className={styles.description}>
						You have:
						<br />
						{utils.formatEther(cdBalance)} Crypto Dev Tokens
						<br />
						{utils.formatEther(ethBalance)} Ethereum<br />
						{utils.formatEther(lpBalance)} Crypto Dev LP Tokens
					</div>
					<div>
						{utils.parseEther(reservedCD.toString()).eq(zero) ? (
							<div>
								<input
									type="number"
									placeholder="Amount of Ether"
									onChange={(e) => setAddEther(e.target.value || "0")}
									className={styles.input}
								/>
								<input
									type="number"
									placeholder="Amount of CryptoDev tokens"
									onChange={(e) =>
										setAddCDTokens(
											BigNumber.from(utils.parseEther(e.target.value || "0"))
										)
									}
									className={styles.input}
								/>
								<button className={styles.button1} onClick={_addLiquidity}>
									Add
								</button>
							</div>
						) : (
							<div>
								<input
									type="number"
									placeholder="Amount of Ether"
									onChange={async (e) => {
										setAddEther(e.target.value || "0");
										const _addCDTokens = await calculateCD(
											e.target.value || "0",
											etherBalanceContract,
											reservedCD
										);
										setAddCDTokens(_addCDTokens);
									}}
									className={styles.input}
								/>
								<div className={styles.inputDiv}>
									{`You will need ${utils.formatEther(addCDTokens)} Crypto Dev
                  Tokens`}
								</div>
								<button className={styles.button1} onClick={_addLiquidity}>
									Add
								</button>
							</div>
						)}
						<div>
							<input
								type="number"
								placeholder="Amount of LP Tokens"
								onChange={async (e) => {
									setRemoveLPTokens(e.target.value || "0");
									await _getTokensAfterRemove(e.target.value || "0");
								}}
								className={styles.input}
							/>
							<div className={styles.inputDiv}>
								{`You will get ${utils.formatEther(removeCD)} Crypto
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
							</div>
							<button className={styles.button1} onClick={_removeLiquidity}>
								Remove
							</button>
						</div>
					</div>
				</div>
			);
		} else {
			return (
				<div>
					<input
						type="number"
						placeholder="Amount"
						onChange={async (e) => {
							setSwapAmount(e.target.value || "");
							await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
						}}
						className={styles.input}
						value={swapAmount}
					/>
					<select
						className={styles.select}
						name="dropdown"
						id="dropdown"
						onChange={async () => {
							setEthSelected(!ethSelected);
							await _getAmountOfTokensReceivedFromSwap(0);
							setSwapAmount("");
						}}
					>
						<option value="eth">Ethereum</option>
						<option value="cryptoDevToken">Crypto Dev Token</option>
					</select>
					<br />
					<div className={styles.inputDiv}>
						{ethSelected
							? `You will get ${utils.formatEther(
								tokenToBeReceivedAfterSwap
							)} Crypto Dev Tokens`
							: `You will get ${utils.formatEther(
								tokenToBeReceivedAfterSwap
							)} Eth`}
					</div>
					<button className={styles.button1} onClick={_swapTokens}>
						Swap
					</button>
				</div>
			)
		}
	}


	return (
		<div>
			<Head>
				<title>Crypto Devs</title>
				<meta name="description" content="Whitelist-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to Crypto Devs Exchange!</h1>
					<div className={styles.description}>
						Exchange Ethereum &#60;&#62; Crypto Dev Tokens
					</div>
					<div>
						<button
							className={styles.button}
							onClick={() => {
								setLiquidityTab(true);
							}}
						>
							Liquidity
						</button>
						<button
							className={styles.button}
							onClick={() => {
								setLiquidityTab(false);
							}}
						>
							Swap
						</button>
					</div>
					{renderButton()}
				</div>
				<div>
					<img className={styles.image} src="./cryptodev.svg" />
				</div>
			</div>

			<footer className={styles.footer}>
				Made with &#10084; by Crypto Devs
			</footer>
		</div>
	);
}