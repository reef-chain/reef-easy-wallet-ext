import React, { useEffect, useState, useRef } from "react";
import Identicon from "@polkadot/react-identicon";
import {
  computeDefaultEvmAddress,
  toAddressShortDisplay,
  toReefAmount,
} from "../util";
import { AccountJson } from "../../extension-base/background/types";
import { Provider, Signer } from "@reef-chain/evm-provider";
import { getAddress } from "@ethersproject/address";
import {
  editAccount,
  forgetAccount,
  selectAccount,
  sendMessage,
} from "../messaging";
import CopyToClipboard from "react-copy-to-clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCopy, faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import SigningKey from "../../extension-base/page/Signer";
import Uik from "@reef-chain/ui-kit";
import { getShortenedVerifier } from "../../utils/verifierUtil";

interface Props {
  account: AccountJson;
  provider: Provider;
  isSelected?: boolean;
}

const Account = ({ account, provider, isSelected }: Props): JSX.Element => {
  const [name, setName] = useState<string>(account.name);
  const [balance, setBalance] = useState<BigInt>();
  const [evmAddress, setEvmAddress] = useState<string>();
  const [isEvmClaimed, setIsEvmClaimed] = useState<boolean>();
  const [signer, setSigner] = useState<Signer>();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isForgetAccountOpen, setIsForgetAccountOpen] = useState(false);
  const optionsRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setOpen] = useState(false)
  const [qrvalue, setQrValue] = useState("")

  useEffect(() => {
    unsubBalance();
    if (account.address && provider) {
      const _signer = new Signer(
        provider,
        account.address,
        new SigningKey(sendMessage)
      );
      setSigner(_signer);
      queryEvmAddress(account.address, provider);
      subscribeToBalance(account.address, provider);
    } else {
      setSigner(undefined);
      setEvmAddress(undefined);
      setIsEvmClaimed(undefined);
      setBalance(undefined);
    }
  }, [account, provider]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setIsOptionsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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

  let unsubBalance = () => { };

  const subscribeToBalance = async (address: string, provider: Provider) => {
    unsubBalance = await provider.api.query.system.account(
      address,
      ({ data: balance }) => {
        setBalance(BigInt(balance.free.toString()));
      }
    );
  };

  const bindDefaultEvmAddress = async () => {
    signer
      .claimDefaultAccount()
      .then((response) => {
        console.log("evm bind response", response);
      })
      .catch((error) => {
        console.log("evm bind error", error);
        Uik.notify.danger("Failed to bind EVM address");
      });
  };

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  return (
    <div className="relative" >
      {isSelected && <div className="absolute top-0 right-0 selected-badge text-white px-2 py-1">Selected</div>}
      <div className={`${isSelected ? "account selected" : "account"}`}>
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
            {isEditingName ? (
              <input
                className="text-sm text-primary rounded-md px-2 my-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    editAccount(account.address, name);
                    setIsEditingName(false);
                  }
                }}
                ref={inputRef}
              />
            ) : (
              account.name
            )}
          </div>
          <div className="flex">
            <div>

              <div className="flex pt-1">
                {balance !== undefined ? <Uik.ReefAmount value={toReefAmount(balance)} /> : <Uik.Loading size="small" />}
                <div className="font-light">
                  {account.verifierId && <Uik.Text text={getShortenedVerifier(account.verifierId as string)} className="pl-3" type="mini" />}
                </div>
              </div>
              <CopyToClipboard
                text={account.address}
                className="hover:cursor-pointer"
              >
                <div title={account.address}>
                  <label className="font-bold pr-2">Native address:</label>
                  {toAddressShortDisplay(account.address)}
                  <FontAwesomeIcon
                    className="ml-2"
                    icon={faCopy as IconProp}
                    size="sm"
                    title="Copy Reef Account Address"
                    onClick={() => Uik.notify.info("Copied Address to clipboard")}
                  />
                </div>
              </CopyToClipboard>
              {isEvmClaimed !== undefined && isEvmClaimed &&
                <CopyToClipboard
                  text={evmAddress ? evmAddress + " (ONLY for Reef chain!)" : ""}
                  className="inline-block hover:cursor-pointer"
                >
                  <div title={evmAddress || ""}>
                    <label className="font-bold pr-2">EVM address:</label>
                    {evmAddress ? toAddressShortDisplay(evmAddress) : "loading..."}
                    <FontAwesomeIcon
                      className="ml-2"
                      icon={faCopy as IconProp}
                      size="sm"
                      title="Copy EVM Address"
                      onClick={() => Uik.notify.info("Copied EVM Address to clipboard! (ONLY for Reef chain!)")}
                    />
                  </div>
                </CopyToClipboard>
              }
            </div>
            <div className="flex px-2">
              {isEvmClaimed !== undefined && !isEvmClaimed && (
                <Uik.Button className="mx-2" onClick={bindDefaultEvmAddress} text="Bind" fill />

              )}
              {!isSelected &&
                <Uik.Button onClick={() => selectAccount(account.address)} text="Select" />
              }
            </div>
          </div>
        </div>
        <div className="relative" ref={optionsRef}>
          <FontAwesomeIcon
            className="hover:cursor-pointer p-2"
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            icon={faEllipsisVertical as IconProp}
            title="Account options"
          />
          {isOptionsOpen && (
            <Uik.Dropdown
              isOpen={isOptionsOpen}
              onClose={() => setIsOptionsOpen(false)}
              position="bottomLeft"
            >
              <div className="p-2 flex flex-col justify-start items-start">
                <Uik.Text type="mini"
                  text={`Verifier ID:`}
                />
                <Uik.Text type="mini"
                  text={`${(account.verifierId || "unknown") as string}`}
                />
              </div>
              <Uik.Divider />
              <Uik.DropdownItem
                text='Rename'
                onClick={() => {
                  setIsEditingName(true);
                  setIsOptionsOpen(false);
                }}
              />
              <Uik.DropdownItem
                text='Share Native Address'
                onClick={() => {
                  setOpen(true);
                  setQrValue(account.address)
                }}
              />
              {isEvmClaimed!==undefined && isEvmClaimed && <Uik.DropdownItem
                text='Share EVM Address'
                onClick={() => {
                  setOpen(true);
                  setQrValue(evmAddress)
                }}
              />}
              
              <Uik.DropdownItem
                text='Forget account'
                onClick={() => {
                  setIsForgetAccountOpen(true);
                  setIsOptionsOpen(false);
                }}
              />
            </Uik.Dropdown>
            
            // <div className="absolute right-0 p-2 bg-white text-secondary font-bold text-left rounded-lg">
            //   <div className="mb-1 pb-1 border-b border-gray-300">
            //     <span className="font-normal">Verifier ID:</span>{" "}
            //     {(account.verifierId || "unknown") as string}
            //   </div>
            //   <div
            //     className="mb-1 hover:cursor-pointer hover:text-primary"
            //     onClick={() => {
            //       setIsEditingName(true);
            //       setIsOptionsOpen(false);
            //     }}
            //   >
            //     Rename
            //   </div>
            //   <div
            //     className="hover:cursor-pointer hover:text-primary"
            //     onClick={() => {
            //       forgetAccount(account.address);
            //       setIsOptionsOpen(false);
            //     }}
            //   >
            //     Forget account
            //   </div>
            // </div>
          )}

           <Uik.Modal
            title='Forget Account'
            isOpen={isForgetAccountOpen}
            onClose={() => setIsForgetAccountOpen(false)}
            footer={
              <>
                <Uik.Button text='Close' onClick={() => setIsForgetAccountOpen(false)}/>
                <Uik.Button text='Delete Account' danger onClick={() => {
                  forgetAccount(account.address);
                  setIsForgetAccountOpen(false);
                  Uik.notify.success(`Removed ${account.name!} successfully!`)
                  }} />
              </>
            }
          >
            <div >
            <Uik.Text>Account will be removed from extension and you could loose access to funds it holds.</Uik.Text>
            </div>
          </Uik.Modal>
          <Uik.Modal
            title='Share Address'
            isOpen={isOpen}
            onClose={() => setOpen(false)}
          >
              <Uik.QRCode value={qrvalue} />
          </Uik.Modal>
        </div>
      </div>
    </div>
  );
};

export default Account;
