import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import keyring from "@polkadot/ui-keyring";
import { assert } from "@polkadot/util";
import { TypeRegistry } from "@polkadot/types";
import { accounts as accountsObservable } from "@polkadot/ui-keyring/observable/accounts";
import { Observable } from "rxjs";

import {
  AccountJson,
  MessageTypes,
  RequestAccountCreateSuri,
  RequestAccountEdit,
  RequestAccountSelect,
  RequestNetworkSelect,
  RequestSigningApprove,
  RequestTypes,
  ResponseType,
  SigningRequest,
} from "../types";
import { createSubscription, unsubscribe } from "./subscriptions";
import State from "./State";
import { InjectedAccount, MetadataDef } from "../../../extension-inject/types";
import { SubjectInfo } from "@polkadot/ui-keyring/observable/types";
import { AvailableNetwork } from "../../../config";

const REEF_NETWORK_KEY = "selectedReefNetwork";

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
    chrome.storage.local.get({ [REEF_NETWORK_KEY]: "mainnet" }, (items) => {
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
  readonly #state: State;

  constructor(state: State) {
    this.#state = state;
  }

  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: chrome.runtime.Port
  ): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case "pri(metadata.get)":
        return this.metadataGet(request as string);
      case "pri(accounts.create.suri)":
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);
      case "pri(accounts.edit)":
        return this.accountsEdit(request as RequestAccountEdit);
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
      case "pri(signing.requests)":
        return this.signingSubscribe(id, port);
      default:
        throw new Error(
          `Extension.ts Unable to handle message of type ${type}`
        );
    }
  }

  private accountsCreateSuri({
    privateKey,
    name,
    loginProvider,
    verifierId,
    genesisHash,
    icon,
  }: RequestAccountCreateSuri): string {
    // TODO do not use password?
    console.log("verifierId", verifierId);
    console.log("loginProvider", loginProvider);
    const createResult = keyring.addUri("0x" + privateKey, "no_password", {
      name,
      loginProvider,
      verifierId,
      genesisHash,
      icon,
      _isSelectedTs: new Date().getTime(),
    });
    const pair = createResult.pair;
    pair.unlock("no_password"); // TODO
    return createResult.pair.address;
  }

  private accountsEdit({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);
    assert(pair, "Unable to find pair");

    keyring.saveAccountMeta(pair, { ...pair.meta, name });
    return true;
  }

  private metadataGet(genesisHash: string | null): MetadataDef | null {
    return (
      this.#state.knownMetadata.find(
        (result) => result.genesisHash === genesisHash
      ) || null
    );
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

    // accountsObservable.subject.next(accountsObservable.subject.getValue());
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

  private signingApprove({ id }: RequestSigningApprove): boolean {
    const queued = this.#state.getSignRequest(id);

    assert(queued, "Unable to find request");

    const { reject, request, resolve } = queued;
    const pair = keyring.getPair(queued.account.address);

    if (!pair) {
      reject(new Error("Unable to find pair"));

      return false;
    }

    if (pair.isLocked) {
      pair.unlock("no_password"); // TODO
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

    resolve({
      id,
      ...result,
    });

    return true;
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
