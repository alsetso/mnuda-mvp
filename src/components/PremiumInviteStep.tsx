'use client';

import { useState } from 'react';

interface PremiumInviteStepProps {
  selectedPlan: {
    id: string;
    name: string;
    price: number;
  };
  onBack: () => void;
  onComplete: () => void;
}

export default function PremiumInviteStep({ selectedPlan, onBack, onComplete }: PremiumInviteStepProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userTypes: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserTypeChange = (userType: string) => {
    setFormData(prev => ({
      ...prev,
      userTypes: prev.userTypes.includes(userType)
        ? prev.userTypes.filter(type => type !== userType)
        : [...prev.userTypes, userType]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: selectedPlan.name,
          planPrice: selectedPlan.price,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          userTypes: formData.userTypes
        }),
      });

      if (response.ok) {
        onComplete();
      } else {
        console.error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {selectedPlan.name} Access Request
        </h2>
        
        <div className="text-sm text-gray-600 mb-4">
          {selectedPlan.name} - ${selectedPlan.price}/month
        </div>

        <div className="text-sm text-gray-700 mb-6">
          MNUDA {selectedPlan.name} is invite-only. Fill out the form below and our team will get back to you.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
          />
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
          />
        </div>

        <div>
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a (select all that apply):
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Real Estate Agent',
              'Real Estate Investor',
              'Cash Buyer',
              'Property Seller',
              'Wholesaler',
              'House Flipper',
              'Property Manager',
              'Real Estate Broker',
              'Mortgage Broker',
              'Title Company',
              'Contractor',
              'Other'
            ].map((userType) => (
              <label key={userType} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.userTypes.includes(userType)}
                  onChange={() => handleUserTypeChange(userType)}
                  className="w-4 h-4 text-[#1dd1f5] border-gray-300 rounded focus:ring-[#1dd1f5] focus:ring-2"
                />
                <span className="text-sm text-gray-700">{userType}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-center space-x-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#1dd1f5] text-white text-sm rounded hover:bg-[#014463] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
