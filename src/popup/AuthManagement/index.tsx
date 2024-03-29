// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from "react";

import {
  getAuthList,
  removeAuthorization,
  toggleAuthorization,
} from "../messaging";
import { WebsiteEntry } from "./WebsiteEntry";
import {
  AuthUrlInfo,
  AuthUrls,
} from "../../extension-base/background/handlers/State";
import UiKit from "@reef-chain/ui-kit";

export const AuthManagement = (): JSX.Element => {
  const [authList, setAuthList] = useState<AuthUrls | null>(null);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const toggleAuth = useCallback((url: string) => {
    toggleAuthorization(url)
      .then(({ list }) => setAuthList(list))
      .catch(console.error);
  }, []);

  const removeAuth = useCallback((url: string) => {
    removeAuthorization(url)
      .then(({ list }) => setAuthList(list))
      .catch(console.error);
  }, []);

  return (
    <>
      <div className="my-4">
        <UiKit.Text text="Manage Website Access" />
      </div>
      <div>
        {!authList || !Object.entries(authList)?.length ? (
          <UiKit.Text text="No website request yet!" type="mini" />
        ) : (
          <>
            <div className="px-2">
              {Object.entries(authList).map(
                ([url, info]: [string, AuthUrlInfo]) => (
                  <WebsiteEntry
                    info={info}
                    key={url}
                    toggleAuth={toggleAuth}
                    removeAuth={removeAuth}
                    url={url}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
