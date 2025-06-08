import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Wallet, DollarSign, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaignById } from '../services/campaigns';
import { Campaign } from '../types';
import { getCurrentUser, isOrganization } from '../services/auth';

export default function OfframpPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [rlusdAmount, setRlusdAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [sgdAmount, setSgdAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Exchange rates (simulated)
  const RLUSD_TO_USDT_RATE = 0.998; // Slight spread
  const USDT_TO_SGD_RATE = 1.35; // Approximate SGD rate

  const banks = [
    { id: 'dbs', name: 'DBS Bank', logo: '🏦' },
    { id: 'ocbc', name: 'OCBC Bank', logo: '🏛️' },
    { id: 'uob', name: 'UOB Bank', logo: '🏢' },
    { id: 'posb', name: 'POSB', logo: '📮' },
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
          setError('Access denied. Only organizations can access offramp.');
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
        setRlusdAmount(campaignData.currentAmount.toString());
        setUsdtAmount((campaignData.currentAmount * RLUSD_TO_USDT_RATE).toFixed(2));
        setSgdAmount((campaignData.currentAmount * RLUSD_TO_USDT_RATE * USDT_TO_SGD_RATE).toFixed(2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const handleAmountChange = (value: string) => {
    setRlusdAmount(value);
    const numValue = parseFloat(value) || 0;
    setUsdtAmount((numValue * RLUSD_TO_USDT_RATE).toFixed(2));
    setSgdAmount((numValue * RLUSD_TO_USDT_RATE * USDT_TO_SGD_RATE).toFixed(2));
  };

  const handleConfirmWithdrawal = async () => {
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-campaigns')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Withdrawal Successful!</h1>
              <p className="text-gray-600 mb-6">
                Your funds have been successfully converted and will be transferred to your bank account within 1-2 business days.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount Withdrawn:</span>
                    <div className="font-semibold">{rlusdAmount} RLUSD</div>
                  </div>
                  <div>
                    <span className="text-gray-600">SGD Amount:</span>
                    <div className="font-semibold">S${sgdAmount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Bank:</span>
                    <div className="font-semibold">{banks.find(b => b.id === selectedBank)?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Account:</span>
                    <div className="font-semibold">***{accountNumber.slice(-4)}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/my-campaigns')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Back to My Campaigns
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(`/withdraw/${campaignId}`)}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Withdrawal
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 text-sm">Convert RLUSD</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className={`flex items-center ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 text-sm">Bank Details</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className={`flex items-center ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 text-sm">Confirm</span>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">Campaign Fund Offramp</h1>
              <p className="text-indigo-100">Convert your RLUSD to SGD and withdraw to your bank account</p>
            </div>

            {/* Campaign Info */}
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-lg font-semibold mb-2">{campaign?.title}</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Available Balance:</span>
                  <div className="font-semibold text-green-600">{campaign?.currentAmount} RLUSD</div>
                </div>
                <div>
                  <span className="text-gray-600">Campaign Wallet:</span>
                  <div className="font-mono text-xs">{campaign?.campaignWalletAddress}</div>
                </div>
                <div>
                  <span className="text-gray-600">Organization:</span>
                  <div className="font-semibold">{campaign?.organizationName}</div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Step 1: Convert RLUSD to USDT</h3>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center text-blue-800">
                      <Wallet size={20} className="mr-2" />
                      <span className="font-medium">RLUSD Balance: {campaign?.currentAmount} RLUSD</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* RLUSD Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">From (RLUSD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rlusdAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                          max={campaign?.currentAmount}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          RLUSD
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                      <ArrowRight size={24} className="text-gray-400" />
                    </div>

                    {/* USDT Output */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">To (USDT)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={usdtAmount}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          USDT
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center text-yellow-800">
                      <AlertTriangle size={20} className="mr-2" />
                      <div>
                        <p className="font-medium">Exchange Rate: 1 RLUSD = {RLUSD_TO_USDT_RATE} USDT</p>
                        <p className="text-sm">Rate includes a 0.2% conversion fee</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!rlusdAmount || parseFloat(rlusdAmount) <= 0}
                    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Bank Details
                  </button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Step 2: Bank Withdrawal Details</h3>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center text-green-800">
                      <DollarSign size={20} className="mr-2" />
                      <span className="font-medium">SGD Amount: S${sgdAmount} (Rate: 1 USDT = {USDT_TO_SGD_RATE} SGD)</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                      <div className="grid grid-cols-2 gap-3">
                        {banks.map((bank) => (
                          <button
                            key={bank.id}
                            onClick={() => setSelectedBank(bank.id)}
                            className={`p-4 border rounded-lg text-left transition-colors ${
                              selectedBank === bank.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{bank.logo}</span>
                              <span className="font-medium">{bank.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your account number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter account holder name"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      disabled={!selectedBank || !accountNumber || !accountName}
                      className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Review & Confirm
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Step 3: Confirm Withdrawal</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Transaction Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">RLUSD Amount:</span>
                        <span className="font-semibold">{rlusdAmount} RLUSD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Convert to USDT:</span>
                        <span className="font-semibold">{usdtAmount} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SGD Amount:</span>
                        <span className="font-semibold">S${sgdAmount}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-semibold">{banks.find(b => b.id === selectedBank)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account:</span>
                        <span className="font-semibold">{accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="font-semibold">{accountName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start text-red-800">
                      <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Important Notice:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>This transaction cannot be reversed once confirmed</li>
                          <li>Funds will be transferred within 1-2 business days</li>
                          <li>Please ensure your bank details are correct</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmWithdrawal}
                      disabled={isProcessing}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CreditCard size={20} className="mr-2" />
                          Confirm Withdrawal
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 