'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, MemberService, Member, MemberType } from '@/features/auth';
import ProfilePhoto from '@/components/ProfilePhoto';
import MainContentNav from '@/components/MainContentNav';
import { PencilIcon, XMarkIcon, CheckIcon, ExclamationCircleIcon, ChevronDownIcon, ChevronUpIcon, UserIcon, BriefcaseIcon, MapPinIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import LocationAutocomplete, { LocationSuggestion } from '@/features/ui/components/LocationAutocomplete';

type EditSection = 'basic' | 'professional' | 'location' | null;

const MEMBER_TYPE_OPTIONS: { value: MemberType; label: string }[] = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'investor', label: 'Investor' },
  { value: 'agent', label: 'Agent' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'lender', label: 'Lender' },
  { value: 'advisor', label: 'Advisor' },
];

const MEMBER_SUBTYPE_EXAMPLES: Record<MemberType, string[]> = {
  homeowner: [],
  investor: ['flipper', 'buy_and_hold', 'wholesaler', 'private_money'],
  agent: ['buyers_agent', 'listing_agent', 'broker'],
  contractor: ['roofer', 'plumber', 'gc', 'electrician', 'hvac'],
  lender: ['residential', 'commercial', 'private'],
  advisor: ['attorney', 'title', 'architect', 'inspector', 'planner'],
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [completionExpanded, setCompletionExpanded] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    job_title: '',
    bio: '',
    website: '',
    linkedin_url: '',
    phone: '',
    city: '',
    zip_code: '',
    primary_market_area: '',
    market_radius: 25,
    member_type: 'homeowner' as MemberType,
    member_subtype: '',
  });

  // Calculate completion percentage
  const getCompletionStatus = () => {
    if (!member) return { percentage: 0, missing: [] };

    const requiredFields = [
      { key: 'name', label: 'Name', value: member.name },
      { key: 'member_type', label: 'Member Type', value: member.member_type },
    ];

    const recommendedFields = [
      { key: 'company', label: 'Company', value: member.company },
      { key: 'job_title', label: 'Job Title', value: member.job_title },
      { key: 'phone', label: 'Phone', value: member.phone },
      { key: 'city', label: 'City', value: member.city },
      { key: 'primary_market_area', label: 'Primary Market Area', value: member.primary_market_area },
      { key: 'bio', label: 'Bio', value: member.bio },
    ];

    const allFields = [...requiredFields, ...recommendedFields];
    const completed = allFields.filter(f => f.value && String(f.value).trim() !== '').length;
    const missing = allFields.filter(f => !f.value || String(f.value).trim() === '').map(f => f.label);

    return {
      percentage: Math.round((completed / allFields.length) * 100),
      missing,
      completed: allFields.length - missing.length,
      total: allFields.length,
    };
  };

  const completionStatus = getCompletionStatus();

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    setSignOutError('');
    setShowSignOutConfirm(false);
    
    try {
      await signOut();
      localStorage.removeItem('freemap_sessions');
      localStorage.removeItem('freemap_current_session');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setSignOutError('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOutCancel = () => {
    setShowSignOutConfirm(false);
  };

  const handleEditClick = (section: EditSection) => {
    if (!member) return;
    
    setEditForm({
      name: member.name || '',
      company: member.company || '',
      job_title: member.job_title || '',
      bio: member.bio || '',
      website: member.website || '',
      linkedin_url: member.linkedin_url || '',
      phone: member.phone || '',
      city: member.city || '',
      zip_code: member.zip_code || '',
      primary_market_area: member.primary_market_area || '',
      market_radius: member.market_radius || 25,
      member_type: member.member_type || 'homeowner',
      member_subtype: member.member_subtype || '',
    });
    setEditSection(section);
    setEditError('');
  };

  const handleEditCancel = () => {
    setEditSection(null);
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!member) return;
    
    setEditLoading(true);
    setEditError('');
    
    try {
      const updateData: Record<string, string | number | null> = {};
      
      if (editSection === 'basic') {
        updateData.name = editForm.name?.trim() || null;
        updateData.member_type = editForm.member_type;
        updateData.member_subtype = editForm.member_subtype?.trim() || null;
      } else if (editSection === 'professional') {
        updateData.company = editForm.company?.trim() || null;
        updateData.job_title = editForm.job_title?.trim() || null;
        updateData.bio = editForm.bio?.trim() || null;
        updateData.website = editForm.website?.trim() || null;
        updateData.linkedin_url = editForm.linkedin_url?.trim() || null;
        updateData.phone = editForm.phone?.trim() || null;
      } else if (editSection === 'location') {
        updateData.city = editForm.city?.trim() || null;
        updateData.zip_code = editForm.zip_code?.trim() || null;
        updateData.primary_market_area = editForm.primary_market_area?.trim() || null;
        updateData.market_radius = editForm.market_radius || null;
        updateData.state = 'MN'; // Always MN for Minnesota platform
      }

      const updatedMember = await MemberService.updateCurrentMember(updateData);
      setMember(updatedMember);
      setEditSection(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleFormChange = (field: keyof typeof editForm, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      if (user) {
        try {
          let memberData = await MemberService.getCurrentMember();
          
          if (!memberData) {
            try {
              memberData = await MemberService.ensureMemberExists();
            } catch (createError) {
              console.error('Error creating member:', createError);
            }
          }

          if (!memberData) {
            memberData = await MemberService.getCurrentMember();
          }

          setMember(memberData);
        } catch (error) {
          console.error('Error fetching member:', error);
        } finally {
          setMemberLoading(false);
        }
      } else {
        setMemberLoading(false);
      }
    };

    if (!isLoading) {
      fetchMember();
    }
  }, [user, isLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, user, router]);

  const handleMemberUpdate = (updatedMember: Member) => {
    setMember(updatedMember);
  };

  const getDisplayName = (): string => {
    return member?.name || user?.email?.split('@')[0] || 'User';
  };

  const isFieldComplete = (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== '';
  };

  // Show loading state
  if (isLoading || memberLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || !member) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <MainContentNav title="Account Settings" />
        <a
          href="/account/billing"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <CreditCardIcon className="w-4 h-4" />
          Billing
        </a>
      </div>
      
      {/* Profile Completion Status - Compact Accordion */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setCompletionExpanded(!completionExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white font-black text-sm">{completionStatus.percentage}%</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">Profile Completion</div>
                <div className="text-xs text-gray-500">{completionStatus.completed} of {completionStatus.total} fields</div>
              </div>
            </div>
            <div className="flex-1 max-w-xs mx-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionStatus.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          {completionExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
        </button>
        
        {completionExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="pt-4">
              {completionStatus.missing.length > 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">Missing Information:</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {completionStatus.missing.map((field, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                            {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                    <CheckIcon className="w-5 h-5" />
                    All required fields are complete!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {editError && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {editError}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-start gap-6">
          <ProfilePhoto 
            profile={member ? {
              id: member.id,
              avatar_url: member.avatar_url,
              name: member.name,
              email: member.email
            } : null} 
            size="lg" 
            editable={true}
            onUpdate={handleMemberUpdate}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-black truncate">{getDisplayName()}</h1>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                {member.member_type && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {MEMBER_TYPE_OPTIONS.find(o => o.value === member.member_type)?.label || member.member_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click photo to upload a new profile picture</p>
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-black text-black">Basic Information</h2>
            </div>
            {editSection !== 'basic' && (
              <button
                onClick={() => handleEditClick('basic')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editSection === 'basic' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.member_type}
                  onChange={(e) => handleFormChange('member_type', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors bg-white"
                >
                  {MEMBER_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {MEMBER_SUBTYPE_EXAMPLES[editForm.member_type].length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specialization (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.member_subtype}
                    onChange={(e) => handleFormChange('member_subtype', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder={`e.g., ${MEMBER_SUBTYPE_EXAMPLES[editForm.member_type].join(', ')}`}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Examples: {MEMBER_SUBTYPE_EXAMPLES[editForm.member_type].join(', ')}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleEditSave}
                  disabled={editLoading || !editForm.name.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.name) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.name || <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Member Type</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.member_type) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.member_type ? MEMBER_TYPE_OPTIONS.find(o => o.value === member.member_type)?.label || member.member_type : <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              {member.member_subtype && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Specialization</dt>
                  <dd className="text-base font-medium text-black capitalize">{member.member_subtype}</dd>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Professional Information Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BriefcaseIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-black text-black">Professional Information</h2>
            </div>
            {editSection !== 'professional' && (
              <button
                onClick={() => handleEditClick('professional')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editSection === 'professional' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => handleFormChange('company', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={editForm.job_title}
                    onChange={(e) => handleFormChange('job_title', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="Enter job title"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="(612) 555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => handleFormChange('bio', e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none"
                  placeholder="Tell us about yourself (max 2000 characters)"
                />
                <p className="text-xs text-gray-500 mt-1.5">{editForm.bio.length}/2000 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={editForm.linkedin_url}
                    onChange={(e) => handleFormChange('linkedin_url', e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Company</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.company) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.company || <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Title</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.job_title) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.job_title || <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.phone) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.phone || <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bio</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.bio) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.bio ? (member.bio.length > 100 ? `${member.bio.substring(0, 100)}...` : member.bio) : <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              {member.website && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</dt>
                  <dd className="text-base font-medium text-black">
                    <a href={member.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {member.website}
                    </a>
                  </dd>
                </div>
              )}
              {member.linkedin_url && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">LinkedIn</dt>
                  <dd className="text-base font-medium text-black">
                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {member.linkedin_url}
                    </a>
                  </dd>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location Information Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-5 h-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-black text-black">Location Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Your location and market area preferences</p>
              </div>
            </div>
            {editSection !== 'location' && (
              <button
                onClick={() => handleEditClick('location')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {editSection === 'location' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <LocationAutocomplete
                    value={editForm.city}
                    onChange={(value) => handleFormChange('city', value)}
                    onLocationSelect={(location) => {
                      if (location.zip) {
                        handleFormChange('zip_code', location.zip);
                      }
                      if (!editForm.primary_market_area) {
                        const marketAreaMap: Record<string, string> = {
                          'Minneapolis': 'Twin Cities',
                          'Saint Paul': 'Twin Cities',
                          'St. Paul': 'Twin Cities',
                          'Duluth': 'Duluth',
                          'Rochester': 'Rochester',
                          'Bloomington': 'Twin Cities',
                          'Plymouth': 'Twin Cities',
                          'Eagan': 'Twin Cities',
                          'Woodbury': 'Twin Cities',
                          'Maple Grove': 'Twin Cities',
                          'Eden Prairie': 'Twin Cities',
                          'Coon Rapids': 'Twin Cities',
                          'Burnsville': 'Twin Cities',
                          'Minnetonka': 'Twin Cities',
                          'Apple Valley': 'Twin Cities',
                          'Blaine': 'Twin Cities',
                          'Lakeville': 'Twin Cities',
                          'St. Cloud': 'St. Cloud',
                          'Mankato': 'Mankato',
                          'Moorhead': 'Moorhead',
                          'Winona': 'Winona',
                        };
                        const suggestedArea = marketAreaMap[location.city] || location.city;
                        handleFormChange('primary_market_area', suggestedArea);
                      }
                    }}
                    placeholder="Search for a city in Minnesota..."
                    type="place"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={editForm.zip_code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      handleFormChange('zip_code', value);
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                    placeholder="55401"
                    maxLength={5}
                    pattern="[0-9]{5}"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">5-digit ZIP code</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Market Area</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Market City <span className="text-red-500">*</span>
                    </label>
                    <LocationAutocomplete
                      value={editForm.primary_market_area}
                      onChange={(value) => handleFormChange('primary_market_area', value)}
                      placeholder="Search for a city in Minnesota..."
                      type="place"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Your primary market city within Minnesota</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Market Radius: <span className="text-black font-bold">{editForm.market_radius} miles</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="99"
                      value={editForm.market_radius}
                      onChange={(e) => handleFormChange('market_radius', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1 mile</span>
                      <span>50 miles</span>
                      <span>99 miles</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Radius around your primary market area</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.city) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.city || <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State</dt>
                <dd className="text-base font-medium text-black">{member.state || 'MN'}</dd>
              </div>
              {member.zip_code && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ZIP Code</dt>
                  <dd className="text-base font-medium text-black">{member.zip_code}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Primary Market Area</dt>
                <dd className={`text-base font-medium ${isFieldComplete(member.primary_market_area) ? 'text-black' : 'text-yellow-600'}`}>
                  {member.primary_market_area || <span className="italic text-gray-400">Not set</span>}
                </dd>
              </div>
              {member.market_radius && (
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Market Radius</dt>
                  <dd className="text-base font-medium text-black">{member.market_radius} miles</dd>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-black text-black mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</dt>
            <dd className="text-base font-medium text-black">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</dt>
            <dd className="text-base font-medium text-black capitalize">{member.role || 'general'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Member since</dt>
            <dd className="text-base font-medium text-black">
              {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'Unknown'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email verified</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.email_confirmed_at ? 'Verified' : 'Pending'}
              </span>
            </dd>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-black text-black mb-4">Account Actions</h3>
        
        {signOutError && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {signOutError}
          </div>
        )}
        
        <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div>
            <h4 className="text-base font-bold text-black mb-1">Sign Out</h4>
            <p className="text-sm text-gray-600">Sign out of your account on this device</p>
          </div>
          <button
            onClick={handleSignOutClick}
            disabled={isLoading || isSigningOut}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-black text-black mb-2">
                  Sign out of your account?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  You&apos;ll need to sign in again to access your account.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSignOutCancel}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOutConfirm}
                    disabled={isSigningOut}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 border-2 border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 shadow-lg"
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
