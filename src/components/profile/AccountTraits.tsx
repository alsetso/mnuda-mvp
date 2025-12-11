'use client';

import { AccountTrait } from '@/features/auth';

interface AccountTraitsProps {
  traits: AccountTrait[] | null | undefined;
  onTraitToggle?: (trait: AccountTrait) => void;
  editable?: boolean;
  className?: string;
  maxTraits?: number;
}

const ALL_TRAITS: AccountTrait[] = [
  'homeowner',
  'buyer',
  'investor',
  'realtor',
  'wholesaler',
  'lender',
  'title',
  'renter',
  'businessowner',
];

const TRAIT_LABELS: Record<AccountTrait, string> = {
  homeowner: 'Homeowner',
  buyer: 'Buyer',
  investor: 'Investor',
  realtor: 'Realtor',
  wholesaler: 'Wholesaler',
  lender: 'Lender',
  title: 'Title',
  renter: 'Renter',
  businessowner: 'Business Owner',
};

export default function AccountTraits({
  traits = [],
  onTraitToggle,
  editable = false,
  className = '',
  maxTraits,
}: AccountTraitsProps) {
  const selectedTraits = (traits || []) as AccountTrait[];
  const isAtLimit = maxTraits !== undefined && selectedTraits.length >= maxTraits;

  if (editable) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-xs font-medium text-gray-900 mb-1">
          Traits
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TRAITS.map((trait) => {
            const isSelected = selectedTraits.includes(trait);
            const isDisabled = !isSelected && isAtLimit;
            return (
              <button
                key={trait}
                type="button"
                onClick={() => !isDisabled && onTraitToggle?.(trait)}
                disabled={isDisabled}
                className={`
                  px-2 py-1 text-xs font-medium rounded-md transition-all duration-150
                  ${isSelected
                    ? 'bg-gold-100 text-gold-700 border border-gold-300'
                    : isDisabled
                    ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }
                `}
              >
                {TRAIT_LABELS[trait]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Display-only mode
  if (selectedTraits.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {selectedTraits.map((trait) => (
        <span
          key={trait}
          className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 border border-gray-200"
        >
          {TRAIT_LABELS[trait]}
        </span>
      ))}
    </div>
  );
}

