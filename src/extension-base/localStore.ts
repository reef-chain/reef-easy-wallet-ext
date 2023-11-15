import { KeyringJson, KeyringStore } from "@polkadot/ui-keyring/types";

export class LocalStore implements KeyringStore {
  public all(fn: (key: string, value: KeyringJson) => void): void {
    chrome.storage.local.get(null, (items) => {
      Object.entries(items).forEach(([key, value]) => {
        fn(key, value);
      });
    });
  }

  public get(key: string, fn: (value: KeyringJson) => void): void {
    chrome.storage.local.get(key, (items) => {
      fn(items[key]);
    });
  }

  public remove(key: string, fn?: () => void): void {
    chrome.storage.local.remove([key]);
    fn && fn();
  }

  public set(key: string, value: KeyringJson, fn?: () => void): void {
    chrome.storage.local.set({ [key]: value });
    fn && fn();
  }
}
