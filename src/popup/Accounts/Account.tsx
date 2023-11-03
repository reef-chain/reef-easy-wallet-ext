import React, { useEffect, useState } from "react";
import Identicon from "@polkadot/react-identicon";
import {
  computeDefaultEvmAddress,
  toAddressShortDisplay,
  toReefAmount,
} from "../util";
import { AccountJson } from "../../extension-base/background/types";
import { Provider } from "@reef-chain/evm-provider";
import { getAddress } from "@ethersproject/address";
import { selectAccount } from "../messaging";

interface Props {
  account: AccountJson;
  provider: Provider;
  isSelected?: boolean;
}

const Account = ({ account, provider, isSelected }: Props): JSX.Element => {
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

  const bindDefaultEvmAddress = async () => {
    alert("TODO");
    // const extrinsic = provider.api.tx.evmAccounts.claimDefaultAccount();
  };

  return (
    <div className={isSelected ? "account selected" : "account"}>
      <div className="avatar">
        {account.icon ? (
          <img src={account.icon as string} className="avatar-image"></img>
        ) : (
          <Identicon value={account.address} size={44} theme="substrate" />
        )}
        <img
          src={`/icons/login_providers/login-${account.loginProvider}-active.svg`}
          className="login-provider"
        ></img>
      </div>
      <div className="content">
        <div className="name">
          {account.name}
          {!isSelected && (
            <button
              className="sm"
              onClick={() => selectAccount(account.address)}
            >
              Select
            </button>
          )}
        </div>
        <div className="balance">
          <img src="/icons/icon.png" className="reef-amount-logo"></img>
          {balance !== undefined ? toReefAmount(balance) : "loading..."}
        </div>
        <div>
          <b>Native address:</b> {toAddressShortDisplay(account.address)}
        </div>
        <div>
          <b>EVM address:</b>{" "}
          {evmAddress ? toAddressShortDisplay(evmAddress) : "loading..."}
          {isEvmClaimed !== undefined && !isEvmClaimed && (
            <button className="sm" onClick={bindDefaultEvmAddress}>
              Bind
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;
