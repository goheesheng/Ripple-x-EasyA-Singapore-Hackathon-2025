import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, DollarSign, Users } from 'lucide-react';
import DonationModal from './DonationModal';

interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  category: string;
  organization: {
    name: string;
    logo?: string;
  };
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  useEffect(() => {
    // TODO: Fetch campaigns from your backend
    // For now, using mock data
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        title: 'Education for All',
        description: 'Supporting schools and educational programs in underserved communities.',
        targetAmount: 50000,
        currentAmount: 25000,
        endDate: '2024-12-31',
        category: 'Education',
        organization: {
          name: 'Global Education Fund',
          logo: 'https://images.unsplash.com/photo-1511949860663-92c5c57d48a7?auto=format&fit=crop&q=80&w=600&h=400'
        }
      },
      {
        id: '2',
        title: 'Clean Water Initiative',
        description: 'Providing access to clean water through sustainable infrastructure projects.',
        targetAmount: 75000,
        currentAmount: 35000,
        endDate: '2024-11-30',
        category: 'Environment',
        organization: {
          name: 'Water for Life',
          logo: 'https://images.unsplash.com/photo-1581331474067-505cf18bfadb?auto=format&fit=crop&q=80&w=600&h=400'
        }
      }
    ];

    setCampaigns(mockCampaigns);
    setLoading(false);
  }, []);

  const handleDonateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationModalOpen(true);
  };

  const handleDonationModalClose = () => {
    setIsDonationModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleDonationSuccess = (amount: number) => {
    if (selectedCampaign) {
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(campaign =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                currentAmount: campaign.currentAmount + amount
              }
            : campaign
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Active Campaigns</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="relative h-48">
              <img
                src={campaign.organization.logo}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                {campaign.category}
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-gray-800">{campaign.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{campaign.organization.name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((campaign.currentAmount / campaign.targetAmount) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(campaign.currentAmount / campaign.targetAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-gray-600">
                  <span className="text-indigo-600 font-bold">${campaign.currentAmount.toLocaleString()}</span>
                  <span className="text-sm"> raised of ${campaign.targetAmount.toLocaleString()}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
                  onClick={() => handleDonateClick(campaign)}
                >
                  Donate
                  <ArrowRight className="ml-2 w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedCampaign && (
        <DonationModal
          isOpen={isDonationModalOpen}
          onClose={handleDonationModalClose}
          campaign={selectedCampaign}
          onDonationSuccess={handleDonationSuccess}
        />
      )}
    </div>
  );
} 