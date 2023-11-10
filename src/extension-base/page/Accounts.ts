import { InjectedAccount, Unsubcall } from "../../extension-inject/types";
import { SendRequest } from "./types";

let sendRequest: SendRequest;

export default class Accounts {
  constructor(_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public get(): Promise<InjectedAccount[]> {
    return sendRequest("pub(accounts.list)");
  }

  public subscribe(cb: (accounts: InjectedAccount[]) => unknown): Unsubcall {
    let unsubs = false;

    sendRequest("pub(accounts.subscribe)", null, (val) => {
      if (!unsubs) {
        cb(val);
      }
    }).catch((error: Error) => console.error(error));

    return (): void => {
      unsubs = true;
    };
  }
}
