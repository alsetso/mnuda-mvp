import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/adminHelpers';
import { AdminMemberService } from '@/features/admin/services/memberAdminService';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, UserIcon, CalendarIcon, ShieldCheckIcon, PencilIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, GlobeAltIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Member Details | MNUDA',
  description: 'View member details.',
  robots: 'noindex, nofollow',
};

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdminAccess();
  const { id } = await params;
  
  const service = new AdminMemberService();
  const member = await service.getById(id);

  if (!member) {
    notFound();
  }

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
      serverAuth={auth}
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/admin/community/members"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Members
          </Link>

          {/* Member Details */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gold-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name || member.email}
                      className="w-16 h-16 object-cover"
                    />
                  ) : (
                    <UserIcon className="w-8 h-8 text-gold-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black mb-2">
                    {member.name || member.email}
                  </h1>
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                        <ShieldCheckIcon className="w-4 h-4" />
                        Admin
                      </span>
                    )}
                    {member.role === 'investor' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        Investor
                      </span>
                    )}
                    {member.role === 'general' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        General
                      </span>
                    )}
                    {member.member_type && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold-100 text-gold-700 capitalize">
                        {member.member_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/community/members/${member.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  href={`/admin/community/members/${member.id}/role`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  Change Role
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Email</h2>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-900">{member.email}</p>
                </div>
              </div>

              {member.phone && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Phone</h2>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900">{member.phone}</p>
                  </div>
                </div>
              )}

              {member.company && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Company</h2>
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900">{member.company}</p>
                    {member.job_title && (
                      <span className="text-gray-500">• {member.job_title}</span>
                    )}
                  </div>
                </div>
              )}

              {(member.city || member.state) && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Location</h2>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-900">
                      {[member.city, member.state, member.zip_code].filter(Boolean).join(', ') || 'Not specified'}
                    </p>
                  </div>
                </div>
              )}

              {member.website && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Website</h2>
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {member.website}
                    </a>
                  </div>
                </div>
              )}

              {member.linkedin_url && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">LinkedIn</h2>
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {member.linkedin_url}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            {member.bio && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Bio</h2>
                <p className="text-gray-900">{member.bio}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {member.primary_market_area && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Primary Market Area</h2>
                  <p className="text-gray-900">{member.primary_market_area}</p>
                  {member.market_radius && (
                    <p className="text-gray-500 text-sm">Radius: {member.market_radius} miles</p>
                  )}
                </div>
              )}

              {member.member_subtype && (
                <div>
                  <h2 className="text-sm font-medium text-gray-700 mb-2">Member Subtype</h2>
                  <p className="text-gray-900">{member.member_subtype}</p>
                </div>
              )}

              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Created At</h2>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-900">
                    {new Date(member.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h2>
                <p className="text-gray-900">
                  {new Date(member.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

