'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Logo from '@/features/ui/components/Logo';
import { ProfileType, useAuth } from '@/features/auth';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

const PROFILE_TYPE_DATA: Record<ProfileType, {
  label: string;
  description: string;
  valueProposition: string;
  benefits: string[];
  cta: string;
}> = {
  homeowner: {
    label: 'Homeowner',
    description: 'A fast, fair solution for your property problem.',
    valueProposition: 'Get the help you need for your property—fast, fair, and reliable.',
    benefits: [
      'Post properties For Sale or FSBO directly on the map',
      'Request work services: roofing, plumbing, electrical, HVAC, carpentry, painting, and more',
      'Find labor, handyman, cleanup, snow removal, lawn care, and moving services',
      'Report neighborhood concerns: suspicious activity, break-ins, fires, floods, unsafe conditions, and more',
      'Track property issues and connect with contractors who can help',
    ],
    cta: 'Get Started as a Homeowner',
  },
  renter: {
    label: 'Renter',
    description: 'A safer, cleaner, better neighborhood to live in.',
    valueProposition: 'Help make your neighborhood safer, cleaner, and better for everyone.',
    benefits: [
      'Request seasonal services: snow removal, lawn care, and plowing',
      'Find moving services when you need to relocate',
      'Report neighborhood concerns: suspicious activity, break-ins, fires, floods, unsafe conditions',
      'Flag issues like abandoned cars, yard problems, potholes, trash, water issues, and animal concerns',
      'Connect with neighbors and property managers to address violations',
    ],
    cta: 'Join as a Renter',
  },
  investor: {
    label: 'Investor',
    description: 'Consistent access to profitable deals.',
    valueProposition: 'Find profitable real estate deals and investment opportunities in Minnesota.',
    benefits: [
      'Discover properties: For Sale, Land, Pocket Listings, Coming Soon, Leads, Distressed, Vacant, Abandoned',
      'Access deal types: Pre-Foreclosure, Auction, Tax-Delinquent, Contract, JV, and Parcel opportunities',
      'Track renovation and flip projects in progress',
      'Request work services: labor, handyman, cleanup, and roofing',
      'Monitor completed projects to identify investment opportunities',
    ],
    cta: 'Start Investing',
  },
  realtor: {
    label: 'Realtor',
    description: 'More listings, more clients, and faster closings.',
    valueProposition: 'Grow your real estate business with more listings, qualified clients, and faster closings.',
    benefits: [
      'Post properties For Sale, For Rent, and Land listings on the map',
      'Create Pocket Listings visible only to investors and wholesalers',
      'Mark Coming Soon properties to build anticipation',
      'Access Land opportunities for your developer and investor clients',
      'Connect with motivated buyers and sellers in your market area',
    ],
    cta: 'Join as a Realtor',
  },
  wholesaler: {
    label: 'Wholesaler',
    description: 'Buyers who will reliably take your deals.',
    valueProposition: 'Find reliable buyers who will consistently take your wholesale deals.',
    benefits: [
      'Post wholesale deals: For Sale, Pocket Listings, Leads, Distressed, Vacant, Abandoned properties',
      'Mark Contract and Assignment opportunities for investors',
      'Access Pre-Foreclosure, Auction, and Tax-Delinquent properties',
      'Connect directly with active investors looking for deals',
      'Build your network of reliable deal-takers in Minnesota',
    ],
    cta: 'Start Wholesaling',
  },
  contractor: {
    label: 'Contractor',
    description: 'High-quality jobs you can start immediately.',
    valueProposition: 'Get access to high-quality jobs and projects you can start right away.',
    benefits: [
      'Post project pins: New Roof, Renovation, Foundation, Addition, Build, Demo, and Completed projects',
      'Mark Distressed and Abandoned properties needing work',
      'Flag Unsafe conditions that need contractor attention',
      'Post business pins: HQ, Yard, Hiring, Equipment, and Subcontract opportunities',
      'Track Permit opportunities for new projects',
      'Connect with homeowners, investors, developers, and property managers',
    ],
    cta: 'Join as a Contractor',
  },
  services: {
    label: 'Services',
    description: 'A steady stream of customers who need your specialized services.',
    valueProposition: 'Get a steady stream of customers who need your specialized services.',
    benefits: [
      'Post Service and Cleaning work opportunities on the map',
      'Mark your business HQ location for visibility',
      'Post Hiring opportunities to find qualified staff',
      'Connect with homeowners, investors, property managers, and organizations',
      'Build your local service business through the platform',
    ],
    cta: 'Join as a Service Provider',
  },
  developer: {
    label: 'Developer',
    description: 'Land, projects, and partners for big builds or redevelopment.',
    valueProposition: 'Find land, projects, and partners for your development and redevelopment projects.',
    benefits: [
      'Post properties: For Sale, Land, Coming Soon, Leads, Distressed, Vacant, Abandoned, JV, and Parcel opportunities',
      'Track development projects: New Roof, Renovation, Flip, Foundation, Addition, Build, Demo, and Completed',
      'Access opportunity pins: Rezoning, Environmental, Development, and CityProject information',
      'Connect with investors for joint ventures and funding',
      'Find contractors and service providers for your projects',
    ],
    cta: 'Start Developing',
  },
  property_manager: {
    label: 'Property Manager',
    description: 'Reliable tenants and fast solutions to property issues.',
    valueProposition: 'Find reliable tenants and fast solutions to keep your properties running smoothly.',
    benefits: [
      'Post properties For Rent and mark Vacant units on the map',
      'Request work services: labor, handyman, snow, lawn, cleanup, plow, roof, plumbing, electrical, HVAC, carpentry, and painting',
      'Report property concerns: suspicious activity, fires, floods, abandoned cars, and violations',
      'Connect with contractors and service providers for maintenance',
      'Track property issues and coordinate repairs efficiently',
    ],
    cta: 'Join as a Property Manager',
  },
  organization: {
    label: 'Organization',
    description: 'Local exposure and new customers.',
    valueProposition: 'Get local exposure and connect with new customers in your area.',
    benefits: [
      'Post properties: For Sale, For Rent, Land, Distressed, and Auction opportunities',
      'Request all work services: labor, handyman, snow, lawn, cleanup, moving, plow, roof, plumbing, electrical, HVAC, carpentry, painting, service, contractor, roofing, and cleaning',
      'Track projects: New Roof, Renovation, and Build opportunities',
      'Post business pins: HQ, Yard, Hiring, Equipment, Warehouse, Adjuster, and Subcontract',
      'Access opportunities: Rezoning, Environmental, Development, CityProject, and Permit information',
      'Report suspicious activity and connect with the real estate community',
    ],
    cta: 'Join as an Organization',
  },
};

