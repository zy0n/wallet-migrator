const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const ethers = require("ethers");
const bip39 = require("bip39");
const fs = require("fs");
const openPGP = require("openpgp");

const mnemonicSize = {
  regular: 128,
  double: 256,
};

function randGenerateWallet() {
  const mnemonic = bip39.generateMnemonic(mnemonicSize.regular);
  console.log(mnemonic)
  return ethers.Wallet.fromMnemonic(mnemonic);
}

function getWalletInfo(secureWallet, elapsedSeconds) {
  return {
    elapsedSeconds: elapsedSeconds.toFixed(2),
    address: secureWallet.address,
    privateKey: secureWallet.privateKey,
    mnemonic: secureWallet.mnemonic,
  };
}

// Worker thread logic
if (!isMainThread) {
  const { searchTerm, amount, startTime } = workerData;
  let foundCount = 0;
  let totalScans = 0;

  async function searchVanityAddress() {
    while (foundCount < amount) {
      const secureWallet = randGenerateWallet();
      totalScans++;

      if (
        secureWallet.address.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const walletInfo = getWalletInfo(secureWallet, elapsedSeconds);
        console.log("wpk", walletInfo.privateKey);
        const rawFile = JSON.stringify(walletInfo, null, 2);
        const rawBuffer = Buffer.from(rawFile);

        const message = await openPGP.createMessage({ binary: rawBuffer });
        const encrypted = await openPGP.encrypt({
          message,
          passwords: ["password"],
          format: "armored",
        });

        const dir = `./vanity/${searchTerm}`;
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(`${dir}/${secureWallet.address}.json`, encrypted);

        foundCount++;
        parentPort.postMessage({ found: true, address: secureWallet.address });
      }

      parentPort.postMessage({
        found: false,
        scans: totalScans,
        address: secureWallet.address,
      });
    }
  }

  searchVanityAddress().then(() => parentPort.close());
} else {
  // Main thread logic
  const startTime = Date.now();
  const searchTerm = process.argv[2];
  const amount = parseInt(process.argv[3], 10) || 1;
  let numThreads = parseInt(process.argv[4], 10) || 4;

  if (!searchTerm) {
    console.error("Please provide a search term as the first argument.");
    process.exit(1);
  }

  console.log(`Vanity Address Generator | Search: ${searchTerm}`);
  console.log(`Amount: ${amount}, Threads: ${numThreads}`);
  console.log("Starting timer...");

  let totalScans = 0;
  let foundCount = 0;

  const workers = [];
  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        searchTerm,
        amount: Math.ceil(amount / numThreads),
        startTime,
      },
    });

    worker.on("message", (msg) => {
      if (msg.found) {
        foundCount++;
        console.log(
          `\nFound address: ${msg.address} (Total found: ${foundCount})`
        );
        if (foundCount >= amount) {
          console.log("Search complete. Stopping all workers...");
          workers.forEach((w) => w.terminate());
        }
      } else {
        totalScans += msg.scans;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Total scans: ${totalScans} ${msg.address}`);
      }
    });

    worker.on("exit", () => {
      if (--numThreads === 0) {
        console.log("\nAll workers have finished.");
      }
    });

    workers.push(worker);
  }
}
