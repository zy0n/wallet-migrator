<h1 align="center">Wallet Migration Tool</h1>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/zy0n/wallet-migrator)](https://github.com/zy0n/wallet-migrator/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/zy0n/wallet-migrator)](https://github.com/zy0n/wallet-migrator/pulls)
</div>

---

<p align="center">
    This Directory holds the logs of each processed addresses assets.
</p>

### Disclaimer:
###### I hold **NO RESPONSIBILITY** for your actions. Use of this script is at **YOUR OWN RISK**. This is **NOT** a toy. 
###### Do not upload your privateKeys to github.
###### Be safe.
---


## Owned Asset Log Output Example
The Asset Log is the list of tokens the script has found on your account, and would process transactions for.
 - This can be used to ammend the list of **TOKENS_TO_KEEP** in *constants.js*
 - NFTS will not be 'scanned' Only NFT's you list within *constants.js* and provide to the **PROVIDER** will be indexed. See Opensea.io for curating your nft lists.


##### I've redacted the SCAMTOKENS addresses.
```json
{
    "tokens": [
        {
            "symbol": "Byson",
            "balance": 24005489.339336608,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        },
        {
            "symbol": "ELOM",
            "balance": 986901420.984,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        },
        {
            "symbol": "HLD",
            "balance": 0.5659647976092003,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        },
        {
            "symbol": "DCN",
            "balance": 223776382584.96262,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        },
        {
            "symbol": "TESTETESTE",
            "balance": 2243.8493359850595,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        }
    ],
    "nfts": [
        {
            "symbol": "AGK",
            "tokenId": 1,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        },
        {
            "symbol": "AGK",
            "tokenId": 2,
            "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
        },
        {
            "symbol": "G-Gifts",
            "ids_balances": {
                "ids": [
                    1,
                    2
                ],
                "balances": [
                    2,
                    7
                ]
            },
            "address": "0x2C50Cdea5Ac296741Bb87358B2005018eE172CfA"
        },
        {
            "symbol": "G-Gadgets",
            "ids_balances": {
                "ids": [
                    1,
                    5
                ],
                "balances": [
                    1,
                    1
                ]
            },
            "address": "0xd0aaFdC6eF44EB8a734382Bc40F9588446c7300f"
        }
    ],
    "errors": {
        "tokens": [
            {
                "symbol": "akSwap.io",
                "balance": 250000,
                "address": "0xSKAMSKAMSKAMSKAMSKAMTOKENSKAMTOKNSKAMTOKEN"
            }
        ],
        "nfts": [ // these are simulated errors, this token should not error.
            {
                "symbol": "ALPIES",
                "tokenId": 1843,
                "address": "0x57A7c5d10c3F87f5617Ac1C60DA60082E44D539e"
            },
            {
                "symbol": "ALPIES",
                "tokenId": 1856,
                "address": "0x57A7c5d10c3F87f5617Ac1C60DA60082E44D539e"
            }
        ]
    }
}
```