import { Client, Payment, Wallet, TrustSet } from 'xrpl';

const TESTNET_JSON_RPC = "wss://s.altnet.rippletest.net:51233";
const SGD_ISSUER = "rh6UCKiPqqpSnSGfWz1wA9ZSu9j5FFLGVN";
const RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";
const RLUSD_HEX = "524C555344000000000000000000000000000000"; // RLUSD in hex
const DESTINATION_ADDRESS = "rh6UCKiPqqpSnSGfWz1wA9ZSu9j5FFLGVN";

async function checkTrustLine(client: Client, walletAddress: string, currency: string, issuer: string): Promise<boolean> {
  try {
    const response = await client.request({
      command: 'account_lines',
      account: walletAddress,
      ledger_index: 'validated'
    });

    const trustLines = response.result.lines || [];
    const hasTrustLine = trustLines.some((line: any) => 
      line.currency === currency && line.account === issuer
    );

    console.log(`🔍 Trust line check for ${currency} (${issuer}): ${hasTrustLine ? '✅ EXISTS' : '❌ MISSING'}`);
    return hasTrustLine;
  } catch (error) {
    console.error(`Error checking trust line for ${currency}:`, error);
    return false;
  }
}

async function establishTrustLine(client: Client, wallet: Wallet, currency: string, issuer: string, limit: string = "1000000"): Promise<boolean> {
  try {
    console.log(`🔗 Establishing trust line for ${currency} with issuer ${issuer}...`);
    
    const trustSet: TrustSet = {
      TransactionType: "TrustSet",
      Account: wallet.address,
      LimitAmount: {
        currency: currency,
        issuer: issuer,
        value: limit
      }
    };

    console.log("📤 Submitting TrustSet transaction...");
    const response = await client.submitAndWait(trustSet, { wallet });
    
    if (response.result.meta && typeof response.result.meta === 'object' && 'TransactionResult' in response.result.meta) {
      const transactionResult = response.result.meta.TransactionResult;
      
      if (transactionResult === 'tesSUCCESS') {
        console.log(`✅ Trust line established for ${currency}`);
        console.log(`Transaction Hash: ${response.result.hash}`);
        return true;
      } else {
        console.log(`❌ Trust line establishment failed: ${transactionResult}`);
        return false;
      }
    } else {
      console.log("⚠️  Trust line transaction result unclear");
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to establish trust line for ${currency}:`, error);
    return false;
  }
}

async function ensureTrustLines(client: Client, wallet: Wallet): Promise<boolean> {
  console.log("🔍 Checking and establishing required trust lines...");
  
  // Check SGD trust line
  const hasSGDTrustLine = await checkTrustLine(client, wallet.address, "SGD", SGD_ISSUER);
  
  // Check RLUSD trust line
  const hasRLUSDTrustLine = await checkTrustLine(client, wallet.address, "RLUSD", RLUSD_ISSUER);
  
  let allTrustLinesReady = true;
  
  // Establish SGD trust line if missing
  if (!hasSGDTrustLine) {
    console.log("🔗 SGD trust line missing, establishing...");
    const sgdSuccess = await establishTrustLine(client, wallet, "SGD", SGD_ISSUER);
    if (!sgdSuccess) {
      console.log("❌ Failed to establish SGD trust line");
      allTrustLinesReady = false;
    }
  }
  
  // Establish RLUSD trust line if missing
  if (!hasRLUSDTrustLine) {
    console.log("🔗 RLUSD trust line missing, establishing...");
    const rlusdSuccess = await establishTrustLine(client, wallet, "RLUSD", RLUSD_ISSUER);
    if (!rlusdSuccess) {
      console.log("❌ Failed to establish RLUSD trust line");
      allTrustLinesReady = false;
    }
  }
  
  if (allTrustLinesReady) {
    console.log("✅ All required trust lines are ready");
  } else {
    console.log("❌ Some trust lines could not be established");
  }
  
  return allTrustLinesReady;
}

export async function performSwap(walletAddress: string, walletSeed: string): Promise<void> {
  console.log("🔄 Starting SGD to RLUSD swap...");
  console.log(`Source Wallet: ${walletAddress}`);
  console.log(`Destination: ${DESTINATION_ADDRESS}`);
  
  const client = new Client(TESTNET_JSON_RPC);
  
  try {
    await client.connect();
    console.log("✅ Connected to XRPL testnet");

    // Create wallet from seed
    const wallet = Wallet.fromSeed(walletSeed);
    console.log(`✅ Wallet loaded: ${wallet.address}`);
    
    // Verify wallet address matches
    if (wallet.address !== walletAddress) {
      throw new Error(`Wallet address mismatch: expected ${walletAddress}, got ${wallet.address}`);
    }

    // Check wallet balance before swap
    try {
      const accountInfo = await client.request({
        command: 'account_info',
        account: wallet.address
      });
      console.log(`💰 Wallet XRP balance: ${accountInfo.result.account_data.Balance} drops`);
      
      // Check if wallet has enough XRP for trust line transactions (if needed)
      const xrpBalance = parseInt(accountInfo.result.account_data.Balance);
      const minimumXRP = 20000000; // 20 XRP in drops (reserve + transaction fees)
      
      if (xrpBalance < minimumXRP) {
        console.log(`⚠️  Warning: Low XRP balance (${xrpBalance} drops). May not be sufficient for trust lines and swap.`);
      }
    } catch (error) {
      console.log("⚠️  Could not fetch wallet balance:", error);
    }

    // STEP 1: Ensure trust lines are established
    console.log("\n🔗 STEP 1: Ensuring trust lines are established...");
    const trustLinesReady = await ensureTrustLines(client, wallet);
    
    if (!trustLinesReady) {
      throw new Error("Failed to establish required trust lines. Cannot proceed with swap.");
    }

    // STEP 2: Check token balances
    console.log("\n💰 STEP 2: Checking token balances...");
    try {
      const balanceResponse = await client.request({
        command: 'account_lines',
        account: wallet.address,
        ledger_index: 'validated'
      });

      const lines = balanceResponse.result.lines || [];
      const sgdLine = lines.find((line: any) => line.currency === 'SGD' && line.account === SGD_ISSUER);
      const rlusdLine = lines.find((line: any) => line.currency === 'RLUSD' && line.account === RLUSD_ISSUER);

      console.log(`SGD Balance: ${sgdLine ? sgdLine.balance : '0'} SGD`);
      console.log(`RLUSD Balance: ${rlusdLine ? rlusdLine.balance : '0'} RLUSD`);

      if (!sgdLine || parseFloat(sgdLine.balance) < 0.11) {
        console.log("⚠️  Warning: Insufficient SGD balance for swap");
      }
    } catch (error) {
      console.log("⚠️  Could not fetch token balances:", error);
    }

    // STEP 3: Perform the swap
    console.log("\n🔄 STEP 3: Performing SGD to RLUSD swap...");
    
    // Prepare the payment transaction for SGD to RLUSD swap
    const payment: Payment = {
      TransactionType: "Payment",
      Account: wallet.address,
      Amount: {
        currency: RLUSD_HEX,
        issuer: RLUSD_ISSUER,
        value: "0.1" // Amount of RLUSD to receive
      },
      Destination: DESTINATION_ADDRESS,
      SendMax: {
        currency: "SGD",
        issuer: SGD_ISSUER,
        value: "0.11" // Allow up to 0.11 SGD to be spent (slippage buffer)
      }
    };

    console.log("📤 Submitting swap transaction...");
    console.log("Transaction details:", JSON.stringify(payment, null, 2));

    // Submit the payment
    const response = await client.submitAndWait(payment, { wallet });
    
    if (response.result.meta && typeof response.result.meta === 'object' && 'TransactionResult' in response.result.meta) {
      const transactionResult = response.result.meta.TransactionResult;
      
      if (transactionResult === 'tesSUCCESS') {
        console.log("✅ Swap transaction successful!");
        console.log(`Transaction Hash: ${response.result.hash}`);
        console.log(`View on explorer: https://testnet.xrpl.org/transactions/${response.result.hash}`);
        
        // Log transaction details
        if (response.result.meta && 'AffectedNodes' in response.result.meta) {
          console.log("📊 Transaction affected nodes:", response.result.meta.AffectedNodes?.length || 0);
        }
      } else {
        console.log(`❌ Transaction failed with result: ${transactionResult}`);
        throw new Error(`Transaction failed: ${transactionResult}`);
      }
    } else {
      console.log("⚠️  Transaction result unclear");
      console.log("Response:", JSON.stringify(response.result, null, 2));
    }

  } catch (error) {
    console.error("❌ Swap failed:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('tecUNFUNDED_PAYMENT')) {
        console.log("💡 Hint: The wallet may not have sufficient SGD balance");
      } else if (error.message.includes('tecNO_LINE')) {
        console.log("💡 Hint: Trust lines may not be properly established");
      } else if (error.message.includes('tecPATH_DRY')) {
        console.log("💡 Hint: No liquidity path found for this swap");
      } else if (error.message.includes('tecINSUF_RESERVE_LINE')) {
        console.log("💡 Hint: Insufficient XRP reserve for trust line");
      }
    }
    
    throw error;
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
      console.log("🔌 Disconnected from XRPL testnet");
    }
  }
}

export default { performSwap }; 