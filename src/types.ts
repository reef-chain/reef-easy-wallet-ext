// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiOptions } from "@polkadot/api/types";

export interface Message extends MessageEvent {
  data: {
    error?: string;
    id: string;
    origin: string;
    response?: string;
    subscription?: string;
  };
}

export const options = ({
  types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  signedExtensions,
  ...otherOptions
}: ApiOptions = {}): ApiOptions => ({
  types: {
    ...types,
  },
  rpc: {
    ...rpc,
  },
  typesAlias: {
    ...typesAlias,
  },
  derives: {},
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      acala: {
        ...typesBundle?.spec?.acala,
      },
      mandala: {
        ...typesBundle?.spec?.mandala,
      },
    },
  },
  signedExtensions: {
    ...signedExtensions,
  },
  ...otherOptions,
});
