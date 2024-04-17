// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension service worker, handling all keyring access

import type {
  RequestSignatures,
  TransportRequestMessage,
} from "../extension-base/background/types";

import handlers from "../extension-base/background/handlers";
import { PORT_CONTENT, PORT_EXTENSION } from "../extension-base/defaults";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { assert } from "@polkadot/util";

import keyring from "@polkadot/ui-keyring";
import { LocalStore } from "../extension-base/localStore";
import { startHeartbeat } from "./heartbeat";

type PortExt = chrome.runtime.Port & { _timer?: NodeJS.Timeout };

const forceReconnect = (port: PortExt) => {
  if (port._timer) {
    clearTimeout(port._timer);
    delete port._timer;
  }
  port.disconnect();
};

// returns state of service worker
export const healthCheck=():Promise<boolean>=> {
  return new Promise((resolve, reject) => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      resolve(false);
    }
  });
}

// if service worker stops
export const restartServiceWorker = ()=>{
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.update();
      });
    });
  }
}

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  console.log("msg connect listener before handler=", port);
  // shouldn't happen, however... only listen to what we know about
  assert(
    [PORT_CONTENT, PORT_EXTENSION].includes(port.name),
    `Unknown connection from ${port.name}`
  );

  // Trigger reconnection every < 5 minutes to maintain the communication with the volatile service worker.
  // The "connecting ends" are adjusted to reconnect upon disconnection.
  (port as PortExt)._timer = setTimeout(forceReconnect, 250e3, port);

  // message and disconnect handlers
  port.onMessage.addListener(
    (data: TransportRequestMessage<keyof RequestSignatures>) => {
      console.log("[ServiceWorker receives]", " port=", port.name, data);
      handlers(data, port);
    }
  );
  port.onDisconnect.addListener(() =>
    console.log(`Disconnected from ${port.name}`)
  );
});

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log("crypto initialized");

    // load all the keyring data
    keyring.loadAll({ store: new LocalStore(), type: "sr25519" });
    console.log("KEYRING LOADED ALL=", keyring.getAccounts().length);
    startHeartbeat()
    console.log("initialization completed");
  })
  .catch((error): void => {
    console.error("initialization failed", error);
  });
