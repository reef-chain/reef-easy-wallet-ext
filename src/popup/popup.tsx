import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  OpenloginAdapter,
  OpenloginLoginParams,
  UX_MODE,
} from "@web3auth/openlogin-adapter";
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import {
  AvailableNetwork,
  CLIENT_ID,
  LOGIN_PROVIDERS,
  REEF_LOGO,
  ReefNetwork,
  reefNetworks,
  WEB3_AUTH_NETWORK,
} from "../config";
import "./popup.css";
import {
  createAccountSuri,
  selectAccount,
  selectNetwork,
  subscribeAccounts,
  subscribeNetwork,
  subscribeSigningRequests,
} from "./messaging";
import {
  AccountJson,
  SigningRequest,
} from "../extension-base/background/types";
import Signing from "./Signing";
import { Provider } from "@reef-chain/evm-provider";
import { WsProvider } from "@polkadot/api";
import Account from "./Accounts/Account";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faCircleXmark,
  faExpand,
  faShuffle,
} from "@fortawesome/free-solid-svg-icons";

const enum State {
  ACCOUNTS,
  SIGNING,
  LOGIN,
}

const Popup = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [state, setState] = useState<State>(State.ACCOUNTS);
  const [accounts, setAccounts] = useState<null | AccountJson[]>(null);
  const [selectedAccount, setSelectedAccount] = useState<null | AccountJson>(
    null
  );
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(
    null
  );
  const [selectedNetwork, setSelectedNetwork] = useState<ReefNetwork>();
  const [provider, setProvider] = useState<Provider>();

  const queryParams = new URLSearchParams(window.location.search);
  const loginProvider = queryParams.get("loginProvider");

  useEffect(() => {
    Promise.all([
      subscribeAccounts(onAccountsChange),
      subscribeSigningRequests(onSigningRequestsChange),
      subscribeNetwork(onNetworkChange),
    ]).catch(console.error);
  }, []);

  useEffect(() => {
    // TODO: why is it required to init w3a here?
    if (selectedNetwork && !web3auth) {
      initWeb3Auth();
    }
  }, [selectedNetwork]);

  const onAccountsChange = (_accounts: AccountJson[]) => {
    setAccounts(_accounts);
    setState(State.ACCOUNTS);

    if (!_accounts?.length) {
      setSelectedAccount(null);
      return;
    }

    const selAcc = _accounts.find((acc) => !!acc.isSelected);
    if (selAcc) {
      setSelectedAccount(selAcc);
    } else {
      selectAccount(_accounts[0].address);
      setSelectedAccount(_accounts[0]);
    }
  };

  const onSigningRequestsChange = (_signRequests: SigningRequest[]) => {
    setSignRequests(_signRequests);
    if (_signRequests.length) {
      setState(State.SIGNING);
    } else {
      setState(State.ACCOUNTS);
    }
  };

  const onNetworkChange = async (networkId: AvailableNetwork) => {
    if (networkId !== selectedNetwork?.id) {
      setSelectedNetwork(reefNetworks[networkId]);

      const newProvider = new Provider({
        provider: new WsProvider(reefNetworks[networkId].rpcUrl),
      });
      try {
        await newProvider.api.isReadyOrError;
        setProvider(newProvider);
      } catch (e) {
        console.log("Provider isReadyOrError ERROR=", e);
        throw e;
      }
    }
  };

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
        rpcTarget: reefNetworks.mainnet.rpcUrl,
        chainNamespace: CHAIN_NAMESPACES.OTHER,
        displayName: reefNetworks.mainnet.name,
        ticker: "REEF",
        tickerName: "Reef",
        blockExplorer: reefNetworks.mainnet.reefScanUrl,
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

      if (loginProvider) {
        setState(State.LOGIN);
        window.history.replaceState({}, document.title, "/index.html");
        login(loginProvider, web3auth);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const addAccount = () => {
    setState(State.LOGIN);
  };

  const cancelLogin = async () => {
    setState(State.ACCOUNTS);
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

    if (web3auth.connected) {
      await web3auth.logout();
    }

    const web3authProvider = await web3auth.connectTo<OpenloginLoginParams>(
      WALLET_ADAPTERS.OPENLOGIN,
      { loginProvider }
    );
    if (!web3authProvider) {
      alert("web3authProvider not initialized yet");
      return;
    }

    const userInfo = await web3auth.getUserInfo();
    if (
      accounts.find(
        (acc) =>
          acc.loginProvider === loginProvider &&
          acc.verifierId === userInfo.verifierId
      )
    ) {
      alert("Account already exists");
      return;
    }

    const privateKey = (await web3authProvider.request({
      method: "private_key",
    })) as string;
    await createAccountSuri(
      privateKey,
      userInfo.name || "",
      loginProvider,
      userInfo.verifierId,
      userInfo.profileImage
    );
  };

  return (
    <div className="popup">
      {/* Header */}
      <div className="flex justify-between">
        {selectedNetwork && (
          <div>
            <span className="text-lg">{selectedNetwork.name}</span>
            <button
              className="md"
              onClick={() =>
                selectNetwork(
                  selectedNetwork.id === "mainnet" ? "testnet" : "mainnet"
                )
              }
            >
              <FontAwesomeIcon icon={faShuffle as IconProp} />
            </button>
          </div>
        )}

        <div>
          {isPopup && (
            <button className="md" onClick={() => openFullPage()}>
              <FontAwesomeIcon icon={faExpand as IconProp} />
            </button>
          )}
          {state === State.ACCOUNTS && (
            <button className="md" onClick={() => addAccount()}>
              <FontAwesomeIcon icon={faCirclePlus as IconProp} />
            </button>
          )}
          {state === State.LOGIN && (
            <button className="md" onClick={() => cancelLogin()}>
              <FontAwesomeIcon icon={faCircleXmark as IconProp} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {state === State.ACCOUNTS &&
        (!accounts || (accounts.length > 0 && !provider)) && (
          <div className="text-lg mt-12">Loading...</div>
        )}

      {/* No accounts */}
      {state === State.ACCOUNTS && accounts?.length === 0 && (
        <>
          <div className="text-lg mt-12">No accounts available.</div>
          <button onClick={addAccount}>Add account</button>
        </>
      )}

      {/* Selected account */}
      {state !== State.LOGIN && selectedAccount && provider && (
        <Account
          account={selectedAccount}
          provider={provider}
          isSelected={true}
        />
      )}

      {/* Other accounts */}
      {state === State.ACCOUNTS &&
        accounts?.length > 1 &&
        provider &&
        accounts
          .filter((account) => account.address !== selectedAccount.address)
          .map((account) => (
            <Account
              key={account.address}
              account={account}
              provider={provider}
            />
          ))}

      {/* Pending signing requests */}
      {state === State.SIGNING && Signing(signRequests)}

      {/* Login */}
      {state === State.LOGIN && (
        <div>
          <div className="text-lg mt-8">Choose login provider</div>
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
        </div>
      )}
    </div>
  );
};

export default Popup;
