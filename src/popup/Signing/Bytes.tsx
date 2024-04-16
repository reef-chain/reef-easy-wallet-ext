// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from "react";
import { isAscii, u8aToString, u8aUnwrapBytes } from "@polkadot/util";

interface Props {
  bytes: string;
  url: string;
}

function Bytes({ bytes, url }: Props): React.ReactElement<Props> {
  const text = useMemo(
    () => (isAscii(bytes) ? u8aToString(u8aUnwrapBytes(bytes)) : bytes),
    [bytes]
  );

  return (
    <table className="flex">
      <tbody>
        <tr>
          <td className="font-semibold label" style={{ color: '#681cff ' }}>From</td>
          <td className="flex items-start pl-4">{url}</td>
        </tr>
        <tr>
        <td className="font-semibold label" style={{ color: '#681cff ' }}>Bytes</td>
          <td className="flex items-start pl-4">{text}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default React.memo(Bytes);
