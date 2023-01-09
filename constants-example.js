const INFURA_KEY = "YOUR_INFURA_KEY";
const ETHERSCAN_APIKEY = "YOUR_ETHERSCAN_KEY";
const BSCSCAN_APIKEY = "YOUR_BSCSCAN_KEY"

const ORIGIN_WALLETS = [
  {
    prefix: "fresh",
    provider: "bsc-mainnet",
    privateKey:
      "0x...",
  },
  {
    prefix: "fresh",
    provider: "ethereum-mainnet",
    privateKey:
      "0x...",
  }
];

const ERC721_TO_KEEP = [
  "0xF4cd7e65348DEB24e30dedEE639C4936Ae38B763", //Galaktic Gang
  "0x5cF7f3C836949b3AcFcb0368CBd5cB1D56324342", //Avant Garbage Kids
  "0x57A7c5d10c3F87f5617Ac1C60DA60082E44D539e", //ALPIES
];

const ERC1155_TO_KEEP = [
  "0x2C50Cdea5Ac296741Bb87358B2005018eE172CfA", //Galactic-Gifts
  "0xd0aaFdC6eF44EB8a734382Bc40F9588446c7300f", //Galaktic-Gadgets
];

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

const TOKENS_TO_KEEP = [
  "BTCB",
  "BSC-USD",
  "BUSD",
  "USDT",
  "WBNB",
  "WETH",
  "AUTO",
  "SHIB",
  // 'CHI'
];

const TOKEN_ABI = [
  "function transfer(address _to, uint256 _value)",
  "function balanceOf(address _owner) view returns (uint256 balance)",
];

const ERC721_ABI = [
  "function symbol() view returns (string)",
  "function balanceOf(address _owner) view returns (uint256 balance)",
  "function tokensOfOwner(address _owner) view returns (uint256[])",
  "function tokenOfOwnerByIndex(address _owner, uint256 _index) view returns (uint256 tokenId)",
  "function safeTransferFrom(address _from, address _to, uint256 _tokenId)",
];

const ERC1155_ABI = [
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address _owner, uint256 _id) view returns (uint256 balance)",
  "function totalSupplyAll() view returns (uint256[] supply)",
  "function safeBatchTransferFrom(address _from, address _to, uint256[] _ids, uint256[] _values, bytes data)",
];

module.exports = {
  ORIGIN_WALLETS,
  PROVIDERS,
  TOKENS_TO_KEEP,
  TOKEN_ABI,
  ERC721_ABI,
  ERC1155_ABI,
};
