import type { KeyringPair } from "@polkadot/keyring/types";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import keyring from "@polkadot/ui-keyring";
import { SubjectInfo } from "@polkadot/ui-keyring/observable/types";
import { accounts as accountsObservable } from "@polkadot/ui-keyring/observable/accounts";
import { assert } from "@polkadot/util";
import { TypeRegistry } from "@polkadot/types";
import { Observable } from "rxjs";

import {
  AccountJson,
  AuthorizeRequest,
  DetachedWindowRequest,
  MessageTypes,
  MetadataRequest,
  RequestAccountCreateSuri,
  RequestAccountEdit,
  RequestAccountForget,
  RequestAccountSelect,
  RequestAuthorizeApprove,
  RequestAuthorizeReject,
  RequestMetadataApprove,
  RequestMetadataReject,
  RequestNetworkSelect,
  RequestSigningApprove,
  RequestSigningCancel,
  RequestSigningIsLocked,
  RequestTypes,
  ResponseAuthorizeList,
  ResponseSigningIsLocked,
  ResponseType,
  SigningRequest,
} from "../types";
import { createSubscription, unsubscribe } from "./subscriptions";
import State from "./State";
import { InjectedAccount, MetadataDef } from "../../../extension-inject/types";
import { AvailableNetwork } from "../../../config";
import { PASSWORD_EXPIRY_MS } from "../../defaults";

type CachedUnlocks = Record<string, number>;

const REEF_NETWORK_KEY = "selected_reef_network";

// a global registry to use internally
const registry = new TypeRegistry();

export function setSelectedAccount<T extends AccountJson | InjectedAccount>(
  accountsJson: T[],
  index: number | undefined
): T[] {
  if (accountsJson.length && index != null) {
    accountsJson.forEach((a, i) => {
      a.isSelected = i === index;
    });
  }

  return accountsJson;
}

export function transformAccounts(accounts: SubjectInfo): AccountJson[] {
  const singleAddresses = Object.values(accounts);
  const accountsJson = singleAddresses.map(
    ({ json: { address, meta }, type }): AccountJson => ({
      address,
      ...meta,
      type,
    })
  );
  const selIndex = getSelectedAccountIndex(
    singleAddresses.map((sa) => sa.json)
  );

  return setSelectedAccount(accountsJson, selIndex);
}

function isJsonPayload(
  value: SignerPayloadJSON | SignerPayloadRaw
): value is SignerPayloadJSON {
  return (value as SignerPayloadJSON).genesisHash !== undefined;
}

function createNetworkIdObservable(): Observable<any> {
  return new Observable<any>((subscriber) => {
    // TODO: use "mainnet" as default network
    chrome.storage.local.get({ [REEF_NETWORK_KEY]: "testnet" }, (items) => {
      subscriber.next(items[REEF_NETWORK_KEY]);

      const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ) => {
        if (areaName === "local" && REEF_NETWORK_KEY in changes) {
          subscriber.next(changes[REEF_NETWORK_KEY].newValue);
        }
      };
      chrome.storage.onChanged.addListener(listener);

      return () => {
        chrome.storage.onChanged.removeListener(listener);
      };
    });
  });
}

export const networkIdObservable = createNetworkIdObservable();

export function getSelectedAccountIndex(
  accountsMeta: { meta: any }[]
): number | undefined {
  if (accountsMeta.length) {
    const accsSelectedTsArr = accountsMeta.map((a) => a.meta._isSelectedTs);
    const lastSelectedSort = accsSelectedTsArr.sort((a, b) => {
      const selectedAAt = a || 0;
      const selectedBAt = b || 0;

      return selectedBAt - selectedAAt;
    });
    const lastTs = lastSelectedSort[0];

    return accountsMeta.findIndex((am) => am.meta._isSelectedTs === lastTs);
  }

  return undefined;
}

export default class Extension {
  readonly #cachedUnlocks: CachedUnlocks;

  readonly #state: State;

