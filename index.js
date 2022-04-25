const fs = require('fs');
const { ec, defaultProvider, Contract, Provider, Signer } = require('starknet');
const savedKeyPair = require('./key-pair.json');
const provider = new Provider({
  baseUrl: 'https://hackathon-3.starknet.io',
});

async function createAccount() {
  try {
    const starkKeyPair = ec.genKeyPair();
    const starkKeyPub = ec.getStarkKey(starkKeyPair);

    console.log('Key pair generated');
    console.log(`Pub key: ${starkKeyPub}`);

    let data = JSON.stringify(starkKeyPair);
    fs.writeFileSync('key-pair.json', data);

    const compiledArgentAccount = JSON.parse(
      fs.readFileSync('./ArgentAccount.json').toString('ascii'),
    );

    const accountResponse = await provider.deployContract({
      contract: compiledArgentAccount,
      addressSalt: starkKeyPub,
    });

    await provider.waitForTransaction(accountResponse.transaction_hash);
    console.log('Aссount contract deployed');

    const accountContract = new Contract(
      compiledArgentAccount.abi,
      accountResponse.address,
      provider
    );
    console.log(`Contract address: ${accountContract.address}`);

    const { transaction_hash: initializeTxHash } =
      await accountContract.initialize(starkKeyPub, '0');
    await provider.waitForTransaction(initializeTxHash);

    console.log('Account initialized');
  } catch (err) {
    console.log(`Err: ${err}`);
  }
}

async function test1 () {

  const signer = new Signer(starkKeyPair);
  console.log(signer);
  const pubKey  = await signer.getPubKey();
  console.log(pubKey)

  const compiledErc20 = json.parse(
      fs.readFileSync("./ERC20.json").toString("ascii")
  );
}


createAccount();
// test1();
