import mysql from 'mysql2/promise';

export class TransactionTimer {
  private pool: mysql.Pool;
  private intervalId: NodeJS.Timeout | null = null;
  private isTimeHit: boolean = false;

  constructor() {
    // Create MySQL connection pool
    this.pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'donorspark',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  private async getCampaignsReachedEndDate(): Promise<any[]> {
    try {
      const connection = await this.pool.getConnection();
      try {
        const [rows] = await connection.execute(`
          SELECT 
            id, 
            title, 
            campaign_wallet_address, 
            end_date,
            status,
            DATE_FORMAT(end_date, '%Y-%m-%dT%H:%i:%s.000Z') as endDateISO
          FROM campaigns 
          WHERE end_date <= NOW() 
          AND status = 'active'
          AND campaign_wallet_address IS NOT NULL
          ORDER BY end_date ASC
        `);
        
        return rows as any[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error fetching campaigns from database:", error);
      return [];
    }
  }

  private async getWalletSeed(publicAddress: string): Promise<string | null> {
    try {
      const connection = await this.pool.getConnection();
      try {
        const [rows] = await connection.execute(
          'SELECT seed FROM wallets WHERE public_address = ?',
          [publicAddress]
        );
        
        const walletRows = rows as any[];
        if (walletRows.length > 0) {
          return walletRows[0].seed;
        }
        return null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error fetching wallet seed:", error);
      return null;
    }
  }

  private async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      try {
        await connection.execute(
          'UPDATE campaigns SET status = ? WHERE id = ?',
          [status, campaignId]
        );
        console.log(`✅ Campaign ${campaignId} status updated to: ${status}`);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error updating campaign status:", error);
    }
  }

  private async checkTimeCondition(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Checking campaigns that have reached end_date...`);
    
    const expiredCampaigns = await this.getCampaignsReachedEndDate();
    
    if (expiredCampaigns.length === 0) {
      console.log("No campaigns have reached their end_date yet");
      return;
    }

    console.log(`🎯 Found ${expiredCampaigns.length} campaign(s) that have reached their end_date!`);
    
    for (const campaign of expiredCampaigns) {
      console.log("=".repeat(50));
      console.log(`🎯 TIME HIT! Campaign has reached end_date!`);
      console.log(`Campaign ID: ${campaign.id}`);
      console.log(`Campaign Title: ${campaign.title}`);
      console.log(`End Date: ${campaign.endDateISO}`);
      console.log(`Current Time: ${new Date().toISOString()}`);
      console.log(`Campaign Wallet Address: ${campaign.campaign_wallet_address}`);
      
      // Get wallet seed for this campaign
      const walletSeed = await this.getWalletSeed(campaign.campaign_wallet_address);
      
      if (walletSeed) {
        console.log(`✅ Found wallet seed for campaign ${campaign.id}`);
        console.log(`Wallet Address: ${campaign.campaign_wallet_address}`);
        console.log(`Seed Length: ${walletSeed.length} characters`);
        
        // Here you can trigger the swap functionality
        // For now, we'll just log the information needed for the swap
        console.log("🔄 Ready to perform SGD to RLUSD swap:");
        console.log(`- Source Wallet: ${campaign.campaign_wallet_address}`);
        console.log(`- Wallet Seed: ${walletSeed.substring(0, 10)}...`);
        console.log(`- Destination: rh6UCKiPqqpSnSGfWz1wA9ZSu9j5FFLGVN`);
        
        // Update campaign status to completed
        await this.updateCampaignStatus(campaign.id, 'completed');
        
        // Return the wallet information for external use
        this.onCampaignExpired?.(campaign.campaign_wallet_address, walletSeed);
        
      } else {
        console.log(`❌ No wallet seed found for campaign ${campaign.id} with address ${campaign.campaign_wallet_address}`);
      }
    }
  }

  // Callback function that can be set externally to handle expired campaigns
  public onCampaignExpired?: (walletAddress: string, walletSeed: string) => void;

  public startTimer(intervalMinutes: number = 1): void {
    console.log(`Starting timer to check campaigns every ${intervalMinutes} minute(s)`);
    
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
    this.pool.end();
  }

  public async testDatabaseConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      try {
        await connection.execute('SELECT 1');
        console.log("✅ Database connection successful");
        return true;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  }
}

export default TransactionTimer; 