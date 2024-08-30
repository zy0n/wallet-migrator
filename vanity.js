const ethers = require("ethers");
const bip39 = require("bip39");
const fs = require("fs");

const openPGP = require("openpgp");

let startTime = Date.now();
let endTime = Date.now();
const mnemonicSize = {
  regular: 128,
  double: 256,
};

function generateWallets() {
  const wallets = Array(100)
    .fill(0)
    .map(() => randGenerateWallet());
  return wallets;
}
function randGenerateWallet() {
  let mnemonic = bip39.generateMnemonic(mnemonicSize.double);

  const secureWallet = ethers.Wallet.fromMnemonic(mnemonic);
  return secureWallet;
}

function getWalletInfo(secureWallet, difference) {
  return {
    elapsedSeconds: difference.toFixed(2),
    address: secureWallet.address,
    privateKey: secureWallet.privateKey,
    mnemonic: secureWallet.mnemonic,
  };
}

let totalScans = 0;
let foundCount = 0;

async function vanityScan(searchTerm, amount = 1) {
  // if we're found then dont initiate the call further, return out.
  const wallets = generateWallets();
  let found = false;
  for (const secureWallet of wallets) {
    // const secureWallet = randGenerateWallet();
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      `[${totalScans++}] scanned.  | ${secureWallet.address}`
    );
    if (
      secureWallet.address.toLowerCase().indexOf(searchTerm.toLowerCase()) != -1
    ) {
      endTime = Date.now();
      const difference = (endTime - startTime) / 1000;
      console.log(
        `\nThat took ${difference.toFixed(2)} seconds | ${(
          difference / 60
        ).toFixed(2)} minutes.`
      );
      console.log("\n");
      console.log("Address: ", secureWallet.address);
      console.log("PrivateKey: ", secureWallet.privateKey);
      console.log(secureWallet.mnemonic);
      const walletInfo = getWalletInfo(secureWallet, difference);
      foundCount++;
      fs.mkdirSync(`./vanity/${searchTerm}`, { recursive: true });
      const rawFILE = JSON.stringify(walletInfo, null, 2);

      const rawbuffer = Buffer.from(rawFILE);
      const message = await openPGP.createMessage({ binary: rawbuffer });
      const encrypted = await openPGP.encrypt({
        message,
        passwords: ["password"],
        format: "armored",
      });
      fs.writeFileSync(
        `./vanity/${searchTerm}/${secureWallet.address}.json`,
        encrypted
      );
      if (foundCount >= amount) {
        console.log("REACHED AMOUNT, ", amount);
        found = true;
        break;
      }
    }
  }
  if (!found && foundCount < amount) {
    await vanityScan(searchTerm, amount);
    // setTimeout(vanityScan, 5, searchTerm, amount);
  }
}

const main = async () => {
  if (typeof process.argv[2] != "undefined") {
    console.log("Vanity Address Generator | Search : ", process.argv[2]);
    console.log("Starting timer");
    startTime = Date.now();
    const amount = process.argv[3] || 1;
    console.log("Amount: ", amount);

    await vanityScan(process.argv[2], amount);
  }
};
main()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    //cleanup code
    console.log("done vanity scan");
  });
