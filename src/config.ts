import {
  LOGIN_PROVIDER,
  OPENLOGIN_NETWORK,
  OPENLOGIN_NETWORK_TYPE,
} from "@web3auth/openlogin-adapter";

let clientId =
  "BEuXj5bKlno3l2MwPRjNgtVmePBOHQ_VClO1h_lxKPU_NoV8cOJe7JsjpU1PDaZ5wjhlQQjm0avfRUaSe-fw_dQ";
let web3AuthNetwork: OPENLOGIN_NETWORK_TYPE =
  OPENLOGIN_NETWORK.SAPPHIRE_MAINNET;
let defaultReefNetwork = "mainnet";

if (process.env.NODE_ENV === "development") {
  clientId =
    "BEuXj5bKlno3l2MwPRjNgtVmePBOHQ_VClO1h_lxKPU_NoV8cOJe7JsjpU1PDaZ5wjhlQQjm0avfRUaSe-fw_dQ";
  web3AuthNetwork = OPENLOGIN_NETWORK.SAPPHIRE_DEVNET;
  defaultReefNetwork = "testnet";
}

export const CLIENT_ID = clientId;
export const WEB3_AUTH_NETWORK = web3AuthNetwork;
export const DEFAULT_REEF_NETWORK = defaultReefNetwork;

export const REEF_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAjVBMVEX////y7f/CrP+cd/+EUf+ASf+PY/+0mv/q4v+QZf9WAP9cAP+if//Swv9dAP9jDf+6ov/8+v+nh//ZzP9oFv9xL//69/+vkv/v6f/p4P+sjf/Aqv/Kuf/h1v+ffP9rIP+KWv/d0f96P/+Vbf/Pvv9EAP/cxPR5AOHIasu2I7q0ALXt0u71yN/nIIzsf7frsc8CAAAAzUlEQVR4Ac2Q1aHCQBBFL8Rnw2zcXZ/Sf3e4kwI4P+OKj2W1VlRNN8ylkEUnBNlvsY1g6Ziua3rMykvMpyCMzmrM9NI5CCjBGVPw+imWkvAAZHTUBed4QrEBFKSe25Z4I2JRAAlLDe9UXANpIHn1HjNJ2r5CIlyIoZGBFCQdLNBSEErLxyKd1B3ul2OD4GJF4vylwgSS5B6sA3ZhcXXU1+OAaZ5v0ZxlBSQk4nLTjArw9f3ze59Iq9OPBBEdv/f3v8WVmAccKZXeifDB7AHedww4cWs3gQAAAABJRU5ErkJggg==";

export const LOGIN_PROVIDERS: string[] = [
  LOGIN_PROVIDER.GOOGLE,
  LOGIN_PROVIDER.FACEBOOK,
  LOGIN_PROVIDER.TWITTER,
  LOGIN_PROVIDER.APPLE,
  LOGIN_PROVIDER.GITHUB,
  LOGIN_PROVIDER.DISCORD,
  LOGIN_PROVIDER.TWITCH,
];

export type AvailableNetwork = "mainnet" | "testnet";

export type ReefNetwork = {
  id: AvailableNetwork;
  name: string;
  rpcUrl: string;
  reefScanUrl: string;
  genesisHash: string;
};

const ReefMainnet: ReefNetwork = {
  id: "mainnet",
  name: "Reef Mainnet",
  rpcUrl: "wss://rpc.reefscan.com/ws",
  reefScanUrl: "https://reefscan.com",
  genesisHash:
    "0x7834781d38e4798d548e34ec947d19deea29df148a7bf32484b7b24dacf8d4b7",
};

const ReefTestnet: ReefNetwork = {
  id: "testnet",
  name: "Reef Scuba (testnet)",
  rpcUrl: "wss://rpc-testnet.reefscan.com/ws",
  reefScanUrl: "https://testnet.reefscan.com",
  genesisHash:
    "0xb414a8602b2251fa538d38a9322391500bd0324bc7ac6048845d57c37dd83fe6",
};

export const reefNetworks: Record<AvailableNetwork, ReefNetwork> = {
  ["mainnet"]: ReefMainnet,
  ["testnet"]: ReefTestnet,
};