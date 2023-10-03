// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MessageTypes, TransportRequestMessage } from "../types";

import { assert } from "@reef-defi/util";

import ReefExtension from "./ReefExtension";
import { ReefTabs } from "./ReefTabs";

import { PORT_EXTENSION } from "../../defaults";

const extension = new ReefExtension();
const tabs = new ReefTabs();

export default function handler<TMessageType extends MessageTypes>(
  { id, message, request }: TransportRequestMessage<TMessageType>,
  from: string,
  port: chrome.runtime.Port,
  extensionPortName = PORT_EXTENSION
): Promise<any> {
  console.log("__handler__");
  console.log("id=", id);
  console.log("message=", message);
  console.log("request=", request);
  console.log("port=", port);

  const isExtension = from === extensionPortName;

  const source = `${from}: ${id}: ${message}`;
  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);
  const promise =
    isExtension &&
    message !== "pub(extrinsic.sign)" &&
    message !== "pub(bytes.sign)"
      ? extension.handle(id, message, request, port)
      : tabs.handle(id, message, request, from, port);

  return promise;
}

// Original version
export function handlerOriginal<TMessageType extends MessageTypes>(
  { id, message, request }: TransportRequestMessage<TMessageType>,
  port: chrome.runtime.Port,
  extensionPortName = PORT_EXTENSION
): void {
  console.log("__handler OG__");
  console.log("id=", id);
  console.log("message=", message);
  console.log("request=", request);
  console.log("port=", port);

  const isExtension = port.name === extensionPortName;
  const sender = port.sender as chrome.runtime.MessageSender;
  const from = isExtension
    ? extensionPortName
    : (sender.tab && sender.tab.url) || sender.url || "<unknown>";

  const source = `${from}: ${id}: ${message}`;
  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);
  const promise =
    isExtension &&
    message !== "pub(extrinsic.sign)" &&
    message !== "pub(bytes.sign)"
      ? extension.handle(id, message, request, port)
      : tabs.handle(id, message, request, from, port);

  promise
    .then((response): void => {
      console.log("handler response=", response);
      console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);
      // between the start and the end of the promise, the user may have closed
      // the tab, in which case port will be undefined
      assert(port, "Port has been disconnected");
      port.postMessage({ id, response });
    })
    .catch((error: Error): void => {
      console.log(`[err] ${source}:: ${error.message}`);
      // only send message back to port if it's still connected
      if (port) {
        port.postMessage({ error: error.message, id });
      }
    });
}
