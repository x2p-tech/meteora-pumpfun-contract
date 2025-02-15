import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import fs from "fs";

import { Keypair, Connection, PublicKey, SystemProgram, TransactionInstruction, SYSVAR_RENT_PUBKEY, ComputeBudgetProgram, Transaction, TransactionMessage, AddressLookupTableProgram , VersionedTransaction} from "@solana/web3.js";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import { PumpMeteora } from "../target/types/pump_meteora";
import {
  createConfigTx,
  createBondingCurveTx,
  swapTx,
} from "../lib/scripts";
import { execTx } from "../lib/util";
import {
  TEST_DECIMALS,
  TEST_INIT_BONDING_CURVE,
  TEST_NAME,
  TEST_SYMBOL,
  TEST_TOKEN_SUPPLY,
  TEST_URI,
  TEST_VIRTUAL_RESERVES,
  TEST_INITIAL_VIRTUAL_TOKEN_RESERVES,
  TEST_INITIAL_VIRTUAL_SOL_RESERVES,
  TEST_INITIAL_REAL_TOKEN_RESERVES,
  SEED_BONDING_CURVE,
  SEED_CONFIG,
  TEST_INITIAL_METEORA_TOKEN_RESERVES,
  TEST_INITIAL_METEORA_SOL_AMOUNT,
} from "../lib/constant";
import { createMarket } from "../lib/create-market";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { web3JsRpc } from '@metaplex-foundation/umi-rpc-web3js';
import { keypairIdentity, publicKey, transactionBuilder, TransactionBuilder, Umi } from '@metaplex-foundation/umi';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { fromWeb3JsKeypair, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import AmmImpl, { PROGRAM_ID } from '@mercurial-finance/dynamic-amm-sdk';
import VaultImpl, { getVaultPdas } from '@mercurial-finance/vault-sdk';
import { SEEDS, METAPLEX_PROGRAM } from '@mercurial-finance/dynamic-amm-sdk/dist/cjs/src/amm/constants';
import { createProgram } from "@mercurial-finance/dynamic-amm-sdk/dist/cjs/src/amm/utils";
import { derivePoolAddressWithConfig, getOrCreateATAInstruction, deriveMintMetadata, deriveLockEscrowPda} from './util'


let solConnection: Connection = null;
let program: Program<PumpMeteora> = null;
let payer: NodeWallet = null;
let provider: anchor.Provider = null;
let umi: Umi;

// Address of the deployed program.
let programId;

/**
 * Set cluster, provider, program
 * If rpc != null use rpc, otherwise use cluster param
 * @param cluster - cluster ex. mainnet-beta, devnet ...
 * @param keypair - wallet keypair
 * @param rpc - rpc
 */
export const setClusterConfig = async (
  cluster: web3.Cluster,
  keypair: string,
  rpc?: string
) => {
  if (!rpc) {
    solConnection = new web3.Connection(web3.clusterApiUrl(cluster));
  } else {
    solConnection = new web3.Connection(rpc);
  }

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypair, "utf-8"))),
    { skipValidation: true }
  );
  payer = new NodeWallet(walletKeypair);

  console.log("Wallet Address: ", payer.publicKey.toBase58());

  anchor.setProvider(
    new anchor.AnchorProvider(solConnection, payer, {
      skipPreflight: true,
      commitment: "confirmed",
    })
  );

  provider = anchor.getProvider();
  const rpcUrl = rpc ? rpc : web3.clusterApiUrl(cluster);
  umi = createUmi(rpcUrl).use(web3JsRpc(provider.connection));

  // Generate the program client from IDL.
  program = anchor.workspace.PumpMeteora as Program<PumpMeteora>;
  programId = program.programId.toBase58();
  console.log("ProgramId: ", program.programId.toBase58());
};

export const configProject = async () => {

  const teamWallet = new PublicKey("Br4NUsLoHRgAcxTBsDwgnejnjqMe5bkyio1YCrM3gWM2")
  const migrationWallet = new PublicKey("DQ8fi6tyN9MPD5bpSpUXxKd9FVRY2WcnoniVEgs6StEW");
  // Create a dummy config object to pass as argument.
  const newConfig = {
    authority: payer.publicKey,
    migrationAuthority: payer.publicKey,
    teamWallet: teamWallet,
    migrationWallet: migrationWallet,
    initBondingCurve: new BN(TEST_INIT_BONDING_CURVE),
    platformBuyFee: 0.69, // Example fee: 0.69%
    platformSellFee: 0.69, // Example fee: 0.69%
    platformMigrationFee: 0.69, //  Example fee: 0.69%
    lamportAmountConfig: {
      range: { min: new BN(15_000_000_000), max: new BN(20_000_000_000) },
    },
    tokenSupplyConfig: {
      range: { min: new BN(1_000_000_000), max: new BN(1_000_000_000) },
    },
    tokenDecimalsConfig: { range: { min: 6, max: 6 } },
    initialVirtualTokenReservesConfig: new BN(TEST_INITIAL_VIRTUAL_TOKEN_RESERVES),
    initialVirtualSolReservesConfig: new BN(TEST_INITIAL_VIRTUAL_SOL_RESERVES),
    initialRealTokenReservesConfig: new BN(TEST_INITIAL_REAL_TOKEN_RESERVES),
    initialMeteoraTokenReserves: new BN(TEST_INITIAL_METEORA_TOKEN_RESERVES),
    initialMeteoraSolAmount: new BN(TEST_INITIAL_METEORA_SOL_AMOUNT),

    curveLimit: new BN(62_000_000_000), //  Example limit: 42 SOL
    initialized: false,
  };

  const tx = await createConfigTx(
    payer.publicKey,
    newConfig,
    solConnection,
    program
  );

  await execTx(tx, solConnection, payer);
};

/* You need to contact the owner to check this function.*/