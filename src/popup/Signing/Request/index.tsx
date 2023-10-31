// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from "react";

import { TypeRegistry } from "@polkadot/types";
import type { ExtrinsicPayload } from "@polkadot/types/interfaces";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import { decodeAddress } from "@polkadot/util-crypto";
import SignArea from "./SignArea";

import {
  AccountJson,
  RequestSign,
} from "../../../extension-base/background/types";

import Bytes from "../Bytes";
import Extrinsic from "../Extrinsic";
// import Extrinsic from '../Extrinsic';

interface Props {
  account: AccountJson;
  buttonText: string;
  isFirst: boolean;
  request: RequestSign;
  signId: string;
  url: string;
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
  account: { accountIndex, addressOffset },
  buttonText,
  isFirst,
  request,
  signId,
  url,
}: Props): React.ReactElement<Props> | null {
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

  if (payload !== null) {
    const json = request.payload as SignerPayloadJSON;
    return (
      <>
        <Extrinsic payload={payload} request={json} url={url} />;
        <SignArea buttonText={buttonText} signId={signId} />
      </>
    );
  } else if (hexBytes !== null) {
    const { address, data } = request.payload as SignerPayloadRaw;
    return (
      <>
        <Bytes bytes={data} url={url} />;
        <SignArea buttonText={buttonText} signId={signId} />
      </>
    );
  }

  return null;
}
