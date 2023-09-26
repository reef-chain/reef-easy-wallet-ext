# Reef Socials Wallet Chrome Extension

A Chrome extension for the Reef Chain that uses [Web3Auth](https://web3auth.io/) to create and authenticate to Reef accounts using different social media platforms.

<!-- ## Installation -->

<!-- Install via [Chrome web store](https://chrome.google.com/webstore/detail/XXXXXXXXXX) -->

## Install local version

Steps to build the extension and view your changes in a browser:

1. Install dependencies via `yarn install`
2. Build via `yarn build`
3. Install the extension
   - go to `chrome://extensions/`
   - ensure you have the Development flag set
   - "Load unpacked" and point to `/dist`

## Development

You can run the extension in development mode, which will watch for changes and rebuild the extension automatically. To do so, just follow the steps of the previous section, but in step 2 run `yarn watch` instead of `yarn build`.
