import React, { useMemo, useEffect, useState } from "react";
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
import { Provider } from "@reef-chain/evm-provider";
import { Keyring, WsProvider } from "@polkadot/api";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faCircleXmark,
  faExpand,
  faShuffle,
  faTasks,
} from "@fortawesome/free-solid-svg-icons";
import Uik from "@reef-chain/ui-kit";

import {
  AvailableNetwork,
  CLIENT_ID,
  LOGIN_PROVIDERS,
  REEF_LOGO,
  ReefNetwork,
  reefNetworks,
  WEB3_AUTH_NETWORK,
} from "../config";
import {
  createAccountSuri,
  getDetachedWindowId,
  selectAccount,
  selectNetwork,
  setDetachedWindowId,
  subscribeAccounts,
  subscribeAuthorizeRequests,
  subscribeMetadataRequests,
  subscribeNetwork,
  subscribeSigningRequests,
} from "./messaging";
import {
  AccountJson,
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest,
} from "../extension-base/background/types";
import Account from "./Accounts/Account";
import { Signing } from "./Signing";
import { Metadata } from "./Metadata";
import { Authorize } from "./Authorize";
import { AuthManagement } from "./AuthManagement";
import { createPopupData } from "./util";
import "./popup.css";
import { PHISHING_PAGE_REDIRECT } from "../extension-base/defaults";
import { PhishingDetected } from "./PhishingDetected";

const enum State {
  ACCOUNTS,
  LOGIN,
  AUTH_REQUESTS,
  META_REQUESTS,
  SIGN_REQUESTS,
  AUTH_MANAGEMENT,
  PHISHING_DETECTED,
}

