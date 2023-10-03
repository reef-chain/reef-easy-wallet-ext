// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from "../extension-base/types";

import { PORT_CONTENT, PORT_PAGE } from "../extension-base/defaults";
import chrome from "@reef-defi/extension-inject/chrome";

import handlers from "./handlers";
import { RequestSignatures, TransportRequestMessage } from "./types";

// connect to the extension
const port = chrome.runtime.connect({ name: PORT_CONTENT });

// send any messages from the extension back to the page
port.onMessage.addListener((data): void => {
  console.log("port.onMessage listener=", data);
  window.postMessage({ ...data, origin: PORT_CONTENT }, "*");
});

// all messages from the page, pass them to the extension
window.addEventListener("message", ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== PORT_PAGE) {
    return;
  }
  console.log("window msg listener=", data, " source=", source);

  // a. Send to service worker
  // port.postMessage(data);

  // b. Handle in content script
  handlers(
    data as TransportRequestMessage<keyof RequestSignatures>,
    window.location.origin,
    port
  ).then((response) => {
    console.log("response=", response);
    window.postMessage({ id: data.id, response, origin: PORT_CONTENT }, "*");
  });
});

// inject our data injector
const script = document.createElement("script");

script.src = chrome.runtime.getURL("page.js");

script.onload = (): void => {
  // remove the injecting tag when loaded
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

(document.head || document.documentElement).appendChild(script);
