// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";

import { TypeRegistry } from "@polkadot/types";
import type { ExtrinsicPayload } from "@polkadot/types/interfaces";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";

import {
  AccountJson,
  RequestSign,
} from "../../../extension-base/background/types";

import Bytes from "../Bytes";
import Extrinsic from "../Extrinsic";
import { approveSignRequest, cancelSignRequest } from "../../messaging";

interface Props {
  account: AccountJson;
  buttonText: string;
  isFirst: boolean;
  request: RequestSign;
  signId: string;
  url: string;
  getOrRefreshAuth: () => Promise<string | null>;
}

interface Data {
  hexBytes: string | null;
  payload: ExtrinsicPayload | null;
}

export const CMD_MORTAL = 2;
export const CMD_SIGN_MESSAGE = 3;

// keep it global, we can and will re-use this across requests
const registry = new TypeRegistry();

function isRawPayload(
  payload: SignerPayloadJSON | SignerPayloadRaw
): payload is SignerPayloadRaw {
  return !!(payload as SignerPayloadRaw).data;
}

export default function Request({
  buttonText,
  isFirst,
  request,
  signId,
  url,
  getOrRefreshAuth,
}: Props): React.ReactElement<Props> | null {
  const [isBusy, setIsBusy] = useState(false);
  const [{ hexBytes, payload }, setData] = useState<Data>({
    hexBytes: null,
    payload: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    const payload = request.payload;

    if (isRawPayload(payload)) {
      setData({
        hexBytes: payload.data,
        payload: null,
      });
    } else {
      registry.setSignedExtensions(payload.signedExtensions);

      setData({
        hexBytes: null,
        payload: registry.createType("ExtrinsicPayload", payload, {
          version: payload.version,
        }),
      });
    }
  }, [request]);

  const _onSign = async () => {
    setIsBusy(true);

    const password = await getOrRefreshAuth();
    if (!password) {
      setIsBusy(false);
      alert("Wrong auth");
      return;
    }

    return approveSignRequest(signId, password)
      .then((): void => {
        setIsBusy(false);
      })
      .catch((error: Error): void => {
        setIsBusy(false);
        console.error(error);
      });
  };

  const _onCancel = () => {
    cancelSignRequest(signId);
  };

  return (
    <>
      {payload !== null ? (
        <Extrinsic
          payload={payload}
          request={request.payload as SignerPayloadJSON}
          url={url}
        />
      ) : hexBytes !== null ? (
        <Bytes bytes={hexBytes} url={url} />
      ) : null}
      <div>
        {isFirst && <button onClick={_onSign}>{buttonText}</button>}
        <button onClick={_onCancel}>Cancel</button>
      </div>
    </>
  );
}
