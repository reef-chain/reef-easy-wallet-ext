// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  RequestSignatures,
  TransportRequestMessage,
} from "../extension-base/background/types";
import type { Message } from "../extension-base/types";

import { PORT_CONTENT, PKG_VERSION } from "../extension-base/defaults";
import {
  enable,
  handleResponse,
  redirectIfPhishing,
} from "../extension-base/page";
import {
  injectExtension,
  REEF_EXTENSION_IDENT,
  REEF_INJECTED_EVENT,
  startInjection,
} from "../extension-inject";

startInjection(REEF_EXTENSION_IDENT);

// setup a response listener (events created by the loader for extension responses)
window.addEventListener("message", ({ data, source }: Message): void => {
  // only allow messages from our window, by the loader
  if (source !== window || data.origin !== PORT_CONTENT) {
    return;
  }
  console.log("[Page receives]", data);

  if (data.id) {
    handleResponse(data as TransportRequestMessage<keyof RequestSignatures>);
  } else {
    console.error("Missing id for response.");
  }
});

redirectIfPhishing()
  .then((gotRedirected) => {
    if (!gotRedirected) {
      inject();
    }
  })
  .catch((e) => {
    console.warn(
      `Unable to determine if the site is in the phishing list: ${
        (e as Error).message
      }`
    );
    inject();
  });

function inject() {
  injectExtension(enable, {
    name: REEF_EXTENSION_IDENT,
    version: PKG_VERSION,
  });
  const event = new Event(REEF_INJECTED_EVENT);

  document.dispatchEvent(event);
}
