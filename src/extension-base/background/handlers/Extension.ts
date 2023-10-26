// import { Keyring } from "@polkadot/api";
import keyring from "@polkadot/ui-keyring";
import {
  MessageTypes,
  RequestAccountClaimDefault,
  RequestAccountCreateSuri,
  RequestTypes,
  ResponseType,
  SigningRequest,
} from "../types";

import { BehaviorSubject } from "rxjs";
import { RPC_URL } from "../../../defaults";
import { createSubscription, unsubscribe } from "./subscriptions";
import State from "./State";

const REEF_NETWORK_RPC_URL_KEY = "reefNetworkRpcUrl";

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
      // case "pri(accounts.claim.default)":
      //   return this.accountsClaimDefault(request as RequestAccountClaimDefault);
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
    const createResult = keyring.addUri("0x" + privateKey, "test_password"); // TODO
    return createResult.pair.address;
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

  // private accountsClaimDefault({
  //   address,
  // }: RequestAccountClaimDefault): string {
  //   return "";
  // }
}
