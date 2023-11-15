import { Provider } from "@reef-chain/evm-provider";
import { WsProvider } from "@polkadot/api";
import { ReefInjectedProvider, Unsubcall } from "../../extension-inject/types";
import { SendRequest } from "./types";
import { AvailableNetwork, reefNetworks } from "../../config";

type ProviderRpc = { networkId: AvailableNetwork; provider: Provider };

async function initProvider(providerUrl: string) {
  const newProvider = new Provider({
    provider: new WsProvider(providerUrl),
  });
  try {
    await newProvider.api.isReadyOrError;
  } catch (e) {
    console.log("Provider isReadyOrError ERROR=", e);
    throw e;
  }
  return newProvider;
}

export class ReefProvider implements ReefInjectedProvider {
  private readonly sendRequest: SendRequest;

  private selectedNetworkProvider: ProviderRpc | undefined;

  private creatingNewProviderId: AvailableNetwork | null = null;

  private providerCbArr: {
    cb: (provider: Provider) => void;
    subsIdent: string;
  }[] = [];
  private resolvesList: any[] = [];
  private isGetProviderMethodSubscribed = false;

  constructor(_sendRequest: SendRequest) {
    this.sendRequest = _sendRequest;

    this.subscribeSelectedNetwork(async (networkId: AvailableNetwork) => {
      if (!this.providerCbArr.length) {
        return;
      }

      if (this.creatingNewProviderId === networkId) {
        return;
      }

      if (this.selectedNetworkProvider?.networkId !== networkId) {
        this.creatingNewProviderId = networkId;
        await this.selectedNetworkProvider?.provider.api.disconnect();

        const provider = await initProvider(reefNetworks[networkId].rpcUrl);

        this.selectedNetworkProvider = {
          networkId,
          provider,
        };
        this.providerCbArr?.forEach((cbObj) =>
          this.selectedNetworkProvider
            ? cbObj.cb(this.selectedNetworkProvider.provider)
            : null
        );
        this.creatingNewProviderId = null;
      }
    });
  }

  subscribeSelectedNetwork(cb: (rpcUrl: string) => void): void {
    this.sendRequest("pub(network.subscribe)", null, cb).catch((reason) =>
      console.log("Error subscribeSelectedNetwork ", reason)
    );
  }

  subscribeSelectedNetworkProvider(
    cb: (provider: Provider) => void
  ): Unsubcall {
    const subsIdent = Math.random().toString();

    this.providerCbArr.push({ cb, subsIdent: subsIdent });

    if (!this.creatingNewProviderId && this.selectedNetworkProvider) {
      cb(this.selectedNetworkProvider.provider);
    }

    return (): void => {
      const removeIdx = this.providerCbArr.findIndex(
        (cbObj) => cbObj.subsIdent === subsIdent
      );

      this.providerCbArr.splice(removeIdx, 1);
      this.disconnectProvider();
    };
  }

  public async getNetworkProvider(): Promise<Provider> {
    if (this.selectedNetworkProvider) {
      return Promise.resolve(this.selectedNetworkProvider.provider);
    }

    // when multiple initial calls are made save them to list and respond when ready
    const retPromise = new Promise<Provider>((resolve) => {
      this.resolvesList.push(resolve);
    });

    if (!this.isGetProviderMethodSubscribed) {
      this.isGetProviderMethodSubscribed = true;
      this.subscribeSelectedNetworkProvider((provider) => {
        if (!this.resolvesList.length) {
          return;
        }

        this.resolvesList.forEach((resolve) => resolve(provider));
        this.resolvesList = [];
      });
    }

    return retPromise;
  }

  private disconnectProvider() {
    if (!this.providerCbArr.length || !this.providerCbArr.some((e) => !!e)) {
      try {
        this.selectedNetworkProvider?.provider.api
          .disconnect()
          .catch((err) => console.log("Error disconnecting provider", err));
      } catch (e) {}

      this.selectedNetworkProvider = undefined;
    }
  }
}
