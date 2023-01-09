<h1 align="center">Wallet Migration Tool</h1>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]() [![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center">
    This tool generates a new 24 Word Mnemonic wallet and consolidates assets from provided addresses, to this new wallet. 
</p>

### Disclaimer:
###### I hold **NO RESPONSIBILITY** for your actions. Use of this script is at **YOUR OWN RISK**. This is **NOT** a toy. 
###### Do not upload your privateKeys to github.
###### Be safe.
---

## 📝 Table of Contents

- [🏁 Getting Started ](#getting_started)
- [🔧 Setting up the Script! ](#constantsjs)
- [🎈 Usage ](#usage)
- [⛏️ Built Using ](#️built_using)
- [✍️ Author ](#️author)

## 🧐 About <a name = "about"></a>

This was designed in the wake of the LastPass hack. 

**The Purpose:** 
To aid users in account consolidation prior to any malicious acts by said parties, given the likely event of any stored keys becoming compromised.

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for running the script, or help with development and/or testing purposes.

###### See [configuration](#constantsjs) for notes on how to setup the __*constants.js*__.

### Prerequisites

* Node.js
* Yarn (_*optional*_)

###### Developed with:
* Node.js (_*14.16*_)
* Yarn (_*1.22.19*_) (_*optional*_)

```sh
#Install Yarn Globally
npm install yarn -g
```

### Installing

Clone the repository & enter directory

```sh
git clone https://github.com/zy0n/wallet-migrator.git
```

Enter the repository directory.
```sh
cd wallet-migrator
```
Install Dependencies 

```sh
yarn
# or
npm install
```
This should successfully install all required dependencies to run.
**ethers, axios, bip39**

---
## 🔧 Setting up the Script! <a name = "constantsjs"></a>

__*Rename/Copy/Move*__ the *constants-example.js* to *constants.js*
```sh
cp constants-example.js constants.js
```

Edit the list of providers & Create Constants for any NFTs you desire to keep on any chain. Ethereum and Binance Smart Chain provider info has been provided as a starter example. This script can be modified for use with any chain.

#### Required 
Infura.io API Key, Etherscan API Key / Bscscan API Key. Or whatever explorer for your added chains.

```js
const INFURA_KEY = "YOUR_INFURA_KEY";
const ETHERSCAN_APIKEY = "YOUR_ETHERSCAN_KEY";
const BSCSCAN_APIKEY = "YOUR_BSCSCAN_KEY"
```
<br>

### Setting up the Origin Wallets

```js
//Valid Configurations 
{provider: '<provider_key>', privateKey: '<account_private_key>'},
{prefix: '<wallet_prefix>', provider: '<provider_key>', privateKey: '<account_private_key>'},
```
```js
// Wallets stored in .secret/ directory
// this will use the default wallet name, 'secret'
{provider: 'bsc-mainnet', privateKey:'0x...'},
// this will use the wallet prefix 'fresh'
{prefix: 'fresh', provider: 'bsc-mainnet', privateKey:'0x...'},
```
###### Example:
```js
// Provider key must match what is used as the key in PROVIDERS constant.
// Each Origin wallet can output to its own wallet as well. 
// this can be easily done by passing --multi-out flag
const ORIGIN_WALLETS = [
  {prefix: 'fresh', provider: 'bsc-mainnet', privateKey:'0x1...'},
  {prefix: 'fresh2', provider: 'bsc-mainnet', privateKey:'0x2...'},
  {prefix: 'fresh', provider: 'ethereum-mainnet', privateKey:'0x1...'},
  {prefix: 'ethmainnet', provider: 'ethereum-mainnet', privateKey:'0x2...'}
]
```
<br>

#### Example Providers:

```js

const PROVIDERS = {
  "ethereum-mainnet": {
    rpc_url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    api_url: "https://api.etherscan.io/api",
    api_key: ETHERSCAN_APIKEY,
    symbol: "ETH",
    nfts: { 
      erc721: ERC721_TO_KEEP, 
      erc1155: ERC1155_TO_KEEP 
    },
  },
  "bsc-mainnet": {
    rpc_url: "https://bsc-dataseed1.binance.org/",
    api_url: "https://api.bscscan.com/api",
    api_key: BSCSCAN_APIKEY,
    symbol: "BNB",
    nfts: {},
  },
};
```
<br>

### Setting up NFT Whitelists (ERC721 & ERC1155)
These constant NAMEs can be anything. They're only used to reference in the providers, which NFTs to scan. Make sure to properly separate ERC721 & ERC1155 addresses, and place them into their respective key within the provider object. 
###### Only ERC721 with functions *tokensOfOwner(owner)* or *tokenOfOwnerByIndex(owner, index)* are indexed.
###### Only ERC1155 with functions *totalSupplyAll()* and *balanceOf(owner, index)* are indexed.

```js
const ERC721_TO_KEEP = [
  "0xF4cd7e65348DEB24e30dedEE639C4936Ae38B763", //Galaktic Gang
  "0x5cF7f3C836949b3AcFcb0368CBd5cB1D56324342", //Avant Garbage Kids
  "0x57A7c5d10c3F87f5617Ac1C60DA60082E44D539e", //ALPIES
];

const ERC1155_TO_KEEP = [
  "0x2C50Cdea5Ac296741Bb87358B2005018eE172CfA", //Galactic-Gifts
  "0xd0aaFdC6eF44EB8a734382Bc40F9588446c7300f", //Galaktic-Gadgets
];
```
<br>

### Setting up the Token Whitelist
This can be skipped, and the array left blank. You're able to scan for all tokens each account owns, and it will be output to a .json file in the debug folder. This can be used to determine which tokens to keep. Or if the account just has tokens you've sent and hasn't been flooded with shitcoins. This is a GAS SAVING measure. Attempting to send 100's of shitcoins will eat your NATIVE token balance quickly.

Add the token SYMBOL to this array.
These are provided as an example.
```js
//Do not alter this constant NAME
const TOKENS_TO_KEEP = [
  "BTCB",
  "BSC-USD",
  "BUSD",
  "USDT",
  "WBNB",
  "WETH",
];
```

---
## 🎈 Usage <a name="usage"></a>
Simply starting the script with no flags will run it in WATCH mode, where no transactions will be sent.
To send transactions, use the **--transact** flag.

```sh
yarn start
# or
npm run start
# or
node index.js
```
#### Execution Flags
- `--transact`: This runs the script with sending transactions.
- `--multi-out`: This will output each origin wallet, to a new output wallet. Instead of just sending all assets to a single wallet.
- `--encrypt PASSWORD`: This outputs a password encrypted version of the wallet.
- `--clear-wallet`: This sends the CHAIN token balance to the new wallet. Can be ran without to clear all tokens, until satisfied with all tokens gone. And then ran with the flag to empty the CHAIN account. Omitting this flag will keep the account funded with the CHAIN token. This prints the necessary wallet information within the console to access the wallet mnemonic or privateKey to recover elsewhere.
- `--scan-all`: This searches for all tokens origin wallet has sent.
- `--wallet-prefix PREFIX`: This OVERRIDES the wallet prefixes set within config.js


#### Examples with flags

```sh
yarn start --scan-all
yarn start --wallet-prefix bullrun
yarn start --encrypt superstrongpassword
yarn start --multi-out
yarn start --transact 
yarn start --clear-wallet

#these can be chained together, in any order.
yarn start --scan-all --transact
yarn start --transact --clear-wallet
yarn start --encrypt superstrongpassword --transact --wallet-prefix dirtydingo --multi-out

```

---
## ⛏️ Built Using <a name = "built_using"></a>

- [Ethers](https://www.npmjs.com/package/ethers) - Web3 Interactions
- [Axios](https://www.npmjs.com/package/axios) - Http Requests
- [Bip39](https://www.npmjs.com/package/bip32) - Wallet Mnemonic Generation 
- [Node.js](https://nodejs.org/en/) - Javascript Framework

## ✍️ Author <a name = "author"></a>

- [@zy0n](https://github.com/zy0n) - Powerhouse
