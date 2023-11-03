import { blake2AsU8a, decodeAddress } from "@polkadot/util-crypto";
import { u8aConcat, u8aEq, u8aToHex } from "@polkadot/util";
import { getAddress } from "@ethersproject/address";
import { formatFixed } from "@ethersproject/bignumber";

export const computeDefaultEvmAddress = (address: string): string => {
  const publicKey = decodeAddress(address);

  const isStartWithEvm = u8aEq("evm:", publicKey.slice(0, 4));

  if (isStartWithEvm) {
    return getAddress(u8aToHex(publicKey.slice(4, 24)));
  }

  return getAddress(
    u8aToHex(blake2AsU8a(u8aConcat("evm:", publicKey), 256).slice(0, 20))
  );
};

export const toAddressShortDisplay = (address: string, size = 12): string => {
  return address.length < size
    ? address
    : `${address.slice(0, size - 5)}...${address.slice(address.length - 5)}`;
};

export const toReefAmount = (amount: BigInt, decimals = 0): string => {
  const reefUnits = formatFixed(amount ? amount.toString() : "0", 18);
  return parseFloat(reefUnits).toFixed(decimals);
};
