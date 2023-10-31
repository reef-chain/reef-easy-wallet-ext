import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import keyring from "@polkadot/ui-keyring";
import { assert } from "@polkadot/util";
import { TypeRegistry } from "@polkadot/types";
import {
  MessageTypes,
  RequestAccountCreateSuri,
  RequestSigningApprove,
  RequestTypes,
  ResponseType,
  SigningRequest,
} from "../types";

import { BehaviorSubject } from "rxjs";
import { RPC_URL } from "../../../defaults";
import { createSubscription, unsubscribe } from "./subscriptions";
import State from "./State";
import { MetadataDef } from "../../../extension-inject/types";

const REEF_NETWORK_RPC_URL_KEY = "reefNetworkRpcUrl";

// a global registry to use internally
const registry = new TypeRegistry();

function isJsonPayload(
  value: SignerPayloadJSON | SignerPayloadRaw
): value is SignerPayloadJSON {
  return (value as SignerPayloadJSON).genesisHash !== undefined;
}

export const networkRpcUrlSubject: BehaviorSubject<string> =
  new BehaviorSubject<string>(
    // localStorage.getItem(REEF_NETWORK_RPC_URL_KEY) || RPC_URL // TODO
    RPC_URL
  );

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
      case "pri(accounts.create.suri)":
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);
      case "pri(signing.approve)":
        return this.signingApprove(request as RequestSigningApprove);
      case "pri(metadata.get)":
        return this.metadataGet(request as string);
      case "pri(signing.requests)":
        return this.signingSubscribe(id, port);
      default:
        throw new Error(
          `Extension.ts Unable to handle message of type ${type}`
        );
    }
  }

  private accountsCreateSuri({
    genesisHash,
    name,
    privateKey,
  }: RequestAccountCreateSuri): string {
    const createResult = keyring.addUri("0x" + privateKey, "no_password"); // TODO
    createResult.pair.unlock("no_password"); // TODO
    return createResult.pair.address;
  }

  private metadataGet(genesisHash: string | null): MetadataDef | null {
    return (
      this.#state.knownMetadata.find(
        (result) => result.genesisHash === genesisHash
      ) || null
    );
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