export default function LandingPage() {
  const params = useParams();
  const router = useRouter();
  const type = params?.type as ProfileType | undefined;
  const { user, signInWithOtp, verifyOtp, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/onboarding');
    }
  }, [authLoading, user, router]);

  if (!type || !PROFILE_TYPE_DATA[type]) {
    return (
      <PageLayout showHeader={true} showFooter={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8">This landing page doesn't exist.</p>
            <Link href="/" className="text-gold-600 hover:text-gold-700 underline">
              Return to Home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const data = PROFILE_TYPE_DATA[type];

  const isValidEmail = (email: string): boolean => {
    if (!email || !email.includes('@')) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError('');
    setMessage('');
  };

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setEmailError('Email address is required');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');
    setEmailError('');

    try {
      await signInWithOtp(email.trim().toLowerCase());
      setOtpSent(true);
      setMessage('Check your email for the 6-digit code!');
    } catch (error: unknown) {
      console.error('OTP error:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to send code'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await verifyOtp(email.trim().toLowerCase(), otp, 'email');
      setMessage('Verification successful! Redirecting...');
      // Redirect will happen via useEffect when user is set
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Invalid code');
      setLoading(false);
    }
  };

  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="full" backgroundColor="bg-gold-100" contentPadding="">
      <section className="min-h-screen bg-gradient-to-b from-gold-100 via-white to-gold-50 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
              <Logo size="lg" variant="default" />
            </Link>
            <div className="inline-block mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-gold-600 bg-gold-200/50 px-4 py-2 rounded-full">
                For {data.label}s
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black mb-4 leading-tight">
              {data.valueProposition}
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              {data.description}
            </p>
          </div>

          {/* Sales Letter */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 mb-12 border border-gold-200">
            <div className="prose prose-lg max-w-none">
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-xl font-semibold text-black">
                  Are you a {data.label.toLowerCase()} in Minnesota looking for better solutions?
                </p>

                <p>
                  You're in the right place. MNUDA is Minnesota's interactive map platform that connects {data.label.toLowerCase()}s 
                  like you with the resources, opportunities, and professionals you need to succeed.
                </p>

                <p>
                  Our map-based platform lets you post pins, discover opportunities, request services, and report concerns 
                  directly on an interactive map of Minnesota. Whether you're dealing with property problems, looking for 
                  investment opportunities, seeking new clients, or building your network—everything happens on the map.
                </p>

                <div className="bg-gold-50 border-l-4 border-gold-500 p-6 my-8">
                  <p className="text-lg font-semibold text-black mb-2">
                    What You Get:
                  </p>
                  <ul className="space-y-3 mt-4">
                    {data.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckIcon className="w-6 h-6 text-gold-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p>
                  Join hundreds of {data.label.toLowerCase()}s, investors, contractors, and real estate professionals 
                  who are already using MNUDA to grow their business, find opportunities, and solve problems.
                </p>

                <p className="text-lg font-semibold text-black">
                  Ready to get started? It only takes a minute to create your account and start connecting.
                </p>
              </div>
            </div>
          </div>

          {/* OTP Signup Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-12 border border-gold-200">
            <h3 className="text-2xl font-black text-black mb-2 text-center">
              Get Started Now
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Sign up with just your email - no password needed
            </p>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {message && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    message.includes('Check your email') 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {message}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm ${
                      emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-xl text-base font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {message && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    message.includes('successful') || message.includes('Redirecting')
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {message}
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none block w-full px-4 py-4 border-2 border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-base text-center text-3xl tracking-widest font-mono text-gray-900"
                    placeholder="000000"
                  />
                  <p className="mt-3 text-sm text-gray-600 text-center">
                    Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{email}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-xl text-base font-bold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setMessage('');
                      setEmailError('');
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Alternative CTA */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-black text-gold-600 mb-2">100+</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div>
                <div className="text-3xl font-black text-gold-600 mb-2">24/7</div>
                <div className="text-gray-600">Platform Access</div>
              </div>
              <div>
                <div className="text-3xl font-black text-gold-600 mb-2">MN</div>
                <div className="text-gray-600">Minnesota Focused</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

