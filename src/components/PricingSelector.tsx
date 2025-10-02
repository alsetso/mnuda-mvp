'use client';

import { useState } from 'react';

interface PricingOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface PricingSelectorProps {
  onSelect: (option: PricingOption) => void;
  selectedOption?: string;
  isLoading?: boolean;
}

const pricingOptions: PricingOption[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 10,
    description: 'Perfect for getting started',
    features: [
      'Core features included',
      'Standard support',
      'Basic analytics',
      'Email support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 100,
    description: 'Advanced features and priority support',
    features: [
      'All Basic features',
      'Advanced analytics',
      'Priority support',
      'Phone support',
      'Custom integrations',
      'Early access to new features'
    ],
    popular: true
  }
];

export default function PricingSelector({ onSelect, selectedOption }: PricingSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose your plan</h2>
        <p className="text-sm text-gray-600">Simple, flat pricing</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        {pricingOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`text-left p-4 rounded-md transition-colors ${
              selectedOption === option.id ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-gray-900">{option.name}</span>
                {option.popular && (
                  <span className="text-xs text-[#1dd1f5] font-medium">Popular</span>
                )}
              </div>
              <div className="text-gray-900">
                <span className="text-2xl font-bold">${option.price}</span>
                <span className="text-xs text-gray-600 ml-1">/mo</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gray-700">
        <p>
          MNUDA Premium is invite-only. Email
          {' '}
          <a
            href="mailto:support@mnuda.com?subject=MNUDA Premium Access Request"
            className="underline text-[#014463] hover:text-[#1dd1f5]"
          >
            support@mnuda.com
          </a>
          {' '}to get in touch.
        </p>
      </div>
    </div>
  );
}
