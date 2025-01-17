import { program } from "commander";
import { PublicKey } from "@solana/web3.js";
import {
  configProject,
  createBondingCurve,
  setClusterConfig,
  swap,
  initMigrationTx,
  getCurrentPrice,
  calculateSwap,
} from "./scripts";

program.version("0.0.1");

programCommand('migrate')
    .requiredOption('-m, --mint <string>', 'Token mint address')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .action(async (directory, cmd) => {
        const { env, keypair, rpc, mint } = cmd.opts();

        await setClusterConfig(env, keypair, rpc)
        const migrateTxId = await initMigrationTx(mint);
        console.log("Transaction ID: ", migrateTxId);
    });

programCommand("config").action(async (directory, cmd) => {
  const { env, keypair, rpc } = cmd.opts();

  console.log("Solana Cluster:", env);
  console.log("Keypair Path:", keypair);
  console.log("RPC URL:", rpc);

  await setClusterConfig(env, keypair, rpc);

  await configProject();
});

programCommand("curve").action(async (directory, cmd) => {
  const { env, keypair, rpc } = cmd.opts();

  console.log("Solana Cluster:", env);
  console.log("Keypair Path:", keypair);
  console.log("RPC URL:", rpc);

  await setClusterConfig(env, keypair, rpc);

  await createBondingCurve();
});

programCommand("swap")
  .option("-t, --token <string>", "token address")
  .option("-a, --amount <number>", "swap amount")
  .option("-s, --style <string>", "0: buy token, 1: sell token")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, token, amount, style } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);

    await setClusterConfig(env, keypair, rpc);

    if (token === undefined) {
      console.log("Error token address");
      return;
    }

    if (amount === undefined) {
      console.log("Error swap amount");
      return;
    }

    if (style === undefined) {
      console.log("Error swap style");
      return;
    }

    await swap(new PublicKey(token), amount, style);
  });


function programCommand(name: string) {
  return program
    .command(name)
    .option(
      //  mainnet-beta, testnet, devnet
      "-e, --env <string>",
      "Solana cluster env name",
      "devnet"
    )
    .option(
      "-r, --rpc <string>",
      "Solana cluster RPC name",
      "https://api.devnet.solana.com"
    )
    .option(
      "-k, --keypair <string>",
      "Solana wallet Keypair Path",
      "./keys/3uHJMHzeiqdqQ3LNc5bNVxuCp224HGtStPkv1JUEcabr.json"
    );
}

 programCommand('getCurrentPrice')
  .requiredOption('-m, --mint <string>', 'Token mint address')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
      const { env, keypair, rpc, mint } = cmd.opts();

      await setClusterConfig(env, keypair, rpc)
      const currentPrice = await getCurrentPrice(mint);
  });

  programCommand('calculateSwap')
  .requiredOption("-a, --amount <number>", "swap amount")
  .requiredOption('-m, --mint <string>', 'Token mint address')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
      const { env, keypair, rpc, amount, mint } = cmd.opts();

      await setClusterConfig(env, keypair, rpc)
      const tokenOutAmount = await calculateSwap(mint, amount);
  });

program.parse(process.argv);

/*

  yarn script config
  yarn script curve     //catch token_address
  yarn script getCurrentPrice -m EfBKtYDURoWtoH8AszmheAP2nQnmAEdAMWhWV36BvhjD
  yarn script calculateSwap -m EfBKtYDURoWtoH8AszmheAP2nQnmAEdAMWhWV36BvhjD -a 2
  yarn script swap -t EfBKtYDURoWtoH8AszmheAP2nQnmAEdAMWhWV36BvhjD -a 2000000000 -s 0
  yarn script migrate -m EfBKtYDURoWtoH8AszmheAP2nQnmAEdAMWhWV36BvhjD
  
*/