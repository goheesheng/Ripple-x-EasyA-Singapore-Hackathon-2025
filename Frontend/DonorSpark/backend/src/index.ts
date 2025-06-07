import TransactionTimer from "./services/transactionTimer";
import { performSwap } from "./services/swapService";

const CHECK_INTERVAL_MINUTES = 1; // Check every 1 minute

async function main() {
  console.log("🚀 Starting DonorSpark Backend Timer Service");
  console.log("📊 Monitoring campaigns database for expired campaigns");
  console.log(`⏰ Check interval: ${CHECK_INTERVAL_MINUTES} minute(s)`);
  console.log("=".repeat(50));

  // Create timer instance
  const timer = new TransactionTimer();

  // Test database connection
  try {
    console.log("Testing database connection...");
    const isConnected = await timer.testDatabaseConnection();
    
    if (!isConnected) {
      console.log("❌ Database connection failed - exiting");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error during database connection test:", error);
    process.exit(1);
  }

  // Set up callback for when campaigns expire
  timer.onCampaignExpired = async (walletAddress: string, walletSeed: string) => {
    console.log("🔄 Campaign expired - initiating SGD to RLUSD swap...");
    try {
      await performSwap(walletAddress, walletSeed);
      console.log("✅ Swap completed successfully");
    } catch (error) {
      console.error("❌ Swap failed:", error);
    }
  };

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
  console.log("🔍 Watching for campaigns that reach their end_date...");
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