// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from "react";

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthUrlInfo } from "../../extension-base/background/handlers/State";

interface Props {
  info: AuthUrlInfo;
  toggleAuth: (url: string) => void;
  removeAuth: (url: string) => void;
  url: string;
}

export const WebsiteEntry = ({
  info,
  removeAuth,
  toggleAuth,
  url,
}: Props): React.ReactElement<Props> => {
  const switchAccess = useCallback(() => {
    toggleAuth(url);
  }, [toggleAuth, url]);

  const removeAccess = useCallback(() => {
    removeAuth(url);
  }, [removeAuth, url]);

  return (
    <div className="flex text-sm mb-3">
      <div className="flex-auto text-left">{url}</div>
      <label className="relative inline-flex items-center cursor-pointer mx-3">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={info.isAllowed}
          onChange={switchAccess}
        />
        <div
          className={`w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full 
            rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] 
            after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border 
            after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-200 peer-checked:bg-primary`}
        ></div>
        <span className="ms-2 text-gray-300 w-16 text-left">
          {info.isAllowed ? "Allowed" : "Denied"}
        </span>
      </label>
      <div>
        <FontAwesomeIcon
          onClick={removeAccess}
          className="hover:cursor-pointer"
          icon={faTrash as IconProp}
        />
      </div>
    </div>
  );
};
