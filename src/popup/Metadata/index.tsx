// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from "react";

import { MetadataRequest } from "../../extension-base/background/types";
import Request from "./Request";

interface Props {
  requests: MetadataRequest[];
}

export const Metadata = ({ requests }: Props): JSX.Element => {
  return requests?.length ? (
    <>
      <div className="my-4">
        <span className="text-lg">Metadata</span>
      </div>
      <Request
        key={requests[0].id}
        metaId={requests[0].id}
        request={requests[0].request}
        url={requests[0].url}
      />
    </>
  ) : (
    <span>Loading...</span>
  );
};
