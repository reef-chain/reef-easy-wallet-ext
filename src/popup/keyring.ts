import { KeyringPair } from "@polkadot/keyring/types";
import keyring from "@polkadot/ui-keyring";
// import { cryptoWaitReady } from "@reef-defi/util-crypto";
import { SafeEventEmitterProvider } from "@web3auth/base";

export const initKeyring = async () => {
  try {
    // await cryptoWaitReady();
    console.log("crypto initialized");
    // load all the keyring data
    keyring.loadAll({ type: "sr25519" });
    console.log("KEYRING LOADED ALL=", keyring.getAccounts().length);
    console.log("initialization completed");
  } catch (error) {
    console.error("initialization failed", error);
  }
};

export const saveKeyPair = async (
  web3authProvider: SafeEventEmitterProvider
): Promise<void> => {
  // await cryptoWaitReady();
  const privateKey = (await web3authProvider.request({
    method: "private_key",
  })) as string;
  const keyPair = keyring.createFromUri("0x" + privateKey);
  keyring.addPair(keyPair, "passphrase"); // TODO: secure with password?
};

export const getKeyPair = (): KeyringPair | undefined => {
  const pairs: KeyringPair[] = keyring.getPairs();
  return pairs[0] || undefined;
};
