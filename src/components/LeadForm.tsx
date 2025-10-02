'use client';

import { useState } from 'react';
import Footer from '@/features/ui/components/Footer';

interface LeadFormProps {
  type: 'buy' | 'sell' | 'loan';
  title: string;
  subtitle: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  [key: string]: string;
}

export default function LeadForm({ type, title, subtitle }: LeadFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    ...(type === 'buy' && { budget: '', propertyType: '', timeline: '' }),
    ...(type === 'sell' && { address: '', propertyType: '', timeline: '' }),
    ...(type === 'loan' && { loanType: '', propertyValue: '', timeline: '' })
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/leads/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Thank you! We\'ll contact you soon about your Minnesota real estate needs.');
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          ...(type === 'buy' && { budget: '', propertyType: '', timeline: '' }),
          ...(type === 'sell' && { address: '', propertyType: '', timeline: '' }),
          ...(type === 'loan' && { loanType: '', propertyValue: '', timeline: '' })
        });
      } else {
        setMessage('Something went wrong. Please try again or contact us directly.');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Network error. Please check your connection and try again.');
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormFields = () => {
    switch (type) {
      case 'buy':
        return (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              >
                <option value="">Budget Range</option>
                <option value="under-200k">Under $200K</option>
                <option value="200k-300k">$200K - $300K</option>
                <option value="300k-500k">$300K - $500K</option>
                <option value="500k-750k">$500K - $750K</option>
                <option value="750k-1m">$750K - $1M</option>
                <option value="over-1m">Over $1M</option>
              </select>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              >
                <option value="">Property Type</option>
                <option value="single-family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi-family">Multi-Family</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <select
              name="timeline"
              value={formData.timeline}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
            >
              <option value="">Timeline</option>
              <option value="immediately">Immediately</option>
              <option value="1-3-months">1-3 Months</option>
              <option value="3-6-months">3-6 Months</option>
              <option value="6-12-months">6-12 Months</option>
              <option value="just-looking">Just Looking</option>
            </select>
          </>
        );
      case 'sell':
        return (
          <>
            <input
              type="text"
              name="address"
              placeholder="Property Address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              >
                <option value="">Property Type</option>
                <option value="single-family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi-family">Multi-Family</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
              <select
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              >
                <option value="">Timeline</option>
                <option value="immediately">Immediately</option>
                <option value="1-3-months">1-3 Months</option>
                <option value="3-6-months">3-6 Months</option>
                <option value="6-12-months">6-12 Months</option>
                <option value="just-exploring">Just Exploring</option>
              </select>
            </div>
          </>
        );
      case 'loan':
        return (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                name="loanType"
                value={formData.loanType}
                onChange={handleInputChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              >
                <option value="">Loan Type</option>
                <option value="purchase">Purchase</option>
                <option value="refinance">Refinance</option>
                <option value="cash-out-refinance">Cash-Out Refinance</option>
                <option value="heloc">HELOC</option>
              </select>
              <select
                name="propertyValue"
                value={formData.propertyValue}
                onChange={handleInputChange}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
              >
                <option value="">Property Value</option>
                <option value="under-200k">Under $200K</option>
                <option value="200k-300k">$200K - $300K</option>
                <option value="300k-500k">$300K - $500K</option>
                <option value="500k-750k">$500K - $750K</option>
                <option value="750k-1m">$750K - $1M</option>
                <option value="over-1m">Over $1M</option>
              </select>
            </div>
            <select
              name="timeline"
              value={formData.timeline}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
            >
              <option value="">Timeline</option>
              <option value="immediately">Immediately</option>
              <option value="1-3-months">1-3 Months</option>
              <option value="3-6-months">3-6 Months</option>
              <option value="6-12-months">6-12 Months</option>
              <option value="just-exploring">Just Exploring</option>
            </select>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#014463] to-[#1dd1f5] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl md:text-2xl opacity-90">{subtitle}</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1dd1f5] focus:border-transparent"
                />
              </div>

              {/* Type-specific fields */}
              <div className="space-y-4">
                {getFormFields()}
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  isSuccess 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1dd1f5] hover:bg-[#014463] text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Interest'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
