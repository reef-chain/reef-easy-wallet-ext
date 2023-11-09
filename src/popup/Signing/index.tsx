// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerPayloadJSON } from "@polkadot/types/types";

import React, { useCallback, useEffect, useState } from "react";

import { SigningRequest } from "../../extension-base/background/types";
import Request from "./Request";
import TransactionIndex from "./TransactionIndex";

interface Props {
  requests: SigningRequest[];
  getOrRefreshAuth: () => Promise<string | null>;
}

const Signing = ({ requests, getOrRefreshAuth }: Props): JSX.Element => {
  const [requestIndex, setRequestIndex] = useState(0);

  const _onNextClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex + 1),
    []
  );

  const _onPreviousClick = useCallback(
    () => setRequestIndex((requestIndex) => requestIndex - 1),
    []
  );

  useEffect(() => {
    setRequestIndex((requestIndex) =>
      requestIndex < requests.length ? requestIndex : requests.length - 1
    );
  }, [requests]);

  // protect against removal overflows/underflows
  const request =
    requests.length !== 0
      ? requestIndex >= 0
        ? requestIndex < requests.length
          ? requests[requestIndex]
          : requests[requests.length - 1]
        : requests[0]
      : null;

  const isTransaction = !!(request?.request?.payload as SignerPayloadJSON)
    ?.blockNumber;

  return request ? (
    <>
      <div className="mb-4">
        <span className="text-lg">
          {isTransaction ? "Transaction" : "Sign message"}
        </span>
        {requests.length > 1 && (
          <TransactionIndex
            index={requestIndex}
            onNextClick={_onNextClick}
            onPreviousClick={_onPreviousClick}
            totalItems={requests.length}
          />
        )}
      </div>
      <Request
        account={request.account}
        buttonText={isTransaction ? "Sign the transaction" : "Sign the message"}
        isFirst={requestIndex === 0}
        request={request.request}
        signId={request.id}
        url={request.url}
        getOrRefreshAuth={getOrRefreshAuth}
      />
    </>
  ) : (
    <span>Loading...</span>
  );
};

export default Signing;
