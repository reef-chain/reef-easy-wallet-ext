import React, { useMemo } from "react";
import { useEffect, useRef, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  OpenloginAdapter,
  OpenloginLoginParams,
  UX_MODE,
} from "@web3auth/openlogin-adapter";
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
// import { ethers } from 'ethers';
// import Account from './Account';
// import RPC from "./rpc";
import {
  CLIENT_ID,
  LOGIN_PROVIDERS,
  REEFSCAN_URL,
  REEF_LOGO,
  REEF_NETWORK,
  RPC_URL,
  WEB3_AUTH_NETWORK,
} from "./config";
// import { ReefAccount, captureError } from './util';
import "./popup.css";

const Popup = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [web3authProvider, setWeb3authProvider] =
    useState<SafeEventEmitterProvider | null>(null);
  // const [reefAccount, setReefAccount] = useState<ReefAccount | null>(null);
  const [reefAccount, setReefAccount] = useState<any | null>(null);
  const [reefAccountLoading, setReefAccountLoading] = useState(false);
  const reefAccountRef = useRef(reefAccount);
  const queryParams = new URLSearchParams(window.location.search);
  const loginProvider = queryParams.get("loginProvider");
  console.log("loginProvider =", loginProvider);

  useEffect(() => {
    initWeb3Auth();
  }, []);

  useEffect(() => {
    if (web3auth?.connected && web3authProvider && !reefAccount) {
      getReefAccount();
    }
  }, [web3auth, web3authProvider]);

  const isPopup = useMemo(() => {
    return window.innerWidth <= 400;
  }, []);

  const openFullPage = (loginProvider?: string) => {
    const url = `${chrome.runtime.getURL(
      loginProvider ? `index.html?loginProvider=${loginProvider}` : "index.html"
    )}`;
    void chrome.tabs.create({ url });
  };

  const initWeb3Auth = async () => {
    try {
      const reefChainConfig: CustomChainConfig = {
        chainId: "0x3673",
        rpcTarget: RPC_URL,
        chainNamespace: CHAIN_NAMESPACES.OTHER,
        displayName: REEF_NETWORK,
        ticker: "REEF",
        tickerName: "Reef",
        blockExplorer: REEFSCAN_URL,
      };

      const web3auth = new Web3AuthNoModal({
        clientId: CLIENT_ID,
        web3AuthNetwork: WEB3_AUTH_NETWORK,
        chainConfig: reefChainConfig,
      });

      setWeb3auth(web3auth);

      const privateKeyProvider = new CommonPrivateKeyProvider({
        config: {
          chainConfig: reefChainConfig,
        },
      });

      const openloginAdapter = new OpenloginAdapter({
        adapterSettings: {
          clientId: CLIENT_ID,
          network: WEB3_AUTH_NETWORK,
          uxMode: UX_MODE.POPUP,
          // uxMode: UX_MODE.REDIRECT,
          // redirectUrl:
          //   "chrome-extension://ggmkeplalbadblhbbkcchekkfmmnoiln/index.html",
          whiteLabel: {
            appName: "Reef Web3Auth Wallet",
            appUrl: "https://reef.io/",
            logoLight: REEF_LOGO,
            logoDark: REEF_LOGO,
            defaultLanguage: "en",
            mode: "dark",
            theme: {
              primary: "#5d3bad",
            },
            useLogoLoader: true,
          },
        },
        privateKeyProvider,
      });
      web3auth.configureAdapter(openloginAdapter);

      await web3auth.init();

      if (web3auth.connectedAdapterName && web3auth.provider) {
        setWeb3authProvider(web3auth.provider);
      }
      if (!web3auth.connected && loginProvider) {
        login(loginProvider, web3auth);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const login = async (loginProvider: string, web3auth: Web3AuthNoModal) => {
    if (LOGIN_PROVIDERS.indexOf(loginProvider) === -1) {
      alert("Invalid login provider");
      return;
    }

    if (!web3auth) {
      alert("web3auth not initialized yet");
      return;
    }

    if (isPopup) openFullPage(loginProvider);

    const web3authProvider = await web3auth.connectTo<OpenloginLoginParams>(
      WALLET_ADAPTERS.OPENLOGIN,
      { loginProvider }
    );
    if (!web3authProvider) {
      alert("web3authProvider not initialized yet");
      return;
    }
    setWeb3authProvider(web3authProvider);
  };

  const logout = async () => {
    if (!web3auth) {
      alert("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setWeb3authProvider(null);
    setReefAccount(null);
    reefAccountRef.current = null;
    unsubBalance();
  };

  const authenticateUser = async () => {
    const idToken = await web3auth!.authenticateUser();
    console.log(idToken);
    alert("ID Token: " + idToken.idToken);
  };

  const getUserInfo = async () => {
    const user = await web3auth!.getUserInfo();
    console.log(user);
    alert("User Info: " + JSON.stringify(user));
  };

  const nativeTransfer = async () => {
    //     const rpc = new RPC(web3authProvider!);
    //     const txHash = await rpc.nativeTransfer(
    //       "5EnY9eFwEDcEJ62dJWrTXhTucJ4pzGym4WZ2xcDKiT3eJecP",
    //       1000
    //     );
    //     alert("Transaction Hash: " + txHash);
  };

  const signRaw = async () => {
    //     const rpc = new RPC(web3authProvider!);
    //     const signature = await rpc.signRaw("Hello World");
    //     alert("Signature: " + signature);
  };

  const getReefAccount = async () => {
    //     setReefAccountLoading(true);
    //     const user = await web3auth!.getUserInfo();
    //     const rpc = new RPC(web3authProvider!);
    //     const reefAccount = await rpc.getReefAccount(user.name || '');
    //     setReefAccount(reefAccount);
    //     setReefAccountLoading(false);
    //     reefAccountRef.current = reefAccount;
    //     subscribeBalance();
  };

  const claimDefaultEvmAccount = async () => {
    //     if (reefAccount!.balance < ethers.utils.parseEther("5").toBigInt()) {
    //       alert("Not enough balance for claiming EVM account. Transfer at least 5 REEF to your account first.");
    //       return;
    //     }
    //     const rpc = new RPC(web3authProvider!);
    //     rpc.claimDefaultEvmAccount(handleClaimEvmAccountStatus);
  };

  const claimEvmAccount = async () => {
    //     if (reefAccount!.balance < ethers.utils.parseEther("5").toBigInt()) {
    //       alert("Not enough balance for claiming EVM account. Transfer at least 5 REEF to your account first.");
    //       return;
    //     }
    //     // Set evm address and evm signature provided by the user
    //     const evmAddress = "";
    //     const signature = "";
    //     const rpc = new RPC(web3authProvider!);
    //     rpc.claimEvmAccount(evmAddress, signature, handleClaimEvmAccountStatus);
  };

  const handleClaimEvmAccountStatus = (status: any) => {
    //     console.log("status =", status)
    //     const err = captureError(status.events);
    //     if (err) {
    //       console.log("binding error", err);
    //       alert("Error while claiming EVM account");
    //     }
    //     if (status.dispatchError) {
    //       console.log("binding dispatch error", status.dispatchError.toString());
    //       alert("Error while claiming EVM account");
    //     }
    //     if (status.status.isInBlock) {
    //       console.log("Included at block hash", status.status.asInBlock.toHex());
    //       const rpc = new RPC(web3authProvider!);
    //       rpc.queryEvmAddress()
    //         .then(({ evmAddress, isEvmClaimed }) => {
    //           reefAccountRef.current = {
    //             ...reefAccountRef.current!,
    //             evmAddress,
    //             isEvmClaimed,
    //           };
    //           setReefAccount({
    //             ...reefAccountRef.current!,
    //             evmAddress,
    //             isEvmClaimed,
    //           });
    //         }).catch((err) => {
    //           console.log("queryEvmAddress error", err);
    //           alert("Error while claiming EVM account");
    //         });
    //     }
    //     if (status.status.isFinalized) {
    //       console.log("Finalized block hash", status.status.asFinalized.toHex());
    //     }
  };

  let unsubBalance = () => {};

  const subscribeBalance = async (): Promise<void> => {
    //     const rpc = new RPC(web3authProvider!);
    //     unsubBalance = await rpc.subscribeToBalance(async (balFree: bigint, address: string) => {
    //       if (reefAccountRef.current?.address === address) {
    //         reefAccountRef.current = {
    //           ...reefAccountRef.current,
    //           balance: balFree,
    //         };
    //         setReefAccount({
    //           ...reefAccountRef.current,
    //           balance: balFree,
    //         });
    //       }
    //     });
  };

  const evmTransaction = async () => {
    // const rpc = new RPC(web3authProvider!);
    // try {
    //   const res = await rpc.evmTransaction();
    //   console.log(res);
    //   alert("Transaction Hash: " + res.hash);
    // } catch (err) {
    //   console.log(err);
    //   alert(`Error: ${err}`);
    // }
  };

  return (
    <div className="popup">
      <h1>Reef Web3Auth Wallet</h1>
      {isPopup && <button onClick={() => openFullPage()}>Full page</button>}
      {web3auth && !web3auth.connected && (
        <>
          <h2>Login</h2>
          {LOGIN_PROVIDERS.map((provider) => (
            <button
              className="group"
              key={provider}
              onClick={() => login(provider, web3auth)}
            >
              <img
                className="group-hover:hidden h-6"
                src={`/icons/login_providers/login-${provider}-dark.svg`}
              ></img>
              <img
                className="hidden group-hover:block h-6"
                src={`/icons/login_providers/login-${provider}-active.svg`}
              ></img>
            </button>
          ))}
        </>
      )}
      {web3auth?.connected && (
        <>
          {reefAccountLoading && !reefAccount && (
            <div className="loading">Loading account...</div>
          )}
          {/* { reefAccount && <Account account={reefAccount} /> } */}
          <button onClick={getUserInfo}>Get User Info</button>
          <button onClick={authenticateUser}>Get ID Token</button>
          <button onClick={nativeTransfer}>Native transfer</button>
          <button onClick={signRaw}>Sign message</button>
          {reefAccount && !reefAccount.isEvmClaimed && (
            <>
              <button onClick={claimDefaultEvmAccount}>
                Claim default EVM account
              </button>
              {/* <button onClick={claimEvmAccount}>Claim owned EVM account</button> */}
            </>
          )}
          {reefAccount?.isEvmClaimed && (
            <>
              <button onClick={evmTransaction}>EVM transaction</button>
            </>
          )}
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
};

export default Popup;
