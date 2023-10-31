// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";
import { approveSign } from "../../messaging";

interface Props {
  buttonText: string;
  //   error: string | null;
  //   isFirst: boolean;
  //   setError: (value: string | null) => void;
  signId: string;
}

function SignArea({ buttonText, signId }: Props): JSX.Element {
  const [isBusy, setIsBusy] = useState(false);

  const _onSign = useCallback((): Promise<void> => {
    setIsBusy(true);

    return approveSign(signId)
      .then((): void => {
        setIsBusy(false);
      })
      .catch((error: Error): void => {
        setIsBusy(false);
        console.error(error);
      });
  }, [setIsBusy, signId]);

  const _onCancel = () => {
    console.log("cancel");
  };

  return (
    <div>
      <button onClick={_onSign}>{buttonText}</button>
      <button onClick={_onCancel}>Cancel</button>
    </div>
  );
}

export default SignArea;
