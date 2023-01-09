const ethers = require('ethers');
const bip39 = require('bip39');



if(process.argv[2] != ''){
  
  console.log('Vanity Address Generator | Search : ',process.argv[2])
  vanityScan(process.argv[2]);
}
async function vanityScan(searchTerm) {

  // if we're found then dont initiate the call further, return out.
  let mnemonic = bip39.generateMnemonic(256);

  const secureWallet = ethers.Wallet.fromMnemonic(mnemonic);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${secureWallet.address}`)
  if (secureWallet.address.indexOf(searchTerm) != -1) {
    console.log('\n');
    console.log('Address: ',secureWallet.address);
    console.log('PrivateKey: ',secureWallet.privateKey);
    console.log(secureWallet.mnemonic);
  } else {
    setTimeout(vanityScan, 5, searchTerm);
  }

}
