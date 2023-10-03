import { MessageTypes, RequestTypes, ResponseType } from "../types";
import { BehaviorSubject } from "rxjs";

const REEF_NETWORK_RPC_URL_KEY = "reefNetworkRpcUrl";

const rpcUrl = "wss://rpc.reefscan.com/ws"; // TODO put in constants

export const networkRpcUrlSubject: BehaviorSubject<string> =
  new BehaviorSubject<string>(
    // localStorage.getItem(REEF_NETWORK_RPC_URL_KEY) || // TODO
    rpcUrl
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

export default class ReefExtension {
  async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: chrome.runtime.Port
  ): Promise<ResponseType<TMessageType>> {
    switch (type) {
      // case "pri(accounts.select)":
      //   return this.accountsSelect(request as RequestAccountSelect);
      // case "pri(network.select)":
      //   return this.networkSelect(request as RequestNetworkSelect);
      // case "pri(network.subscribe)":
      //   return this.networkSubscribe(id, port);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
