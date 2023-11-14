// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";

import RequestIndex from "../RequestIndex";
import Request from "./Request";
import { AuthorizeRequest } from "../../extension-base/background/types";

interface Props {
  requests: AuthorizeRequest[];
}

export const Authorize = ({ requests }: Props): JSX.Element => {
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

  return requests.length && requests[requestIndex] ? (
    <>
      <div className="my-4">
        <span className="text-lg">Authorize</span>
        {requests.length > 1 && (
          <RequestIndex
            index={requestIndex}
            onNextClick={_onNextClick}
            onPreviousClick={_onPreviousClick}
            totalItems={requests.length}
          />
        )}
      </div>
      <Request
        authId={requests[requestIndex].id}
        request={requests[requestIndex].request}
        key={requests[requestIndex].id}
        url={requests[requestIndex].url}
      />
    </>
  ) : (
    <span>Loading...</span>
  );
};
