const ethers = require('ethers');
const axios = require('axios');
const bip39 = require('bip39');
const fs = require('fs');
const path = require('path');

const {
  ORIGIN_WALLETS, 
  PROVIDERS, 
  TOKENS_TO_KEEP, 
  TOKEN_ABI,
  ERC721_ABI, 
  ERC1155_ABI
} = require('./constants');

var DRY_RUN = true;
var ENCRYPT = false;
var ENCRYPT_PASSWORD = '';
var CLEAR_WALLET = false;
var USE_MULTI = false;
var WALLET_OVERRIDE = null;
var SHOWN_ENCRYPTED = false;
var SCAN_ALL = false;


function parseWeiToFloat(bigNumber) {
  return parseFloat((ethers.utils.parseUnits(bigNumber.toString(), 'wei') / (10 ** 18)).toString());
}

function printLn(text) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(text);
}

function outputLogNFTs(n) {
  return n.erc1155 ? {
    symbol: n.symbol,
    ids_balances: { ids: n.ids, balances: n.balances.map(b => parseFloat(b.toString())) },
    address: n.address,
  } : {
    symbol: n.symbol,
    tokenId: n.readableId,
    address: n.address,
  };
};

function outputLogTokens(t) {
  return {
    symbol: t.symbol,
    balance: t.readableBalance,
    address: t.address
  };
};

async function outputAssetLogs(_tokens, _token_errors, _nfts, _nft_errors, _ogWallet, originWallet) {
  const out_tokens = _tokens?.map(outputLogTokens) || [];
  const out_token_errors = _token_errors?.map(outputLogTokens) || [];
  const out_nfts = _nfts?.map(outputLogNFTs) || [];
  const out_nft_errors = _nft_errors?.map(outputLogNFTs) || [];
  const out_str = JSON.stringify({ tokens: out_tokens, nfts: out_nfts, errors: { tokens: out_token_errors, nfts: out_nft_errors } }, null, 4);
  const out_path = path.join(process.cwd(), 'debug', `${_ogWallet.provider}_${originWallet.address}_assets.json`);
  await fs.writeFileSync(out_path, out_str);
}

async function outputRandomWallet(walletName, originAddress){

  const _walletName = WALLET_OVERRIDE || walletName;
  const walletPath = path.join(process.cwd(), '.secret', `${ USE_MULTI ?`${_walletName}_${originAddress}`: `${_walletName}`}_info.json`);
  let mnemonic = bip39.generateMnemonic(256);

  if(fs.existsSync(walletPath)){
    const _walletData = await fs.readFileSync(walletPath);
    if(ENCRYPT){
      if(ENCRYPT_PASSWORD != ''){
        try {
            const decryptedWallet = await ethers.Wallet.fromEncryptedJsonSync(_walletData, ENCRYPT_PASSWORD)
            mnemonic = decryptedWallet.mnemonic.phrase
        } catch (error) {
          console.log('⛔️ Error decrypting wallet.')
        }
      } else {
        console.log('⛔️ Please enter a password for your encrypted wallet.')
        process.exit(0)
      }
    } else {
      const walletData = JSON.parse(_walletData)
      mnemonic = walletData.mnemonic.phrase
    }
  }

  const secureWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const output = {
    mnemonic: secureWallet.mnemonic,
    address: secureWallet.address,
    privateKey: secureWallet.privateKey
  }

  if(ENCRYPT && !SHOWN_ENCRYPTED){
    console.log('👀 Showing Encrypted Wallet:')
    console.log(output)
    if(!USE_MULTI){
      SHOWN_ENCRYPTED = true;
    }
  }

  if(!fs.existsSync(walletPath)){
    console.log("WALLET NOT FOUND GENERATING:", walletPath)
    const jsonForm = JSON.stringify(output, null, 4);
    try {
      if(ENCRYPT){
        if(ENCRYPT_PASSWORD != ''){
          const encryptedWallet = await secureWallet.encrypt(ENCRYPT_PASSWORD)
          await fs.writeFileSync(walletPath, encryptedWallet)
  
        } else {
          console.log('💥 Please enter a password for your encrypted wallet.')
          process.exit(0)
        }
      } else {
        await fs.writeFileSync(walletPath, jsonForm)
      }
    } catch (error) {
      console.log('⛔️ Error writing encrypted wallet.')
    }
  }
  return output;
}

