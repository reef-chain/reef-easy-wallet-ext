import { LOGIN_PROVIDER, OPENLOGIN_NETWORK } from "@web3auth/openlogin-adapter";

export const CLIENT_ID =
  "BBzp629e5yHSqgUaIPpRVbD3vq1JnFpeqGmO_fPngDLHCrY72waMSMVsOe5v30Duuzb_pwYRMYYSxwgmV3fJtJU";
export const WEB3_AUTH_NETWORK = OPENLOGIN_NETWORK.SAPPHIRE_DEVNET;
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

// TESTNET
export const RPC_URL = "wss://rpc-testnet.reefscan.com/ws";
export const REEF_NETWORK = "Reef Testnet (Scuba)";
export const REEFSCAN_URL = "https://testnet.reefscan.com";
// MAINNET
// export const RPC_URL = "wss://rpc.reefscan.info/ws";
// export const REEF_NETWORK = "Reef Mainnet";
// export const REEFSCAN_URL = "https://reefscan.com";
