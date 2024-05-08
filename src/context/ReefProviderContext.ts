import { Provider } from "@reef-chain/evm-provider";
import { createContext } from "react";

interface ReefProvider {
    provider: Provider|undefined;
}

export const ReefProviderContext = createContext<ReefProvider | undefined>(undefined);
