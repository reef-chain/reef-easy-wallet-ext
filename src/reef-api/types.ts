import { derive as ormlDerives } from "@open-web3/orml-api-derive";
import { ApiOptions } from "@polkadot/api/types";
import { DeriveCustom } from '@polkadot/api-base/types';
import * as constants from './all-currencies';
import {
  options as reefOptions,
} from "./options"

const acalaDerives: DeriveCustom = {
  constants: constants as unknown as DeriveCustom[string]
};
const acalaRpc = reefOptions.rpc;
const acalaTypes = reefOptions.types;
const acalaTypesAlias = reefOptions.typesAlias;
const acalaTypesBundle = reefOptions.typesBundle;
const acalaSignedExtensions = reefOptions.signedExtensions;

export const options = ({
  types = {},
  rpc = {},
  typesAlias = {},
  typesBundle = {},
  signedExtensions,
  ...otherOptions
}: ApiOptions = {}): ApiOptions => ({
  types: {
    ...acalaTypes,
    ...types,
  },
  rpc: {
    ...acalaRpc,
    ...rpc,
  },
  typesAlias: {
    ...acalaTypesAlias,
    ...typesAlias,
  },
  derives: {
    ...ormlDerives,
    ...acalaDerives,
  },
  typesBundle: {
    ...typesBundle,
    spec: {
      ...typesBundle.spec,
      acala: {
        ...acalaTypesBundle?.spec?.acala,
        ...typesBundle?.spec?.acala,
      },
      mandala: {
        ...acalaTypesBundle?.spec?.mandala,
        ...typesBundle?.spec?.mandala,
      },
    },
  },
  signedExtensions: {
    ...acalaSignedExtensions,
    ...signedExtensions,
  },
  ...otherOptions,
});
