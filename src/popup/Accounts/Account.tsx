import React, { useEffect, useState } from "react";
import Identicon from "@polkadot/react-identicon";
import { computeDefaultEvmAddress, toReefAmount } from "../util";
import { AccountJson } from "../../extension-base/background/types";
import { Provider } from "@reef-chain/evm-provider";
import { getAddress } from "@ethersproject/address";

interface Props {
  account: AccountJson;
  provider: Provider;
}

const Account = ({ account, provider }: Props): JSX.Element => {
  const [balance, setBalance] = useState<BigInt>();
  const [evmAddress, setEvmAddress] = useState<string>();
  const [isEvmClaimed, setIsEvmClaimed] = useState<boolean>();

  useEffect(() => {
    if (account.address && provider) {
      queryEvmAddress(account.address, provider);
      subscribeToBalance(account.address, provider);
    } else {
      setEvmAddress(undefined);
      setIsEvmClaimed(undefined);
      setBalance(undefined);
    }
  }, [account, provider]);

  const queryEvmAddress = async (address: string, provider: Provider) => {
    const claimedAddress = await provider.api.query.evmAccounts.evmAddresses(
      address
    );

    if (!claimedAddress.isEmpty) {
      const _evmAddress = getAddress(claimedAddress.toString());
      setEvmAddress(_evmAddress);
      setIsEvmClaimed(true);
    } else {
      setEvmAddress(computeDefaultEvmAddress(address));
      setIsEvmClaimed(false);
    }
  };

  let unsubBalance = () => {};

  const subscribeToBalance = async (address: string, provider: Provider) => {
    unsubBalance = await provider.api.query.system.account(
      address,
      ({ data: balance }) => {
        setBalance(BigInt(balance.free.toString()));
      }
    );
  };

  return (
    <div className="account">
      <div className="avatar">
        <Identicon value={account.address} size={44} theme="substrate" />
      </div>
      <div className="content">
        <div className="name">{account.name}</div>
        <div>
          <b>Native address:</b> {account.address}
        </div>
        <div>
          <b>EVM address:</b> {evmAddress || "loading..."}{" "}
          {isEvmClaimed !== undefined &&
            (isEvmClaimed ? "✅ Claimed" : "❌ Not Claimed")}
        </div>
        <div>
          <b>Balance:</b>{" "}
          {balance !== undefined ? toReefAmount(balance) : "loading..."}
        </div>
      </div>
    </div>
  );
};

export default Account;
