import mysql from 'mysql2/promise';

// Create MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'donorspark',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addMoreCampaigns() {
  try {
    console.log('🔍 Adding more sample campaigns to database...');
    
    const connection = await pool.getConnection();
    
    try {
      const campaigns = [
        {
          id: 'clean-water-singapore',
          title: 'Clean Water for All',
          description: 'Providing clean drinking water to rural communities in Southeast Asia',
          targetAmount: 50000,
          currentAmount: 35000,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'Health',
          organizationId: 'rLt7p9bm8pkKoUAYDksD8RG1R7PxbzMC6z',
          organizationName: 'Water for Life Foundation',
          organizationDescription: 'Dedicated to providing clean water access worldwide',
          organizationWebsite: 'https://waterforlife.org',
          image: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557',
          campaignWalletAddress: 'rDUwA8yoYYE2cnBkPEh2qDcRvLx8hybLh1',
        },
        {
          id: 'education-underprivileged',
          title: 'Education for Underprivileged Children',
          description: 'Building schools and providing educational materials for children in need',
          targetAmount: 75000,
          currentAmount: 45000,
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          category: 'Education',
          organizationId: 'rEducationFoundation123456789',
          organizationName: 'Bright Future Education',
          organizationDescription: 'Empowering through education',
          organizationWebsite: 'https://brightfuture.org',
          image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
          campaignWalletAddress: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
        },
        {
          id: 'wildlife-conservation',
          title: 'Wildlife Conservation',
          description: 'Protecting endangered species and their habitats',
          targetAmount: 100000,
          currentAmount: 60000,
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          category: 'Environment',
          organizationId: 'rWildlifeGuardians123456789',
          organizationName: 'Wildlife Guardians',
          organizationDescription: 'Saving wildlife, one species at a time',
          organizationWebsite: 'https://wildlifeguardians.org',
          image: 'https://images.unsplash.com/photo-1534567110353-1f46d0708b7c',
          campaignWalletAddress: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w',
        }
      ];

      for (const campaign of campaigns) {
        // Check if campaign already exists
        const [existing] = await connection.execute(
          'SELECT id FROM campaigns WHERE id = ?',
          [campaign.id]
        );
        
        if (existing.length > 0) {
          console.log(`📋 Campaign "${campaign.title}" already exists`);
          continue;
        }

        const mysqlEndDate = campaign.endDate.toISOString().slice(0, 19).replace('T', ' ');
        
        // Insert the campaign
        await connection.execute(`
          INSERT INTO campaigns (
            id, title, description, target_amount, current_amount, end_date, category,
            organization_id, organization_name, organization_description,
            organization_website, image_url, campaign_wallet_address, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          campaign.id,
          campaign.title,
          campaign.description,
          campaign.targetAmount,
          campaign.currentAmount,
          mysqlEndDate,
          campaign.category,
          campaign.organizationId,
          campaign.organizationName,
          campaign.organizationDescription,
          campaign.organizationWebsite,
          campaign.image,
          campaign.campaignWalletAddress,
          'active'
        ]);
        
        console.log(`✅ Added campaign: "${campaign.title}"`);
      }
      
      // Get final count
      const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM campaigns');
      console.log(`📊 Total campaigns in database: ${countResult[0].count}`);
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Error adding campaigns:', error);
  } finally {
    await pool.end();
  }
}

addMoreCampaigns(); 