// import { Keyring } from "@polkadot/api";
import keyring from "@polkadot/ui-keyring";
import {
  MessageTypes,
  RequestAccountCreateSuri,
  RequestTypes,
  ResponseType,
} from "../types";

import { BehaviorSubject } from "rxjs";

const REEF_NETWORK_RPC_URL_KEY = "reefNetworkRpcUrl";
const RPC_URL = "wss://rpc.reefscan.com/ws";

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
  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: chrome.runtime.Port
  ): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case "pri(accounts.create.suri)":
        console.log("Extension.ts handle pri(accounts.create.suri)");
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);
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
  }: RequestAccountCreateSuri): boolean {
    // const keyring = new Keyring({ ss58Format: 42, type: "sr25519" });
    // const keyPair = keyring.addFromUri("0x" + privateKey, {
    //   genesisHash,
    //   name,
    // });
    // const pair = keyring.getPair(keyPair.address); // TODO remove
    // console.log("pair=", pair);

    const createResult = keyring.addUri("0x" + privateKey);
    const pair = keyring.getPair(createResult.pair.address); // TODO remove
    console.log("pair=", pair);

    return true;
  }
}
