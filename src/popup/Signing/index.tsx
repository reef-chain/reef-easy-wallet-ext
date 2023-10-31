// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerPayloadJSON } from "@polkadot/types/types";

import React, { useCallback, useEffect, useState } from "react";

import Request from "./Request";
import { SigningRequest } from "../../extension-base/background/types";

export default function Signing(
  requests: SigningRequest[]
): React.ReactElement {
  // const [requestIndex, setRequestIndex] = useState(0);

  // const _onNextClick = useCallback(
  //   () => setRequestIndex((requestIndex) => requestIndex + 1),
  //   []
  // );

  // const _onPreviousClick = useCallback(
  //   () => setRequestIndex((requestIndex) => requestIndex - 1),
  //   []
  // );

  // useEffect(() => {
  //   setRequestIndex((requestIndex) =>
  //     requestIndex < requests.length ? requestIndex : requests.length - 1
  //   );
  // }, [requests]);

  // // protect against removal overflows/underflows
  // const request =
  //   requests.length !== 0
  //     ? requestIndex >= 0
  //       ? requestIndex < requests.length
  //         ? requests[requestIndex]
  //         : requests[requests.length - 1]
  //       : requests[0]
  //     : null;

  // TODO
  const request = requests[0];
  const requestIndex = 0;

  const isTransaction = !!(request?.request?.payload as SignerPayloadJSON)
    ?.blockNumber;

  return request ? (
    <>
      <Request
        account={request.account}
        buttonText={isTransaction ? "Sign the transaction" : "Sign the message"}
        isFirst={requestIndex === 0}
        request={request.request}
        signId={request.id}
        url={request.url}
      />
    </>
  ) : (
    <span>Loading...</span>
  );
}
