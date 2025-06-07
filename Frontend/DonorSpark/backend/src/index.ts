import TransactionTimer from "./services/transactionTimer";

const TRANSACTION_ID = "79F19165AAB1FAC1F0C2FC85D4F58BEC363063207379E22C74F1F74E8A87C064";
const CHECK_INTERVAL_MINUTES = 1; // Check every 1 minute

async function main() {
  console.log("🚀 Starting DonorSpark Backend Timer Service");
  console.log(`Monitoring transaction: ${TRANSACTION_ID}`);
  console.log(`Check interval: ${CHECK_INTERVAL_MINUTES} minute(s)`);
  console.log("=".repeat(50));

  // Create timer instance
  const timer = new TransactionTimer(TRANSACTION_ID);

  // Fetch and display initial transaction details
  try {
    console.log("Fetching initial transaction details...");
    const transactionDetails = await timer.getTransactionDetails();
    
    if (transactionDetails) {
      console.log("Transaction found successfully!");
      console.log("Transaction Type:", transactionDetails.TransactionType);
      console.log("Account:", transactionDetails.Account);
      
      if (transactionDetails.Memos && transactionDetails.Memos.length > 0) {
        console.log(`Found ${transactionDetails.Memos.length} memo(s) in transaction`);
      } else {
        console.log("⚠️  No memos found in this transaction");
      }
    } else {
      console.log("❌ Could not fetch transaction details");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }

  // Start the timer
  timer.startTimer(CHECK_INTERVAL_MINUTES);

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log("\n🛑 Shutting down gracefully...");
    timer.stopTimer();
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  console.log("✅ Timer service is now running. Press Ctrl+C to stop.");
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
}); 