async function getERC20Balance(tokenAddress, balanceAddress, provider) {
  if (!ethers.utils.isAddress(tokenAddress) || !ethers.utils.isAddress(balanceAddress)) {
    throw new Error('Invalid Ethereum address');
  }
  const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const balance = await contract.balanceOf(balanceAddress);
  return balance;
}

async function getTokenBalances(walletAddress, provider, providerInfo){
  const params = {
    module: 'account',
    action: 'tokentx',
    address: walletAddress,
    sort: 'asc',
    apikey: providerInfo.api_key,
  };
  const response = await axios.get(providerInfo.api_url, { params });
  const transactions = response.data.result;
  const tokens = [];
  const used_tokens = {};
  const sent_to = {};
  
  for (let i = 0; i<transactions.length; i++) {
    const tx = transactions[i];
    const tokenAddress = tx.contractAddress;
    if(tx.from.toLowerCase() == walletAddress.toLowerCase()){
      sent_to[tx.to] = true;
    }
    printLn(`Scanning Tx ${i+1} of ${transactions.length} | 👍 ${tokens.length} `)
    const txValue = ethers.utils.parseUnits(tx.value, parseInt(tx.tokenDecimal));
    const scan_condition = SCAN_ALL ? true : (txValue.gt(0) && typeof sent_to[tx.to] != 'undefined' && sent_to[tx.to]);
    if(!used_tokens[tokenAddress] && (scan_condition || TOKENS_TO_KEEP.indexOf(tx.tokenSymbol) != -1)){ 
      const new_balance = await getERC20Balance(tokenAddress, walletAddress, provider);
      const newBalance = ethers.utils.parseUnits(new_balance.toString(), tx.tokenDecimal).toString();
      const readableBalance = parseFloat((ethers.utils.parseUnits(new_balance.toString(), `wei`) / (10 ** parseInt(tx.tokenDecimal))).toString());
      if(newBalance != '0'){
        tokens.push({address: tokenAddress, decimals: tx.tokenDecimal, symbol: tx.tokenSymbol, balance: newBalance, readableBalance: readableBalance, bigBalance: new_balance});
      }
      used_tokens[tokenAddress] = true;
    }
  }
  console.log('💫');
  return tokens;
}

async function getNFTBalances(walletAddress, provider, providerInfo){

  var tokens = [];
  if(providerInfo.nfts.erc721 != null){
    for (let i = 0; i < providerInfo.nfts.erc721.length; i++) {
      const nft = providerInfo.nfts.erc721[i];
      const ids = await _getERC721s(nft, provider, walletAddress)
      if(ids.length > 0){
        tokens = [...tokens, ...ids];
      }
    }
  }
  if(providerInfo.nfts.erc1155 != null){
    for (let i = 0; i < providerInfo.nfts.erc1155.length; i++) {
      const nft = providerInfo.nfts.erc1155[i];
      const ids = await _getERC1155s(nft, provider, walletAddress);
      if(ids.length > 0){
        tokens = [...tokens, ...ids];
      }
    }
  }
  return tokens;
}

async function _getERC721s(contractAddress, provider, userAddress) {
  const output = [];
  try {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    const symbol = await contract.symbol();
    const balance = await contract.balanceOf(userAddress);
    if(balance > 0){
      try {
        const tokenIds = await contract.tokensOfOwner(userAddress)
        tokenIds.forEach(id =>{
          output.push({
            address: contractAddress,
            symbol: symbol,
            readableId: parseInt(id.toString()),
            tokenId: id,
            erc1155: false
          })
        })
      } catch (error) {
        try {
          for (let i = 0; i < balance; i++) {
            const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
            output.push({
              address: contractAddress,
              symbol: symbol,
              readableId: parseInt(tokenId.toString()),
              tokenId: tokenId,
              erc1155: false
            })
          }
        } catch (error) {
          console.log('⛔️ Failed loading ',contractAddress)
        }
      }
    }
    return output
  } catch (error) {
    console.log(error)
    console.log('⛔️ There was an error gathering ERC721s')
  }
}

