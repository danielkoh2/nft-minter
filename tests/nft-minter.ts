import * as anchor from '@coral-xyz/anchor';
import {ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import { Keypair, PublicKey,SystemProgram, SYSVAR_RENT_PUBKEY} from '@solana/web3.js';
import type { NftMinter } from '../target/types/nft_minter';

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

describe('NFT Minter', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.NftMinter as anchor.Program<NftMinter>;

  // The metadata for our NFT
  const metadata = {
    name: 'Daniel NFT',
    symbol: 'DNFT',
    uri: "https://github.com/danielkoh2/danielStaking/nft.json",
  };

  it('Create an NFT in Dev net!', async () => {
    // Generate a keypair to use as the address of our mint account
    const mintKeypair = new Keypair();

    // Derive Metadata PDA
    const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    // Derive Edition PDA
    const [editionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    // Derive the associated token address account for the mint and payer.
    const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        payer.publicKey,
    );

    const transactionSignature = await program.methods
        .mintNft(metadata.name, metadata.symbol, metadata.uri)
        .accounts({
          payer: payer.publicKey,
          metadataAccount: metadataPDA,
          editionAccount: editionPDA,
          mintAccount: mintKeypair.publicKey,
          associatedTokenAccount: associatedTokenAccountAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();

    console.log('Success!');
    console.log(`   Mint Address: ${mintKeypair.publicKey}`);
    console.log(`   Transaction Signature: ${transactionSignature}`);
  });
});