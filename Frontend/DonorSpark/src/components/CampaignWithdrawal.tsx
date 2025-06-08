import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, CreditCard, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaignById } from '../services/campaigns';
import { Campaign } from '../types';
import { getCurrentUser, isOrganization } from '../services/auth';

export default function CampaignWithdrawal() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('dbs-3456');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sgdBalance, setSgdBalance] = useState(0);

  // Exchange rate RLUSD to SGD (simulated)
  const RLUSD_TO_SGD_RATE = 1.35;

  const linkedBanks = [
    { id: 'dbs-3456', name: 'DBS Ending in 3456', logo: '🏦' },
    { id: 'ocbc-7890', name: 'OCBC Ending in 7890', logo: '🏛️' },
    { id: 'uob-1234', name: 'UOB Ending in 1234', logo: '🏢' },
  ];

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        if (!campaignId) {
          setError('Campaign ID not provided');
          return;
        }

        const currentUser = getCurrentUser();
        if (!currentUser || !isOrganization()) {
          setError('Access denied. Only organizations can withdraw funds.');
          return;
        }

        const campaignData = await getCampaignById(campaignId);
        if (!campaignData) {
          setError('Campaign not found');
          return;
        }

        if (campaignData.organizationId !== currentUser.id) {
          setError('Access denied. You can only withdraw from your own campaigns.');
          return;
        }

        setCampaign(campaignData);
        setWithdrawalAmount(Number(campaignData.currentAmount || 0).toString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const handleWithdrawal = async () => {
    if (!campaign || !withdrawalAmount) {
      setError('Please enter a withdrawal amount');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (amount > Number(campaign.currentAmount || 0)) {
      setError('Withdrawal amount cannot exceed available funds');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Calculate SGD amount
      const sgdAmount = amount * RLUSD_TO_SGD_RATE;
      setSgdBalance(prev => prev + sgdAmount);
      
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getEstimatedSGD = () => {
    const amount = parseFloat(withdrawalAmount) || 0;
    return (amount * RLUSD_TO_SGD_RATE).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-campaigns')}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center"
        >
          <CheckCircle size={20} className="mr-2" />
          <span>Withdrawal Successful – SGD ${getEstimatedSGD()} will be credited to your bank within 1–2 business days.</span>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/my-campaigns')}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{campaign?.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Balance Display Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Available Balance</h2>
            
                         {/* RLUSD Balance */}
             <div className="mb-4">
               <div className="text-sm text-gray-600 mb-1">RLUSD</div>
               <div className="text-3xl font-bold text-gray-900">{Number(campaign?.currentAmount || 0).toFixed(2)}</div>
             </div>

            {/* Estimated SGD */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Estimated SGD after conversion</div>
                             <div className="text-xl font-semibold text-teal-600">~SGD ${(Number(campaign?.currentAmount || 0) * RLUSD_TO_SGD_RATE).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Rate: 1 RLUSD = {RLUSD_TO_SGD_RATE} SGD</div>
            </div>
          </div>
        </motion.div>

        {/* Withdrawal Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-medium text-gray-800 mb-6">Withdraw to Bank</h3>

          <div className="space-y-6">
            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Bank Account
              </label>
              <div className="relative">
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
                >
                  {linkedBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.logo} {bank.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Withdrawal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (RLUSD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter amount"
                                     max={Number(campaign?.currentAmount || 0)}
                  step="0.01"
                />
              </div>
                             <div className="flex justify-between text-sm text-gray-500 mt-2">
                 <span>Available: {Number(campaign?.currentAmount || 0).toFixed(2)} RLUSD</span>
                 <button
                   onClick={() => setWithdrawalAmount(Number(campaign?.currentAmount || 0).toString())}
                   className="text-teal-600 hover:text-teal-700 font-medium"
                 >
                   Max
                 </button>
               </div>
            </div>

            {/* Conversion Preview */}
            {withdrawalAmount && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">You will receive:</span>
                  <span className="text-lg font-semibold text-teal-700">SGD ${getEstimatedSGD()}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Withdraw Button */}
            <button
              onClick={handleWithdrawal}
              disabled={isProcessing || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
              className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing Withdrawal...
                </div>
              ) : (
                <div className="flex items-center">
                  <CreditCard size={20} className="mr-2" />
                  Withdraw to Bank
                </div>
              )}
            </button>

            {/* Alternative Option */}
            <div className="text-center">
              <span className="text-gray-500 text-sm">or</span>
            </div>
            
            <button
              onClick={() => navigate(`/offramp/${campaignId}`)}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Advanced Withdrawal Options
            </button>
          </div>
        </motion.div>

        {/* Current SGD Balance Display */}
        {sgdBalance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6"
          >
            <div className="text-center">
              <div className="text-sm text-green-600 mb-1">StraitsX SGD Balance</div>
              <div className="text-2xl font-bold text-green-700">SGD ${sgdBalance.toFixed(2)}</div>
              <div className="text-xs text-green-600 mt-1">Available for bank transfer</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 