async function _getERC1155s(contractAddress, provider, userAddress) {
  const output = [];
  try {
    const ids = [];
    const balances = [];
    const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
    const symbol = await contract.symbol();
    const totalSupplies = await contract.totalSupplyAll();
    for (let i = 1; i<=totalSupplies.length; i++) {
      const balance = await contract.balanceOf(userAddress, i);
      if (balance.gt(0)) {
        ids.push(i);
        balances.push(balance)
      }
    }
    if(ids.length > 0){
      output.push({
        address: contractAddress,
        symbol: symbol,
        ids: ids,
        balances: balances,
        erc1155: true,
      })
    }
    return output
  } catch (error) {
    console.log(error)
    console.log('⛔️ There was an error gathering ERC721s')
  }
}

async function checkNFTGas(tokens, toAddress, originWallet){
  const output = [];
  const errors = [];
  let totalGas = ethers.BigNumber.from(0);
  const gasPrice = await originWallet.getGasPrice();
  let display_total = parseWeiToFloat(totalGas)
  for(let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    display_total = parseWeiToFloat(totalGas)
    printLn(`🗿 Checking NFT Gas: ${i+1} of ${tokens.length} | Est. ${display_total} `)
    try {
      if(token.erc1155){
        if(token.ids.length > 0){
          const contract = new ethers.Contract(token.address, ERC1155_ABI, originWallet);
          const tx = await contract.estimateGas.safeBatchTransferFrom(originWallet.address, toAddress, token.ids, token.balances, '0x');
          totalGas = totalGas.add(tx.mul(gasPrice));
          output.push(token);
        }
      } else {
        const contract = new ethers.Contract(token.address, ERC721_ABI, originWallet);
        const tx = await contract.estimateGas.safeTransferFrom(originWallet.address, toAddress, token.tokenId)
        totalGas = totalGas.add(tx.mul(gasPrice));
        output.push(token);
      }
    } catch (error) {
      errors.push(token)
    }
  }
  console.log('💫');
  return {gasCost:totalGas, readable:display_total, out_nfts:output, nft_errors:errors};
}

async function checkTokenGas(tokens, toAddress, originWallet){
  const output = [];
  const errors = [];
  let totalGas = ethers.BigNumber.from(0);
  const gasPrice = await originWallet.getGasPrice();
  let display_total = parseWeiToFloat(totalGas)
  for(let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    display_total = parseWeiToFloat(totalGas)
    printLn(`🗿 Checking Token Gas: ${i+1} of ${tokens.length} | Est. ${display_total} `);
    try {
      const contract = new ethers.Contract(token.address, TOKEN_ABI, originWallet);
      const tx = await contract.estimateGas.transfer(toAddress, token.bigBalance)
      totalGas = totalGas.add(tx.mul(gasPrice));
      output.push(token);
    } catch (error) {
      errors.push(token)
    }
  }
  console.log('💫');
  return {gasCost:totalGas, readable:display_total, out_tokens:output, token_errors:errors};
}

async function moveTokensToAddress(tokens, toAddress, originWallet){

  for(let i = 0; i < tokens.length; i++) {
    try {
      const token = tokens[i];
      const contract = new ethers.Contract(token.address, TOKEN_ABI, originWallet);
      if(!DRY_RUN){
        const tx = await contract.transfer(toAddress, token.bigBalance)
      }
      console.log(`${DRY_RUN ? '👀 Faux Sent' : '💰 Sent'} ${token.readableBalance} ${token.symbol}`)
    } catch (error) {
        console.error('⛔️ There was an error... try again. ');
    }
  }
}

