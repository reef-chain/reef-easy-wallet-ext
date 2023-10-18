// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ReefInjected } from "../../extension-inject/types";
import Accounts from "./Accounts";
import Metadata from "./Metadata";
import PostMessageProvider from "./PostMessageProvider";
import { ReefProvider } from "./ReefProvider";
import { ReefSigner } from "./ReefSigner";
import Signer from "./Signer";

export default class implements ReefInjected {
  public readonly accounts: Accounts;
  public readonly metadata: Metadata;
  public readonly provider: PostMessageProvider;
  public readonly signer: Signer;
  public readonly reefSigner: ReefSigner;
  public readonly reefProvider: ReefProvider;

  constructor(sendRequest: any) {
    this.accounts = new Accounts(sendRequest);
    this.metadata = new Metadata(sendRequest);
    this.provider = new PostMessageProvider(sendRequest);
    this.signer = new Signer(sendRequest);
    this.reefProvider = new ReefProvider(sendRequest);
    this.reefSigner = new ReefSigner(
      this.accounts,
      this.signer,
      this.reefProvider
    );
  }
}
