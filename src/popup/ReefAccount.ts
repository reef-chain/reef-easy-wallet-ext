// TODO subscribe to changes in balance, evmAddress and isEvmClaimed

export class ReefAccount {
  name: string;
  address: string;
  balance: bigint;
  evmAddress: string;
  isEvmClaimed: boolean;

  constructor(name: string, address: string) {
    this.name = name;
    this.address = address;
  }
}
