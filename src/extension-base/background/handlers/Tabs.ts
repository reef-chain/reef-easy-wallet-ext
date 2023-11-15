import { checkIfDenied } from "@polkadot/phishing";
import type { KeyringPair } from "@polkadot/keyring/types";
import { assert, isNumber } from "@polkadot/util";
import {
  SingleAddress,
  SubjectInfo,
} from "@polkadot/ui-keyring/observable/types";
import { accounts as accountsObservable } from "@polkadot/ui-keyring/observable/accounts";
import type { JsonRpcResponse } from "@polkadot/rpc-provider/types";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import keyring from "@polkadot/ui-keyring";

import {
  MessageTypes,
  RequestAuthorizeTab,
  RequestRpcSend,
  RequestTypes,
  ResponseRpcListProviders,
  ResponseTypes,
} from "../types";
import { createSubscription, unsubscribe } from "./subscriptions";
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
} from "../types";
import { getSelectedAccountIndex, networkIdObservable } from "./Extension";
import { PHISHING_PAGE_REDIRECT } from "../../defaults";
import RequestExtrinsicSign from "../RequestExtrinsicSign";
import State from "./State";
import { AvailableNetwork } from "../../../config";
import RequestBytesSign from "../RequestBytesSign";

function transformAccounts(accounts: SubjectInfo): InjectedAccount[] {
  const accs = Object.values(accounts);

  const filtered = accs
    .filter(
      ({
        json: {
          meta: { isHidden },
        },
      }) => !isHidden
    )
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
      this.#state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case "pub(authorize.tab)":
        return this.authorize(url, request as RequestAuthorizeTab);
      case "pub(accounts.list)":
        return this.accountsList();
      case "pub(accounts.subscribe)":
        return this.accountsSubscribe(id, port);
      case "pub(bytes.sign)":
        return this.bytesSign(url, request as SignerPayloadRaw);
      case "pub(extrinsic.sign)":
        return this.extrinsicSign(url, request as SignerPayloadJSON);
      case "pub(metadata.list)":
        return this.metadataList();
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
    const subscription = networkIdObservable.subscribe(
      (networkId: AvailableNetwork): void => cb(networkId)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private authorize(
    url: string,
    request: RequestAuthorizeTab
  ): Promise<boolean> {
    return this.#state.authorizeUrl(url, request);
  }

  private accountsList(): InjectedAccount[] {
    return transformAccounts(accountsObservable.subject.getValue());
  }

  private accountsSubscribe(id: string, port: chrome.runtime.Port): boolean {
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

  private bytesSign(
    url: string,
    request: SignerPayloadRaw
  ): Promise<ResponseSigning> {
    const address = request.address;
    const pair = this.getSigningPair(address);

    return this.#state.sign(url, new RequestBytesSign(request), {
      address,
      ...pair.meta,
    });
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
    return this.#state.injectMetadata(url, request);
  }

  private metadataList(): InjectedMetadataKnown[] {
    return this.#state.knownMetadata.map(({ genesisHash, specVersion }) => ({
      genesisHash,
      specVersion,
    }));
  }

  private rpcListProviders(): Promise<ResponseRpcListProviders> {
    return this.#state.rpcListProviders();
  }

  private rpcSend(
    request: RequestRpcSend,
    port: chrome.runtime.Port
  ): Promise<JsonRpcResponse<any>> {
    return this.#state.rpcSend(request, port);
  }

  private rpcStartProvider(
    key: string,
    port: chrome.runtime.Port
  ): Promise<ProviderMeta> {
    return this.#state.rpcStartProvider(key, port);
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
    const subscriptionId = await this.#state.rpcSubscribe(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      this.rpcUnsubscribe({ ...request, subscriptionId }, port).catch(
        console.error
      );
    });

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

    this.#state.rpcSubscribeConnected(request, cb, port);

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return Promise.resolve(true);
  }

  private async rpcUnsubscribe(
    request: RequestRpcUnsubscribe,
    port: chrome.runtime.Port
  ): Promise<boolean> {
    return this.#state.rpcUnsubscribe(request, port);
  }

  private redirectPhishingLanding(phishingWebsite: string): void {
    const nonFragment = phishingWebsite.split("#")[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.runtime.getURL(
      "index.html"
    )}?${PHISHING_PAGE_REDIRECT}=${encodedWebsite}`;

    chrome.tabs.query({ url: nonFragment }, (tabs) => {
      tabs
        .map(({ id }) => id)
        .filter((id): id is number => isNumber(id))
        .forEach((id) => void chrome.tabs.update(id, { url }));
    });
  }

  private async redirectIfPhishing(url: string): Promise<boolean> {
    const isInDenyList = await checkIfDenied(url);

    if (isInDenyList) {
      this.redirectPhishingLanding(url);

      return true;
    }

    return false;
  }
}