async function moveNFTsToAddress(tokens, toAddress, originWallet){

  for(let i = 0; i < tokens.length; i++) {
    try {
      const token = tokens[i];
      if(token.erc1155){
        if(token.ids.length > 0){
          const contract = new ethers.Contract(token.address, ERC1155_ABI, originWallet);
          if(!DRY_RUN){
            const tx = await contract.safeBatchTransferFrom(originWallet.address, toAddress, token.ids, token.balances, '0x');
          }
          console.log(`${DRY_RUN ? '👀 Faux Sent' : '💰 Sent'} ${token.symbol} #${token.ids} qty:(${token.balances})`)
        }
      } else {
        const contract = new ethers.Contract(token.address, ERC721_ABI, originWallet);
        if(!DRY_RUN){
          const tx = await contract.safeTransferFrom(originWallet.address, toAddress, token.tokenId)
        }
        console.log(`${DRY_RUN ? '👀 Faux Sent' : '💰 Sent'} ${token.symbol} #${token.tokenId}`)
      }
    } catch (error) {
      console.error('⛔️ There was an error... try again. ');
      console.log(error)
    }
  }
}

async function sendChainBalance(provider, walletInfo, chain_balance, originWallet) {
  try {
    const gasPrice = await provider.getGasPrice();
    let tx = {
      to: walletInfo.address,
      value: chain_balance,
      gasPrice: gasPrice
    };
    const gasCost = await provider.estimateGas(tx);
    const gas_consumed = gasCost.mul(gasPrice);
    tx.value = tx.value.sub(gas_consumed);
    const sentTx = await originWallet.sendTransaction(tx);
    console.log(`🍻 Transaction Hash: ${sentTx.hash}`);
  } catch (error) {
    console.log('⛔️ There was an error processing that transaction, please try again.');
    console.log(error.message);
  }
}

async function runTheMagic(){

  for(let i = 0; i < ORIGIN_WALLETS.length; i++){
  
    const _ogWallet = ORIGIN_WALLETS[i];
    const providerInfo = PROVIDERS[_ogWallet.provider]
    const provider = new ethers.providers.JsonRpcProvider(providerInfo.rpc_url);
    const originWallet = new ethers.Wallet( _ogWallet.privateKey, provider);
    const walletInfo = await outputRandomWallet((_ogWallet.prefix || 'secret'), originWallet.address);
  
    const chain_balance = await provider.getBalance(originWallet.address)
    const current_balance = ethers.utils.formatEther(chain_balance).toString();
    console.log(_ogWallet.provider.toUpperCase(),'|', originWallet.address, `(${parseFloat(current_balance)} ${providerInfo.symbol})`)
    const tokens = await getTokenBalances(originWallet.address, provider, providerInfo);
    const nfts = await getNFTBalances(originWallet.address, provider, providerInfo);
    let _tokens = tokens;
    let _nfts = nfts;
    let _nft_errors = [];
    let _token_errors = [];
    if(nfts.length > 0){
        console.log(`🍻 Transferring NFTS\n${originWallet.address} ⏩ ${walletInfo.address}`)
        const {gasCost, readable, out_nfts, nft_errors} = await checkNFTGas(nfts, walletInfo.address, originWallet);
        _nfts = out_nfts;
        _nft_errors = nft_errors;
        const now_balance = await provider.getBalance(originWallet.address)
        if(now_balance.gt(gasCost)){
          if(_nfts.length > 0){
            console.log('✅ We have enough gas, Sending NFTs')
            await moveNFTsToAddress(_nfts, walletInfo.address, originWallet)
          } else {
            console.log('🥀 No NFTs to send? Check for errored NFTs in the debug log. 👀')
          }
        } else {
          const needed = gasCost.sub(now_balance);
          const gas_needed = parseWeiToFloat(needed);
          console.log(`⛔️ NFTS: Not enough gas. Needs: ${gas_needed.toString()} ${providerInfo.symbol}`)
        }
    }
    if(tokens.length > 0){
      console.log(`🍻 Transferring Tokens\n${originWallet.address} ⏩ ${walletInfo.address}`)
      const {gasCost, readable, out_tokens, token_errors} = await checkTokenGas(tokens, walletInfo.address, originWallet);
      _tokens = out_tokens;
      _token_errors = token_errors;
      const now_balance = await provider.getBalance(originWallet.address)
      if(now_balance.gt(gasCost)){
        if(_tokens.length > 0){
          console.log('✅ We have enough gas, Sending Tokens')
          await moveTokensToAddress(_tokens, walletInfo.address, originWallet)
        } else {
            console.log('🥀 No Tokens to send? Check for errored Tokens in the debug log. 👀')
        }
      } else {
        const needed = gasCost.sub(now_balance);
        const gas_needed = parseWeiToFloat(needed);
        console.log(`⛔️ TOKENS: Not enough gas. Needs: ${gas_needed.toString()} ${providerInfo.symbol}`)
      }
    }
    await outputAssetLogs(_tokens, _token_errors, _nfts, _nft_errors, _ogWallet, originWallet);
    if(CLEAR_WALLET){
      console.log('💰 Sending remaining balance.')
      await sendChainBalance(provider, walletInfo, chain_balance, originWallet);
    } else {
      const remains = parseFloat(current_balance);
      if(remains > 0){
        console.log(`👀 There is still (${remains} ${providerInfo.symbol}) left on this account.`)
      } else {
        console.log(`✅ There's no more ${providerInfo.symbol} on this account.`)
      }
    }
    
  }

}