const Popup = () => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [state, setState] = useState<State>(State.ACCOUNTS);
  const [accounts, setAccounts] = useState<null | AccountJson[]>(null);
  const [selectedAccount, setSelectedAccount] = useState<null | AccountJson>(
    null
  );
  const [authRequests, setAuthRequests] = useState<null | AuthorizeRequest[]>(
    null
  );
  const [metaRequests, setMetaRequests] = useState<null | MetadataRequest[]>(
    null
  );
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(
    null
  );
  const [selectedNetwork, setSelectedNetwork] = useState<ReefNetwork>();
  const [provider, setProvider] = useState<Provider>();

  const queryParams = new URLSearchParams(window.location.search);
  const isDetached = queryParams.get("detached");
  const phishingWebsite = queryParams.get(PHISHING_PAGE_REDIRECT);

  useEffect(() => {
    if (!isDefaultPopup || isDetached) {
      Promise.all([
        subscribeAccounts(onAccountsChange),
        subscribeAuthorizeRequests(setAuthRequests),
        subscribeMetadataRequests(setMetaRequests),
        subscribeSigningRequests(setSignRequests),
        subscribeNetwork(onNetworkChange),
      ]).catch(console.error);
    } else {
      focusOrCreateDetached();
    }
  }, []);

  useEffect(() => {
    if (selectedNetwork && !web3auth) {
      initWeb3Auth();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (phishingWebsite) {
      setState(State.PHISHING_DETECTED);
    } else if (!selectedAccount) {
      setState(State.ACCOUNTS);
    } else if (authRequests?.length) {
      setState(State.AUTH_REQUESTS);
    } else if (metaRequests?.length) {
      setState(State.META_REQUESTS);
    } else if (signRequests?.length) {
      setState(State.SIGN_REQUESTS);
    } else {
      setState(State.ACCOUNTS);
    }
  }, [
    authRequests,
    metaRequests,
    signRequests,
    selectedAccount,
    phishingWebsite,
  ]);

  const isDefaultPopup = useMemo(() => {
    return window.innerWidth <= 400;
  }, []);

  const focusOrCreateDetached = async () => {
    const detachedWindowId = await getDetachedWindowId();
    if (detachedWindowId) {
      chrome.windows.update(detachedWindowId, { focused: true }, (win) => {
        if (chrome.runtime.lastError || !win) {
          createDetached();
        } else {
          window.close();
        }
      });
    } else {
      createDetached();
    }
  };

  const createDetached = async () => {
    chrome.windows.getCurrent((win) => {
      chrome.windows.create(createPopupData(win), (detachedWindow) => {
        setDetachedWindowId(detachedWindow.id);
        window.close();
      });
    });
  };

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

  const openFullPage = () => {
    const url = `${chrome.runtime.getURL("index.html")}`;
    void chrome.tabs.create({ url });
    window.close();
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
          // whiteLabel: {
          //   appName: "Reef Web3Auth Wallet",
          //   appUrl: "https://reef.io/",
          //   logoLight: REEF_LOGO,
          //   logoDark: REEF_LOGO,
          //   defaultLanguage: "en",
          //   mode: "dark",
          //   theme: {
          //     primary: "#5d3bad",
          //   },
          //   useLogoLoader: true,
          // },
        },
        privateKeyProvider,
      });
      web3auth.configureAdapter(openloginAdapter);

      await web3auth.init();
    } catch (err: any) {
      console.error(err);
    }
  };

  const addAccount = async (
    loginProvider: string,
    web3auth: Web3AuthNoModal
  ) => {
    const web3authProvider = await login(loginProvider, web3auth);
    if (!web3authProvider) {
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
      Uik.notify.info("Account already exists");
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

  const getOrRefreshAuth = async () => {
    if (!web3auth) {
      alert("web3auth not initialized yet");
      return null;
    }

    if (!selectedAccount) {
      alert("No account selected");
      return null;
    }

    const web3authProvider = await login(
      selectedAccount.loginProvider as string,
      web3auth
    );
    if (!web3authProvider) {
      return null;
    }

    const privateKey = (await web3authProvider.request({
      method: "private_key",
    })) as string;
    const keyring = new Keyring({ type: "sr25519" });
    const keyPair = keyring.addFromUri("0x" + privateKey);
    if (keyPair.address !== selectedAccount.address) {
      setSelectedAccount(
        accounts
          ? accounts.find((acc) => acc.address === keyPair.address) ||
              accounts[0]
          : null
      );
      alert("Logged in to wrong account");
      return null;
    }

    return privateKey.substring(0, 12);
  };

  const login = async (loginProvider: string, web3auth: Web3AuthNoModal) => {
    if (LOGIN_PROVIDERS.indexOf(loginProvider) === -1) {
      alert("Invalid login provider");
      return null;
    }

    if (!web3auth) {
      alert("web3auth not initialized yet");
      return null;
    }

    if (web3auth.connected) {
      await web3auth.logout();
    }

    const web3authProvider = await web3auth.connectTo<OpenloginLoginParams>(
      WALLET_ADAPTERS.OPENLOGIN,
      { loginProvider }
    );
    if (!web3authProvider) {
      alert("web3authProvider not initialized yet");
      return null;
    }

    return web3authProvider;
  };

  return (
    <div className="popup">
      {process.env.NODE_ENV === "development" && (
        <div className="absolute left-5 top-3 text-gray-400">
          <span>DEV</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between">
        {selectedNetwork && (
          <div className="flex">
            {selectedNetwork.name=="Reef Mainnet"?<Uik.ReefLogo/>:<Uik.ReefTestnetLogo/>}
          </div>
        )}

        <div>
          {selectedNetwork && <button
              className="md"
              onClick={() =>
                selectNetwork(
                  selectedNetwork.id === "mainnet" ? "testnet" : "mainnet"
                )
              }
            >
              <FontAwesomeIcon icon={faShuffle as IconProp} />
            </button>}
          {isDetached && (
            <button className="md" onClick={() => openFullPage()}>
              <FontAwesomeIcon icon={faExpand as IconProp} />
            </button>
          )}
          {state === State.ACCOUNTS && (
            <>
              <button
                className="md"
                onClick={() => setState(State.AUTH_MANAGEMENT)}
              >
                <FontAwesomeIcon icon={faTasks as IconProp} />
              </button>
              <button className="md" onClick={() => setState(State.LOGIN)}>
                <FontAwesomeIcon icon={faCirclePlus as IconProp} />
              </button>
            </>
          )}
          {(state === State.AUTH_MANAGEMENT ||
            state === State.LOGIN ||
            state === State.PHISHING_DETECTED) && (
            <button className="md" onClick={() => setState(State.ACCOUNTS)}>
              <FontAwesomeIcon icon={faCircleXmark as IconProp} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {state === State.ACCOUNTS &&
        (!accounts || (accounts.length > 0 && !provider)) && (
          <Uik.Loading className="py-32" />
        )}

      {/* No accounts */}
      {state === State.ACCOUNTS && accounts?.length === 0 && (
        <>
          <div className="text-lg mt-12">No accounts available.</div>
          <Uik.Button onClick={() => setState(State.LOGIN)} text="Add account" icon={faCirclePlus as IconProp}/>
        </>
      )}

      {/* Selected account */}
      {(state === State.ACCOUNTS || state === State.SIGN_REQUESTS) &&
        selectedAccount &&
        provider && (
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

      {/* Pending authorization requests */}
      {state === State.AUTH_REQUESTS && <Authorize requests={authRequests} />}

      {/* Pending metadata requests */}
      {state === State.META_REQUESTS && <Metadata requests={metaRequests} />}

      {/* Pending signing requests */}
      {state === State.SIGN_REQUESTS && (
        <Signing requests={signRequests} getOrRefreshAuth={getOrRefreshAuth} />
      )}

      {/* Auth management */}
      {state === State.AUTH_MANAGEMENT && <AuthManagement />}

      {/* Login */}
      {state === State.LOGIN && (
       <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
       <Uik.Text className="text-lg my-4" text="Choose login provider"/>
       <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
         {LOGIN_PROVIDERS.map((provider) => (
           <button
             className="group relative overflow-hidden"
             key={provider}
             onClick={() => addAccount(provider, web3auth)}
             style={{ flex: "1", position: "relative", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center",width: '400px',border:'1px solid #5f636863' }}
           >
             <div className="flex min-w-max">
               <span
                 className="absolute inset-0 filter blur-md"
                 style={{ zIndex: "-1", backgroundImage: `url(/icons/login_providers/login-${provider}-active.svg)`, backgroundSize: "cover", backgroundPosition: "center", opacity: "0.7" }}
               />
               <img
                 className="group-hover:block h-6"
                 src={`/icons/login_providers/login-${provider}-active.svg`}
                 alt={`${provider} icon`}
               />
               <Uik.Text text={provider.toUpperCase()} className="pl-2"/>
             </div>
           </button>
         ))}
       </div>
     </div>
     
     
      )}

      {/* Phishing detected */}
      {state === State.PHISHING_DETECTED && (
        <PhishingDetected website={phishingWebsite} />
      )}
    </div>
  );
};

export default Popup;
