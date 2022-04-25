const fs = require("fs");
const {
  ec,
  Contract,
  Provider,
  Signer,
  number,
} = require("starknet");
const savedKeyPair = require("./key-pair.json");
const { addresses } = require("./constants");
const accountCompiled = require("./ArgentAccount.json");

const transformCallsToMulticallArrays = require('./node_modules/starknet/utils/transaction.js');

const provider = new Provider({
  baseUrl: "https://hackathon-3.starknet.io",
});

async function createAccount() {
  try {
    const starkKeyPair = ec.genKeyPair();
    const starkKeyPub = ec.getStarkKey(starkKeyPair);

    console.log("Key pair generated");
    console.log(`Pub key: ${starkKeyPub}`);

    let data = JSON.stringify(starkKeyPair);
    fs.writeFileSync("key-pair.json", data);

    const compiledArgentAccount = JSON.parse(
      fs.readFileSync("./ArgentAccount.json").toString("ascii")
    );

    const accountResponse = await provider.deployContract({
      contract: compiledArgentAccount,
      addressSalt: starkKeyPub,
    });

    await provider.waitForTransaction(accountResponse.transaction_hash);
    console.log("Aссount contract deployed");

    const accountContract = new Contract(
      compiledArgentAccount.abi,
      accountResponse.address,
      provider
    );
    console.log(`Contract address: ${accountContract.address}`);

    const { transaction_hash: initializeTxHash } =
      await accountContract.initialize(starkKeyPub, "0");
    await provider.waitForTransaction(initializeTxHash);

    console.log("Account initialized");
  } catch (err) {
    console.log(`Err: ${err}`);
  }
}

async function test1() {
  const testAccount = new Contract(
    accountCompiled.abi,
    addresses.main_account,
    provider
  );
  // const signer = new Signer(savedKeyPair);

  const compiledErc20 = JSON.parse(
    fs.readFileSync("./ERC20.json").toString("ascii")
  );

  // const erc20Response = await provider.deployContract({
  //   contract: compiledErc20,
  // });

  // await provider.waitForTransaction(erc20Response.transaction_hash);
  // const erc20Address = erc20Response.address;

  // Create a new erc20 contract object
  const erc20 = new Contract(compiledErc20.abi, '0x4d93f7be39bd96d178ae27c61fd4276f25741ed2b5bc32dd679eaf38da25f75', provider);

  console.log('erc address : ',erc20.address);

  console.log(
    `Invoke Tx - Minting 1000 tokens to ${testAccount.address}...`
  );
  const { transaction_hash: mintTxHash } = await erc20.mint(
    testAccount.address,
    "1000"
  );
  console.log(mintTxHash);
  console.log(`Waiting for Tx to be Accepted on Starknet - Minting...`);
  // await provider.waitForTransaction(mintTxHash);

  console.log(`Calling StarkNet for accountContract : ${testAccount.address} balance...`);
  const balanceBeforeTransfer = await erc20.balance_of(testAccount.address);

  // console.log(
  //   `accountContract Address ${addresses.main_account} has a balance of:`,
  //   number.toBN(balanceBeforeTransfer.res, 16).toString()
  // );

  return;

  console.log(`Calling StarkNet for accountContract nonce...`);
  const nonce = (await testAccount.call("get_nonce")).nonce.toString();
  const calls = [
    {
      contractAddress: erc20Address,
      entrypoint: "transfer",
      calldata: [erc20Address, "10"],
    },
  ];

  const signature = ec.sign(starkKeyPair, msgHash);

  const { callArray, calldata } = transformCallsToMulticallArrays(calls);
  // Execute tx transfer of 10 tokens
  console.log(`Invoke Tx - Transfer 10 tokens back to erc20 contract...`);
  const { transaction_hash: transferTxHash } = await testAccount.__execute__(
    callArray,
    calldata,
    nonce,
    signature
  );
}

// createAccount();
test1();
