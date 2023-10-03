import { PHISHING_PAGE_REDIRECT } from "../../defaults";
import {
  MessageTypes,
  RequestAccountList,
  RequestAuthorizeTab,
  RequestTypes,
  ResponseTypes,
} from "../types";
import { createSubscription, unsubscribe } from "./subscriptions";
import { getSelectedAccountIndex, networkRpcUrlSubject } from "./ReefExtension";

import { checkIfDenied } from "@polkadot/phishing";
import { isNumber } from "@polkadot/util";
import { InjectedAccount } from "@reef-defi/extension-inject/types";
import {
  SingleAddress,
  SubjectInfo,
} from "@polkadot/ui-keyring/observable/types";
import { accounts as accountsObservable } from "@polkadot/ui-keyring/observable/accounts";

import { canDerive } from "../../util/canDerive";

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

export class ReefTabs {
  async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    url: string,
    port: chrome.runtime.Port
  ): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === "pub(phishing.redirectIfDenied)") {
      return this.redirectIfPhishing(url);
    }
    if (type !== "pub(authorize.tab)") {
      // this.#state.ensureUrlAuthorized(url); // TODO
    }

    switch (type) {
      case "pub(network.subscribe)":
        return this.networkSubscribe(id, port);

      case "pub(authorize.tab)":
        return this.authorize(url, request as RequestAuthorizeTab);

      case "pub(accounts.list)":
        return this.accountsList(url, request as RequestAccountList);

      case "pub(accounts.subscribe)":
        return this.accountsSubscribe(url, id, port);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
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

  private authorize(
    url: string,
    request: RequestAuthorizeTab
  ): Promise<boolean> {
    // return this.#state.authorizeUrl(url, request); // TODO
    return Promise.resolve(true);
  }

  private redirectPhishingLanding(phishingWebsite: string): void {
    const nonFragment = phishingWebsite.split("#")[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.extension.getURL(
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private accountsList(
    url: string,
    { anyType }: RequestAccountList
  ): InjectedAccount[] {
    // return transformAccounts(accountsObservable.subject.getValue(), anyType);
    return [];
  }

  // FIXME This looks very much like what we have in Extension
  private accountsSubscribe(
    url: string,
    id: string,
    port: chrome.runtime.Port
  ): boolean {
    // const cb = createSubscription<"pub(accounts.subscribe)">(id, port);
    // const subscription = accountsObservable.subject.subscribe(
    //   (accounts: SubjectInfo): void => cb(transformAccounts(accounts))
    // );

    // port.onDisconnect.addListener((): void => {
    //   unsubscribe(id);
    //   subscription.unsubscribe();
    // });

    return true;
  }

  private async redirectIfPhishing(url: string): Promise<boolean> {
    const isInDenyList = await checkIfDenied(url);

    if (isInDenyList) {
      this.redirectPhishingLanding(url); // TODO: test this

      return true;
    }

    return false;
  }
}
