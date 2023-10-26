// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isAscii, u8aToString, u8aUnwrapBytes } from "@polkadot/util";
import React, { useMemo } from "react";

interface Props {
  className?: string;
  bytes: string;
  url: string;
}

function Bytes({ bytes, className, url }: Props): React.ReactElement<Props> {
  const text = useMemo(
    () => (isAscii(bytes) ? u8aToString(u8aUnwrapBytes(bytes)) : bytes),
    [bytes]
  );

  return (
    <table className={className}>
      <tbody>
        <tr>
          <td className="label">{t<string>("from")}</td>
          <td className="data">{url}</td>
        </tr>
        <tr>
          <td className="label">{t<string>("bytes")}</td>
          <td className="data">{text}</td>
        </tr>
      </tbody>
    </table>
  );
}
