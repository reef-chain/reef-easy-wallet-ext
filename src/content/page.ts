import {
  injectExtension,
  REEF_EXTENSION_IDENT,
  REEF_INJECTED_EVENT,
  startInjection,
} from "@reef-defi/extension-inject";
import Injected from "@reef-defi/extension-base/page/Injected";
import SendRequest from "@reef-defi/extension-base/page";
import {
  EXTENSION_INJECTED_EVENT,
  EXTENSION_NAME,
  EXTENSION_VERSION,
} from "../popup/config";
import Accounts from "@reef-defi/extension-base/page/Accounts";
import Metadata from "@reef-defi/extension-base/page/Metadata";
import {
  InjectedAccount,
  InjectedMetadataKnown,
  ReefInjectedProvider,
  ReefInjectedSigner,
  Unsubcall,
} from "@reef-defi/extension-inject/types";
import PostMessageProvider from "@reef-defi/extension-base/page/PostMessageProvider";
import SigningKey from "@reef-defi/extension-base/page/Signer";

startInjection(REEF_EXTENSION_IDENT);

function enable(originName: string): Promise<Injected> {
  const accounts: Accounts = {
    get: (anyType?: boolean): Promise<InjectedAccount[]> => {
      return new Promise((resolve, reject) => {
        resolve([]);
        reject(new Error("Error in get()"));
      });
    },
    subscribe: (cb: (accounts: InjectedAccount[]) => unknown): Unsubcall => {
      let unsubs = false;
      return (): void => {
        unsubs = true;
      };
    },
  };

  const metadata: Metadata = {
    get: (): Promise<InjectedMetadataKnown[]> => {
      return new Promise((resolve, reject) => {
        resolve([]);
        reject(new Error("Error in get()"));
      });
    },
    provide: (definition: unknown): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        resolve(true);
        reject(new Error("Error in provide()"));
      });
    },
  };

  let provider: PostMessageProvider;
  let signer: SigningKey;

  let reefProvider: ReefInjectedProvider;
  let reefSigner: ReefInjectedSigner;

  const reefInjected: Injected = {
    accounts,
    metadata,
    provider,
    signer,
    reefProvider,
    reefSigner,
  };

  return new Promise((resolve, reject) => {
    resolve(reefInjected);
    reject(new Error("Error in enable()"));
  });
}

function inject() {
  injectExtension(enable, {
    name: EXTENSION_NAME,
    version: EXTENSION_VERSION,
  });
  const event = new Event(REEF_INJECTED_EVENT); // EXTENSION_INJECTED_EVENT

  document.dispatchEvent(event);
}

// TODO redirectIfPhishing
inject();
