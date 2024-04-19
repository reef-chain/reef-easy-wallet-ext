// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo, useRef } from "react";
import type {
  Call,
  ExtrinsicEra,
  ExtrinsicPayload,
} from "@polkadot/types/interfaces";
import type { AnyJson, SignerPayloadJSON } from "@polkadot/types/types";
import { bnToBn, formatNumber } from "@polkadot/util";
import BN from "bn.js";

import { Chain } from "../../extension-chains/types";
import useMetadata from "../hooks/useMetadata";

interface Decoded {
  args: AnyJson | null;
  method: Call | null;
}

interface Props {
  payload: ExtrinsicPayload;
  request: SignerPayloadJSON;
  url: string;
}

function displayDecodeVersion(
  message: string,
  chain: Chain,
  specVersion: BN
): string {
  return `${message}: chain=${
    chain.name
  }, specVersion=${chain.specVersion.toString()} (request specVersion=${specVersion.toString()})`;
}

function decodeMethod(data: string, chain: Chain, specVersion: BN): Decoded {
  let args: AnyJson | null = null;
  let method: Call | null = null;

  try {
    if (specVersion.eqn(chain.specVersion)) {
      method = chain.registry.createType("Call", data);
      args = (method.toHuman() as { args: AnyJson }).args;
    } else {
      console.log(
        displayDecodeVersion("Outdated metadata to decode", chain, specVersion)
      );
    }
  } catch (error) {
    console.error(
      `${displayDecodeVersion("Error decoding method", chain, specVersion)}:: ${
        (error as Error).message
      }`
    );

    args = null;
    method = null;
  }

  return { args, method };
}

function renderMethod(
  data: string,
  { args, method }: Decoded
): React.ReactNode {
  if (!args || !method) {
    return (
      <table className="flex signature-table">
        <tbody>
          <tr>
            <td className="font-semibold" style={{ color: '#681cff ' }}>Method data</td>
            <td className="flex items-start pl-4"> {data.slice(0,52)}...</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="flex signature-table">
      <tbody>
        <tr>
          <td className="font-semibold" style={{ color: '#681cff ' }}>Method</td>
          <td className="flex items-start pl-4">
            <details>
              <summary>
                {method.section}.{method.method}
                {method.meta
                  ? `(${method.meta.args.map(({ name }) => name).join(", ")})`
                  : ""}
              </summary>
              <pre>{JSON.stringify(args, null, 2)}</pre>
            </details>
          </td>
        </tr>
        {method.meta && (
          <tr>
            <td className="font-semibold" style={{ color: '#681cff ' }}>Info</td>
            <td className="flex items-start pl-4">
              <details>
                <summary>
                  {method.meta.docs.map((d) => d.toString().trim()).join(" ")}
                </summary>
              </details>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function mortalityAsString(era: ExtrinsicEra, hexBlockNumber: string): string {
  if (era.isImmortalEra) {
    return "immortal";
  }

  const blockNumber = bnToBn(hexBlockNumber);
  const mortal = era.asMortalEra;

  return `mortal, valid from ${formatNumber(
    mortal.birth(blockNumber)
  )} to ${formatNumber(mortal.death(blockNumber))}`;
}

function Extrinsic({
  payload: { era, nonce, tip },
  request: { blockNumber, genesisHash, method, specVersion: hexSpec },
  url,
}: Props): React.ReactElement<Props> {
  const chain = useMetadata(genesisHash);
  const specVersion = useRef(bnToBn(hexSpec)).current;
  const decoded = useMemo(
    () =>
      chain && chain.hasMetadata
        ? decodeMethod(method, chain, specVersion)
        : { args: null, method: null },
    [method, chain, specVersion]
  );

  return (
    <table className="flex justify-start items-start pl-4 signature-table">
      <tbody>
        <tr>
          <td className="font-semibold" style={{ color: '#681cff ' }}>From</td>
          <td className="flex items-start pl-4">{url}</td>
        </tr>
        <tr>
          <td className="font-semibold" style={{ color: '#681cff ' }}>{chain ? "Chain" : "Genesis"}</td>
          <td className="flex items-start pl-4" style={{overflow: 'hidden'}}>{chain ? chain.name : genesisHash.slice(0,52)+"..."}</td>
        </tr>
        <tr>
          <td className="font-semibold" style={{ color: '#681cff ' }}>Version</td>
          <td className="flex items-start pl-4">{specVersion.toNumber()}</td>
        </tr>
        <tr>
          <td className="font-semibold" style={{ color: '#681cff ' }}>Nonce</td>
          <td className="flex items-start pl-4">{formatNumber(nonce)}</td>
        </tr>
        {!tip.isEmpty && (
          <tr>
            <td className="font-semibold" style={{ color: '#681cff ' }}>Tip</td>
            <td className="flex items-start pl-4">{formatNumber(tip)}</td>
          </tr>
        )}
        {renderMethod(method, decoded)}
        <tr>
          <td className="font-semibold" style={{ color: '#681cff ' }}>Lifetime</td>
          <td className="flex items-start pl-4">{mortalityAsString(era, blockNumber)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default React.memo(Extrinsic);
