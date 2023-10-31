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
// import Account from "./Account";
import {
  CLIENT_ID,
  LOGIN_PROVIDERS,
  REEFSCAN_URL,
  REEF_LOGO,
  REEF_NETWORK,
  RPC_URL,
  WEB3_AUTH_NETWORK,
} from "./config";
import "./popup.css";
import { createAccountSuri, subscribeSigningRequests } from "./messaging";
import { ReefAccount } from "./Accounts/ReefAccount";
import { SigningRequest } from "../extension-base/background/types";
import Request from "./Signing/Request";
import Account from "./Accounts/Account";
import Signer from "../extension-base/page/Signer";
import Signing from "./Signing";

const Popup = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [web3authProvider, setWeb3authProvider] =
    useState<SafeEventEmitterProvider | null>(null);
  const [reefAccount, setReefAccount] = useState<ReefAccount | null>(null);
  const [reefAccountLoading, setReefAccountLoading] = useState(false);
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(
    null
  );
  const reefAccountRef = useRef(reefAccount);
  const queryParams = new URLSearchParams(window.location.search);
  const loginProvider = queryParams.get("loginProvider");

  const test = async () => {};

  useEffect(() => {
    initWeb3Auth();
    Promise.all([subscribeSigningRequests(setSignRequests)]).catch(
      console.error
    );
  }, []);

  useEffect(() => {
    if (web3auth?.connected && web3authProvider && !reefAccount) {
      getReefAccount();
      // saveAccount();
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

    // TODO only if not already created
    const privateKey = (await web3authProvider.request({
      method: "private_key",
    })) as string;
    const userInfo = await web3auth.getUserInfo();
    const substrateAddress = await createAccountSuri(
      privateKey,
      userInfo.name || ""
    );
    setReefAccount(new ReefAccount(substrateAddress, userInfo.name || ""));
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
  };

  const getReefAccount = async () => {
    const privateKey = (await web3authProvider.request({
      method: "private_key",
    })) as string;
    const userInfo = await web3auth.getUserInfo();
    const substrateAddress = await createAccountSuri(
      privateKey,
      userInfo.name || ""
    );
    setReefAccount(new ReefAccount(substrateAddress, userInfo.name || ""));
  };

  const claimDefaultEvmAccount = async (address: string) => {
    alert("TODO");
  };

  return (
    <div className="popup">
      {/* <button onClick={() => test()}>TEST</button> */}

      {isPopup && <button onClick={() => openFullPage()}>Full page</button>}

      {/* Not connected */}
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

      {/* Connected */}
      {web3auth?.connected && (
        <>
          {reefAccountLoading && !reefAccount && (
            <div className="loading">Loading account...</div>
          )}
          {reefAccount && <Account account={reefAccount} />}

          {!!signRequests?.length ? (
            // Pending signing requests
            Signing(signRequests)
          ) : (
            // No pending signing requests
            <>
              {reefAccount && !reefAccount.isEvmClaimed && (
                <>
                  <button
                    onClick={() => claimDefaultEvmAccount(reefAccount.address)}
                  >
                    Claim default EVM account
                  </button>
                </>
              )}
              {reefAccount?.isEvmClaimed && (
                <>
                  {/* <button onClick={evmTransaction}>EVM transaction</button> */}
                </>
              )}
              <button onClick={logout}>Logout</button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Popup;
