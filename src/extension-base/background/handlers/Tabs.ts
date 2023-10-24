import { checkIfDenied } from "@polkadot/phishing";
import {
  MessageTypes,
  RequestAuthorizeTab,
  RequestRpcSend,
  RequestTypes,
  ResponseRpcListProviders,
  ResponseTypes,
} from "../types";

import type { KeyringPair } from "@polkadot/keyring/types";
import { assert, isNumber } from "@polkadot/util";
import { createSubscription, unsubscribe } from "./subscriptions";
import {
  SingleAddress,
  SubjectInfo,
} from "@polkadot/ui-keyring/observable/types";
import type { JsonRpcResponse } from "@polkadot/rpc-provider/types";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import {
  InjectedAccount,
  InjectedMetadataKnown,
  MetadataDef,
  ProviderMeta,
} from "../../../extension-inject/types";
import type {
  RequestRpcSubscribe,
  ResponseSigning,
  SubscriptionMessageTypes,
  RequestRpcUnsubscribe,
  RequestAccountList,
} from "../types";
import { accounts as accountsObservable } from "@polkadot/ui-keyring/observable/accounts";
import { KeypairType } from "@polkadot/util-crypto/types";
import { getSelectedAccountIndex, networkRpcUrlSubject } from "./Extension";
import { PHISHING_PAGE_REDIRECT } from "../../../defaults";
import keyring from "@polkadot/ui-keyring";
import RequestExtrinsicSign from "../RequestExtrinsicSign";
import State from "./State";

function canDerive(type?: KeypairType): boolean {
  return !!type && ["ed25519", "sr25519", "ecdsa", "ethereum"].includes(type);
}

function transformAccounts(
  accounts: SubjectInfo,
  anyType = false
): InjectedAccount[] {
  const accs = Object.values(accounts);

  const filtered = accs
    .filter(
      ({
        json: {
          meta: { isHidden },
        },
      }) => !isHidden
    )
    .filter(({ type }) => (anyType ? true : canDerive(type)))
    .sort(
      (a, b) => (a.json.meta.whenCreated || 0) - (b.json.meta.whenCreated || 0)
    );

  const selIndex = getSelectedAccountIndex(accs.map((sa) => sa.json));
  let selAccountAddress: string;

  if (selIndex != null) {
    selAccountAddress = accs[selIndex].json.address;
  }

  return filtered.map((val: SingleAddress): InjectedAccount => {
    const {
      json: {
        address,
        meta: { genesisHash, name },
      },
      type,
    } = val;

    return {
      address,
      genesisHash,
      name,
      type,
      isSelected: address === selAccountAddress,
    };
  });
}

export default class Tabs {
  readonly #state: State;

