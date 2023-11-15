// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { MetadataDef } from "../../extension-inject/types";
import { approveMetaRequest, rejectMetaRequest } from "../messaging";
import useMetadata from "../hooks/useMetadata";

interface Props {
  request: MetadataDef;
  metaId: string;
  url: string;
}

export default function Request({
  metaId,
  request,
  url,
}: Props): React.ReactElement<Props> {
  const chain = useMetadata(request.genesisHash);

  const _onApprove = useCallback((): void => {
    approveMetaRequest(metaId).catch(console.error);
  }, [metaId]);

  const _onReject = useCallback((): void => {
    rejectMetaRequest(metaId).catch(console.error);
  }, [metaId]);

  return (
    <table className="flex">
      <tbody>
        <tr>
          <td>From</td>
          <td className="pl-4">{url}</td>
        </tr>
        <tr>
          <td>Chain</td>
          <td className="pl-4">{request.chain}</td>
        </tr>
        <tr>
          <td>Icon</td>
          <td className="pl-4">{request.icon}</td>
        </tr>
        <tr>
          <td>Decimals</td>
          <td className="pl-4">{request.tokenDecimals}</td>
        </tr>
        <tr>
          <td>Symbol</td>
          <td className="pl-4">{request.tokenSymbol}</td>
        </tr>
        <tr>
          <td>Upgrade</td>
          <td className="pl-4">
            {chain ? chain.specVersion : "<unknown>"} -&gt;{" "}
            {request.specVersion}
          </td>
        </tr>
        <div>
          <div className="my-4">
            <FontAwesomeIcon icon={faWarning as IconProp} className="mr-2" />
            This approval will add the metadata to your extension instance,
            allowing future requests to be decoded using this metadata.
          </div>
          <button onClick={_onApprove}>Yes, do this metadata update</button>
          <button onClick={_onReject}>Reject</button>
        </div>
      </tbody>
    </table>
  );
}
