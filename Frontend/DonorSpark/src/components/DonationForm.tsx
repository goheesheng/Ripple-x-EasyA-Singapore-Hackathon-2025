import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CreditCard, Gift, Users } from 'lucide-react';

export default function DonationForm() {
  const [amount, setAmount] = useState('50');
  const [donationType, setDonationType] = useState('one-time');
  
  const presetAmounts = ['25', '50', '100', '250'];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md mx-auto"
    >
      <h3 className="text-2xl font-bold text-center mb-6">Make a Difference Today</h3>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-medium">Choose Donation Type</label>
        <div className="flex rounded-lg bg-gray-100 p-1">
          {[
            { id: 'one-time', label: 'One-time', icon: <Gift size={16} /> },
            { id: 'monthly', label: 'Monthly', icon: <Calendar size={16} /> }
          ].map(option => (
            <button
              key={option.id}
              className={`flex items-center justify-center flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                donationType === option.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setDonationType(option.id)}
            >
              {option.icon}
              <span className="ml-1">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-medium">Donation Amount</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {presetAmounts.map(preset => (
            <button
              key={preset}
              className={`py-2 rounded-md transition-all ${
                amount === preset
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setAmount(preset)}
            >
              ${preset}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="donation-input w-full py-3 pl-8 pr-3 rounded-md border border-gray-300 focus:outline-none"
            placeholder="Other amount"
          />
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-md transition-all flex items-center justify-center"
      >
        <CreditCard size={18} className="mr-2" />
        Donate ${amount} {donationType === 'monthly' ? 'Monthly' : 'Now'}
      </motion.button>
      
      <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center">
        <Users size={16} className="mr-1" />
        <span>Join 2,548 donors who have contributed this month</span>
      </div>
    </motion.div>
  );
}