  constructor(state: State) {
    this.#state = state;
  }

  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    url: string,
    port: chrome.runtime.Port
  ): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === "pub(network.subscribe)") {
      return this.networkSubscribe(id, port);
    }

    if (type === "pub(phishing.redirectIfDenied)") {
      return this.redirectIfPhishing(url);
    }

    if (type !== "pub(authorize.tab)") {
      // TODO
      //   this.#state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case "pub(authorize.tab)":
        // TODO
        // return this.authorize(url, request as RequestAuthorizeTab);
        return true;

      case "pub(accounts.list)":
        return this.accountsList(url, request as RequestAccountList);

      case "pub(accounts.subscribe)":
        return this.accountsSubscribe(url, id, port);

      case "pub(extrinsic.sign)":
        return this.extrinsicSign(url, request as SignerPayloadJSON);

      case "pub(metadata.list)":
        return this.metadataList(url);

      case "pub(metadata.provide)":
        return this.metadataProvide(url, request as MetadataDef);

      case "pub(rpc.listProviders)":
        return this.rpcListProviders();

      case "pub(rpc.send)":
        return this.rpcSend(request as RequestRpcSend, port);

      case "pub(rpc.startProvider)":
        return this.rpcStartProvider(request as string, port);

      case "pub(rpc.subscribe)":
        return this.rpcSubscribe(request as RequestRpcSubscribe, id, port);

      case "pub(rpc.subscribeConnected)":
        return this.rpcSubscribeConnected(request as null, id, port);
    }
  }

  private networkSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pub(network.subscribe)">(id, port);
    const subscription = networkRpcUrlSubject.subscribe(
      (rpcUrl: string): void => cb(rpcUrl)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private accountsList(
    url: string,
    { anyType }: RequestAccountList
  ): InjectedAccount[] {
    return transformAccounts(accountsObservable.subject.getValue(), anyType);
  }

  private accountsSubscribe(
    url: string,
    id: string,
    port: chrome.runtime.Port
  ): boolean {
    const cb = createSubscription<"pub(accounts.subscribe)">(id, port);
    const subscription = accountsObservable.subject.subscribe(
      (accounts: SubjectInfo): void => {
        return cb(transformAccounts(accounts));
      }
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private getSigningPair(address: string): KeyringPair {
    const pair = keyring.getPair(address);

    assert(pair, "Unable to find keypair");

    return pair;
  }

  private extrinsicSign(
    url: string,
    request: SignerPayloadJSON
  ): Promise<ResponseSigning> {
    const address = request.address;
    const pair = this.getSigningPair(address);

    return this.#state.sign(url, new RequestExtrinsicSign(request), {
      address,
      ...pair.meta,
    });
  }

  private metadataProvide(url: string, request: MetadataDef): Promise<boolean> {
    // return this.#state.injectMetadata(url, request);
    return Promise.resolve(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private metadataList(url: string): InjectedMetadataKnown[] {
    return this.#state.knownMetadata.map(({ genesisHash, specVersion }) => ({
      genesisHash,
      specVersion,
    }));
  }

  private rpcListProviders(): Promise<ResponseRpcListProviders> {
    //   return this.#state.rpcListProviders();
    return Promise.resolve(null);
  }

  // private rpcSend(
  //   request: RequestRpcSend,
  //   port: chrome.runtime.Port
  // ): Promise<JsonRpcResponse> {
  //   return this.#state.rpcSend(request, port);
  // }

  private rpcSend(
    request: RequestRpcSend,
    port: chrome.runtime.Port
  ): Promise<null> {
    return Promise.resolve(null);
  }

  private rpcStartProvider(
    key: string,
    port: chrome.runtime.Port
  ): Promise<ProviderMeta> {
    // return this.#state.rpcStartProvider(key, port);
    return Promise.resolve(null);
  }

  private async rpcSubscribe(
    request: RequestRpcSubscribe,
    id: string,
    port: chrome.runtime.Port
  ): Promise<boolean> {
    const innerCb = createSubscription<"pub(rpc.subscribe)">(id, port);
    const cb = (
      _error: Error | null,
      data: SubscriptionMessageTypes["pub(rpc.subscribe)"]
    ): void => innerCb(data);
    // const subscriptionId = await this.#state.rpcSubscribe(request, cb, port);

    // port.onDisconnect.addListener((): void => {
    //   unsubscribe(id);
    //   this.rpcUnsubscribe({ ...request, subscriptionId }, port).catch(
    //     console.error
    //   );
    // });

    return true;
  }

  private rpcSubscribeConnected(
    request: null,
    id: string,
    port: chrome.runtime.Port
  ): Promise<boolean> {
    const innerCb = createSubscription<"pub(rpc.subscribeConnected)">(id, port);
    const cb = (
      _error: Error | null,
      data: SubscriptionMessageTypes["pub(rpc.subscribeConnected)"]
    ): void => innerCb(data);

    // this.#state.rpcSubscribeConnected(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return Promise.resolve(true);
  }

  // private async rpcUnsubscribe(
  //   request: RequestRpcUnsubscribe,
  //   port: chrome.runtime.Port
  // ): Promise<boolean> {
  //   return this.#state.rpcUnsubscribe(request, port);
  // }

  private redirectPhishingLanding(phishingWebsite: string): void {
    const nonFragment = phishingWebsite.split("#")[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.runtime.getURL(
      "index.html"
    )}#${PHISHING_PAGE_REDIRECT}/${encodedWebsite}`;

    chrome.tabs.query({ url: nonFragment }, (tabs) => {
      tabs
        .map(({ id }) => id)
        .filter((id): id is number => isNumber(id))
        .forEach(
          (id) =>
            // eslint-disable-next-line no-void
            void chrome.tabs.update(id, { url })
        );
    });
  }

  private async redirectIfPhishing(url: string): Promise<boolean> {
    // const isInDenyList = await checkIfDenied(url);

    // if (isInDenyList) {
    //   this.redirectPhishingLanding(url);

    //   return true;
    // }

    return false;
  }
}
