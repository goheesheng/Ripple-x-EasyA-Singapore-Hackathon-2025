import { Client } from "xrpl";
import { parseMemo } from "../utils/parseMemo";

export class TransactionTimer {
  private client: Client;
  private intervalId: NodeJS.Timeout | null = null;
  private transactionId: string;
  private targetUtcTime: Date | null = null;
  private isTimeHit: boolean = false;

  constructor(transactionId: string) {
    this.client = new Client("wss://s.altnet.rippletest.net:51233"); // Testnet
    this.transactionId = transactionId;
  }

  private async connectClient(): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
      console.log("Connected to XRPL testnet");
    }
  }

  private async disconnectClient(): Promise<void> {
    if (this.client.isConnected()) {
      await this.client.disconnect();
      console.log("Disconnected from XRPL testnet");
    }
  }

  private async fetchTransactionMemo(): Promise<any> {
    try {
      await this.connectClient();
      
      const response = await this.client.request({
        command: "tx",
        transaction: this.transactionId
      });

      if (response.result && response.result.Memos) {
        const parsedMemo = parseMemo(response.result.Memos);
        console.log("Parsed memo data:", parsedMemo);
        return parsedMemo;
      } else {
        console.log("No memos found in transaction:", this.transactionId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  }

  private parseUtcTimeFromMemo(memoData: any): Date | null {
    // Look for common UTC time field names in the memo, prioritizing end_date
    const timeFields = ['end_date', 'utcTime', 'targetTime', 'scheduledTime', 'executeAt', 'timestamp'];
    
    for (const field of timeFields) {
      if (memoData[field]) {
        try {
          const date = new Date(memoData[field]);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (error) {
          console.log(`Error parsing date from field ${field}:`, error);
        }
      }
    }

    // If no specific field found, check if there's a direct timestamp or date string
    if (typeof memoData === 'string') {
      try {
        const date = new Date(memoData);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        console.log("Error parsing memo data as date:", error);
      }
    }

    return null;
  }

  private async checkTimeCondition(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Checking transaction memo...`);
    
    const memoData = await this.fetchTransactionMemo();
    
    if (!memoData) {
      console.log("No memo data found, skipping time check");
      return;
    }

    // If we haven't parsed the target time yet, try to parse it
    if (!this.targetUtcTime) {
      this.targetUtcTime = this.parseUtcTimeFromMemo(memoData);
      
      if (this.targetUtcTime) {
        console.log(`Target UTC time found: ${this.targetUtcTime.toISOString()}`);
      } else {
        console.log("Could not parse UTC time from memo data");
        console.log("Memo data:", memoData);
        return;
      }
    }

    // Check if current UTC time has met or exceeded the target time
    const currentUtcTime = new Date();
    
    if (currentUtcTime >= this.targetUtcTime && !this.isTimeHit) {
      this.isTimeHit = true;
      console.log("🎯 TIME HIT! The UTC time condition has been met!");
      console.log(`Target time: ${this.targetUtcTime.toISOString()}`);
      console.log(`Current time: ${currentUtcTime.toISOString()}`);
      console.log(`Transaction ID: ${this.transactionId}`);
      
      // You can add additional logic here when the time is hit
      // For example, trigger other processes, send notifications, etc.
    } else if (!this.isTimeHit) {
      const timeRemaining = this.targetUtcTime.getTime() - currentUtcTime.getTime();
      console.log(`Time remaining: ${Math.max(0, Math.floor(timeRemaining / 1000))} seconds`);
    }
  }

  public startTimer(intervalMinutes: number = 1): void {
    console.log(`Starting timer to check transaction ${this.transactionId} every ${intervalMinutes} minute(s)`);
    
    // Run initial check
    this.checkTimeCondition();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkTimeCondition();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  }

  public stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Timer stopped");
    }
    this.disconnectClient();
  }

  public async getTransactionDetails(): Promise<any> {
    try {
      await this.connectClient();
      const response = await this.client.request({
        command: "tx",
        transaction: this.transactionId
      });
      return response.result;
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      return null;
    }
  }
}

export default TransactionTimer; 