// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from "react";

import { TypeRegistry } from "@polkadot/types";
import type { ExtrinsicPayload } from "@polkadot/types/interfaces";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";

import {
  AccountJson,
  RequestSign,
} from "../../extension-base/background/types";

import Bytes from "./Bytes";
import Extrinsic from "./Extrinsic";
import {
  approveSignRequest,
  cancelSignRequest,
  isSignLocked,
} from "../messaging";
import { PASSWORD_EXPIRY_MIN } from "../../extension-base/defaults";

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
  const [savePass, setSavePass] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [{ hexBytes, payload }, setData] = useState<Data>({
    hexBytes: null,
    payload: null,
  });

  useEffect((): void => {
    setIsLocked(null);
    let timeout: NodeJS.Timeout;

    isSignLocked(signId)
      .then(({ isLocked, remainingTime }) => {
        setIsLocked(isLocked);
        timeout = setTimeout(() => {
          setIsLocked(true);
        }, remainingTime);

        // if the account was unlocked check the remember me
        // automatically to prolong the unlock period
        !isLocked && setSavePass(true);
      })
      .catch((error: Error) => console.error(error));

    () => {
      !!timeout && clearTimeout(timeout);
    };

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

    let password: string | null = null;
    if (isLocked) {
      password = await getOrRefreshAuth();
      if (!password) {
        setIsBusy(false);
        alert("Wrong auth");
        return;
      }
    }

    return approveSignRequest(signId, savePass, password)
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
        {isFirst && isLocked && (
          <div className="mt-2">
            <input
              className="hover:cursor-pointer mr-2"
              type="checkbox"
              checked={savePass}
              onChange={(_) => setSavePass(!savePass)}
              disabled={isBusy}
            />
            <span className="font-bold">
              Remember credentials from the next {PASSWORD_EXPIRY_MIN} minutes.
            </span>
          </div>
        )}
        {isFirst && (
          <button onClick={_onSign} disabled={isBusy}>
            {buttonText}
          </button>
        )}
        <button onClick={_onCancel} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </>
  );
}
