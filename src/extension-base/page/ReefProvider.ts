import { Provider } from "../../evm-provider/Provider";
import { ReefInjectedProvider, Unsubcall } from "../../extension-inject/types";
import { SendRequest } from "./types";

type ProviderRpc = { rpcUrl: string; provider: Provider };

export class ReefProvider implements ReefInjectedProvider {
  private readonly sendRequest: SendRequest;

  private selectedNetworkProvider: ProviderRpc | undefined;

  private creatingNewProviderRpcUrl: string | null = null;

  private providerCbArr: {
    cb: (provider: Provider) => void;
    subsIdent: string;
  }[] = [];

  constructor(_sendRequest: SendRequest) {
    this.sendRequest = _sendRequest;
  }

  subscribeSelectedNetworkProvider(
    cb: (provider: Provider) => void
  ): Unsubcall {
    const subsIdent = Math.random().toString();

    this.providerCbArr.push({ cb, subsIdent: subsIdent });

    console.log(
      "subscribeSelectedNetworkProvider___=",
      this.selectedNetworkProvider
    );
    if (!this.creatingNewProviderRpcUrl && this.selectedNetworkProvider) {
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

  subscribeSelectedNetwork(cb: (rpcUrl: string) => void): void {
    this.sendRequest("pub(network.subscribe)", null, cb).catch((reason) =>
      console.log("Error subscribeSelectedNetwork ", reason)
    );
  }

  public async getNetworkProvider(): Promise<Provider> {
    return this.selectedNetworkProvider.provider;
  }
}