async function runMigrator() {
  
  // ##EXECUTION FLAGS##
  //                        |
  // --transact             | This runs the script with sending transactions.
  //                        |
  // --multi-out            | This will output each origin wallet, to a new output wallet.
  //                        | Instead of just sending all assets to a single wallet.
  //                        |
  // --encrypt PASSWORD     | This outputs an password encrypted version of the wallet. 
  //                        |
  // --clear-wallet         | This sends the CHAIN token balance to the new wallet. 
  //                        | Can be ran without to clear all tokens, until satisfied with all tokens gone.
  //                        | And then ran with the flag to empty the CHAIN account 
  //                        | * Omitting this flag will keep the account funded with the CHAIN token.
  //                        |
  // --scan-all             | This searches for all tokens origin wallet has sent. 
  //                        |
  // --wallet-prefix PREFIX | This OVERRIDES the wallet prefixes set within constants.js

  const secret_path = path.join(process.cwd(), '.secret')  
  const debug_path = path.join(process.cwd(), 'debug')
  if(!fs.existsSync(secret_path)){
    console.log('💾 Generating .secret Directory.')
    await fs.mkdirSync(secret_path);
  }
  if(!fs.existsSync(debug_path)){
    console.log('💾 Generating debug Directory.')
    await fs.mkdirSync(debug_path);
  }

  if(process.argv[2] != ''){
    const args = process.argv.slice(2);
    args.forEach((a, i) =>{
      if(a.startsWith('--')){
        switch(a){
          case '--transact':
            DRY_RUN = false;
            break;
          case '--encrypt':
            const enc_override = args[i+1];
            if(!enc_override.startsWith('--') && enc_override != '' && enc_override != ' '){
              ENCRYPT = true;
              console.log('🌎 ENCRYPTING OUTPUT WALLET', ENCRYPT)
              ENCRYPT_PASSWORD = enc_override;
            } else {
              console.log('⛔️ Please enter a password.')
              process.exit(0)
            }
            break;
          case '--clear-wallet':
            CLEAR_WALLET = true;
            console.log("🌎 WALLET WILL BE CLEARED", CLEAR_WALLET)
            break;
          case '--multi-out':
            USE_MULTI = true;
            console.log("🌎 MULTIPLE_OUTPUT_WALLETS", USE_MULTI)
            break;
          case '--wallet-prefix':
            const prefix_override = args[i+1];
            if(!prefix_override.startsWith('--') && prefix_override != '' || prefix_override != ' '){

              WALLET_OVERRIDE = args[i+1];
              console.log("🌎 USING OVERRIDE PREFIX", WALLET_OVERRIDE)
            } else {
              console.log('⛔️ Please enter a valid wallet prefix.')
              process.exit(0)
            }
            break;
          case '--scan-all':
            SCAN_ALL = true;
            console.log("🌎 SCANNING ALL", SCAN_ALL)
            break;
          default:
              break;
        }
      }
    })
  }
  console.log('🌎 DRY RUN ENABLED', DRY_RUN)
  runTheMagic();
}

runMigrator()
