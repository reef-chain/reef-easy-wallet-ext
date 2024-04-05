// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect } from "react";

import { RequestAuthorizeTab } from "../../extension-base/background/types";
import { approveAuthRequest, rejectAuthRequest } from "../messaging";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWarning } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import Uik from "@reef-chain/ui-kit";

interface Props {
  authId: string;
  request: RequestAuthorizeTab;
  url: string;
}

function Request({
  authId,
  request: { origin },
  url,
}: Props): React.ReactElement<Props> {
  const _onApprove = useCallback(
    () =>
      approveAuthRequest(authId).catch((error: Error) => console.error(error)),
    [authId]
  );

  useEffect(()=>{
    window.resizeTo(640,600);
  },[])

  const _onReject = useCallback(
    () =>
      rejectAuthRequest(authId).catch((error: Error) => console.error(error)),
    [authId]
  );

  return (
    <div>
      <Uik.Text>
        An application, self-identifying as <span className="">{origin}</span>{" "}
        is requesting access from{" "}
        <a href={url} target="_blank">
          <span className="">{url}</span>
        </a>
        .
      </Uik.Text>
      <div>
        <div className="my-4">
          <FontAwesomeIcon icon={faWarning as IconProp} className="mr-2" />
          Only approve this request if you trust the application. Approving
          gives the application access to the addresses of your accounts.
        </div>
        <div className="flex">
        <Uik.Button onClick={_onApprove} text="Yes, allow this application access" fill/>
        <Uik.Button onClick={_onReject} text="Reject" />
        </div>
      </div>
    </div>
  );
}

export default Request;