  constructor(state: State) {
    this.#cachedUnlocks = {};
    this.#state = state;
  }

  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: chrome.runtime.Port
  ): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case "pri(detached.window.get)":
        return this.getDetachedWindowId();
      case "pri(detached.window.set)":
        return this.setDetachedWindowId(request as DetachedWindowRequest);
      case "pri(metadata.approve)":
        return this.metadataApprove(request as RequestMetadataApprove);
      case "pri(metadata.get)":
        return this.metadataGet(request as string);
      case "pri(metadata.list)":
        return this.metadataList();
      case "pri(metadata.reject)":
        return this.metadataReject(request as RequestMetadataReject);
      case "pri(metadata.requests)":
        return this.metadataSubscribe(id, port);
      case "pri(authorize.approve)":
        return this.authorizeApprove(request as RequestAuthorizeApprove);
      case "pri(authorize.list)":
        return this.getAuthList();
      case "pri(authorize.reject)":
        return this.authorizeReject(request as RequestAuthorizeReject);
      case "pri(authorize.toggle)":
        return this.toggleAuthorization(request as string);
      case "pri(authorize.remove)":
        return this.removeAuthorization(request as string);
      case "pri(authorize.requests)":
        return this.authorizeSubscribe(id, port);
      case "pri(accounts.create.suri)":
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);
      case "pri(accounts.edit)":
        return this.accountsEdit(request as RequestAccountEdit);
      case "pri(accounts.forget)":
        return this.accountsForget(request as RequestAccountForget);
      case "pri(accounts.subscribe)":
        return this.accountsSubscribe(id, port);
      case "pri(accounts.select)":
        return this.accountsSelect(request as RequestAccountSelect);
      case "pri(network.select)":
        return this.networkSelect(request as RequestNetworkSelect);
      case "pri(network.subscribe)":
        return this.networkSubscribe(id, port);
      case "pri(signing.approve)":
        return this.signingApprove(request as RequestSigningApprove);
      case "pri(signing.cancel)":
        return this.signingCancel(request as RequestSigningCancel);
      case "pri(signing.isLocked)":
        return this.signingIsLocked(request as RequestSigningIsLocked);
      case "pri(signing.requests)":
        return this.signingSubscribe(id, port);
      default:
        throw new Error(
          `Extension.ts Unable to handle message of type ${type}`
        );
    }
  }

  private setDetachedWindowId({ id }: DetachedWindowRequest): boolean {
    this.#state.detachedWindowId = id;
    return true;
  }

  private getDetachedWindowId(): number {
    return this.#state.detachedWindowId;
  }

  private accountsCreateSuri({
    privateKey,
    name,
    loginProvider,
    verifierId,
    genesisHash,
    icon,
  }: RequestAccountCreateSuri): string {
    const createResult = keyring.addUri(
      "0x" + privateKey,
      privateKey.substring(0, 12),
      {
        name,
        loginProvider,
        verifierId,
        genesisHash,
        icon,
        _isSelectedTs: new Date().getTime(),
      }
    );
    return createResult.pair.address;
  }

  private accountsEdit({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);
    assert(pair, "Unable to find pair");

    keyring.saveAccountMeta(pair, { ...pair.meta, name });
    return true;
  }

  private authorizeApprove({ id }: RequestAuthorizeApprove): boolean {
    const queued = this.#state.getAuthRequest(id);

    assert(queued, "Unable to find request");

    const { resolve } = queued;

    resolve(true);

    return true;
  }

  private getAuthList(): ResponseAuthorizeList {
    return { list: this.#state.authUrls };
  }

  private authorizeReject({ id }: RequestAuthorizeReject): boolean {
    const queued = this.#state.getAuthRequest(id);

    assert(queued, "Unable to find request");

    const { reject } = queued;

    reject(new Error("Rejected"));

    return true;
  }

  private toggleAuthorization(url: string): ResponseAuthorizeList {
    return { list: this.#state.toggleAuthorization(url) };
  }

  private authorizeSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(authorize.requests)">(id, port);
    const subscription = this.#state.authSubject.subscribe(
      (requests: AuthorizeRequest[]): void => cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private removeAuthorization(url: string): ResponseAuthorizeList {
    return { list: this.#state.removeAuthorization(url) };
  }

  private metadataApprove({ id }: RequestMetadataApprove): boolean {
    const queued = this.#state.getMetaRequest(id);

    assert(queued, "Unable to find request");

    const { request, resolve } = queued;

    this.#state.saveMetadata(request);

    resolve(true);

    return true;
  }

  private metadataGet(genesisHash: string | null): MetadataDef | null {
    return (
      this.#state.knownMetadata.find(
        (result) => result.genesisHash === genesisHash
      ) || null
    );
  }

  private metadataList(): MetadataDef[] {
    return this.#state.knownMetadata;
  }

  private metadataReject({ id }: RequestMetadataReject): boolean {
    const queued = this.#state.getMetaRequest(id);

    assert(queued, "Unable to find request");

    const { reject } = queued;

    reject(new Error("Rejected"));

    return true;
  }

  private metadataSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(metadata.requests)">(id, port);
    const subscription = this.#state.metaSubject.subscribe(
      (requests: MetadataRequest[]): void => cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  protected accountsForget({ address }: RequestAccountForget): boolean {
    keyring.forgetAccount(address);

    return true;
  }

  private refreshAccountPasswordCache(pair: KeyringPair): number {
    const { address } = pair;

    const savedExpiry = this.#cachedUnlocks[address] || 0;
    const remainingTime = savedExpiry - Date.now();

    if (remainingTime < 0) {
      this.#cachedUnlocks[address] = 0;
      pair.lock();

      return 0;
    }

    return remainingTime;
  }

  protected accountsSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(accounts.subscribe)">(id, port);
    const subscription = accountsObservable.subject.subscribe(
      (accounts: SubjectInfo): void => cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private accountsSelect({ address }: RequestAccountSelect): boolean {
    const newSelectPair = keyring.getPair(address);

    assert(newSelectPair, "Unable to find pair");
    // using timestamp since subject emits on every meta change - so can't unselect old without event
    keyring.saveAccountMeta(newSelectPair, {
      ...newSelectPair.meta,
      _isSelectedTs: new Date().getTime(),
    });

    return true;
  }

  private networkSelect({ networkId }: RequestNetworkSelect) {
    chrome.storage.local.set({ [REEF_NETWORK_KEY]: networkId });
    return true;
  }

  private networkSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(network.subscribe)">(id, port);
    const subscription = networkIdObservable.subscribe(
      (network: AvailableNetwork): void => cb(network)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private signingApprove({
    id,
    password,
    savePass,
  }: RequestSigningApprove): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const { reject, request, resolve } = queued;
    const pair = keyring.getPair(queued.account.address);

    if (!pair) {
      reject(new Error("Unable to find pair"));

      return false;
    }

    this.refreshAccountPasswordCache(pair);

    // if the keyring pair is locked, the password is needed
    if (pair.isLocked && !password) {
      reject(new Error("Password needed to unlock the account"));
    }

    if (pair.isLocked) {
      pair.decodePkcs8(password);
    }

    const { payload } = request;

    if (isJsonPayload(payload)) {
      // Get the metadata for the genesisHash
      const currentMetadata = this.#state.knownMetadata.find(
        (meta: MetadataDef) => meta.genesisHash === payload.genesisHash
      );

      // set the registry before calling the sign function
      registry.setSignedExtensions(
        payload.signedExtensions,
        currentMetadata?.userExtensions
      );

      if (currentMetadata) {
        registry.register(currentMetadata?.types);
      }
    }

    const result = request.sign(registry, pair);

    if (savePass) {
      this.#cachedUnlocks[pair.address] = Date.now() + PASSWORD_EXPIRY_MS;
    } else {
      pair.lock();
    }

    resolve({
      id,
      ...result,
    });

    return true;
  }

  private signingCancel({ id }: RequestSigningCancel): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const { reject } = queued;

    reject(new Error("Cancelled"));

    return true;
  }

  private signingIsLocked({
    id,
  }: RequestSigningIsLocked): ResponseSigningIsLocked {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const address = queued.request.payload.address;
    const pair = keyring.getPair(address);

    assert(pair, "Unable to find pair");

    const remainingTime = this.refreshAccountPasswordCache(pair);

    return {
      isLocked: pair.isLocked,
      remainingTime,
    };
  }

  private signingSubscribe(id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<"pri(signing.requests)">(id, port);
    const subscription = this.#state.signSubject.subscribe(
      (requests: SigningRequest[]): void => cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }
}
