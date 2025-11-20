'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import PageLayout from '@/components/PageLayout';
import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Member, MemberRole } from '@/features/auth/services/memberService';

const ROLES: { value: MemberRole; label: string; description: string }[] = [
  { value: 'general', label: 'General', description: 'Standard user with basic access' },
  { value: 'investor', label: 'Investor', description: 'Investor-level access' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
];

export default function AdminMemberRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('general');

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setMemberId(resolvedParams.id);
      
      if (authLoading) return;
      
      if (!user) {
        router.push('/login?redirect=/admin/community/members&message=Please sign in to access admin panel');
        return;
      }

      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          setIsAdmin(true);
          await loadMember(resolvedParams.id);
        } else {
          router.push('/?message=Access denied. Admin privileges required.');
        }
      } catch (err) {
        router.push('/?message=Failed to verify admin access.');
      } finally {
        setCheckingAdmin(false);
      }
    };

    init();
  }, [user, authLoading, router, params]);

  const loadMember = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/community/members/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load member');
      }
      const memberData: Member = await response.json();
      setMember(memberData);
      setSelectedRole(memberData.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole === member?.role) {
      router.back();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/community/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      router.push(`/admin/community/members/${memberId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      setSaving(false);
    }
  };

  if (authLoading || checkingAdmin || loading) {
    return (
      <PageLayout
        showHeader={true}
        showFooter={false}
        containerMaxWidth="full"
        backgroundColor="bg-gold-100"
        contentPadding=""
      >
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin || !memberId || !member) {
    return null;
  }

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/admin/community/members/${memberId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Member
          </Link>

          {/* Change Role Form */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-2">
                  Change Member Role
                </h1>
                <p className="text-gray-600">
                  Update the role for {member.name || member.email}
                </p>
              </div>
            </div>

            {/* Current Role */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Current Role</p>
              <p className="text-lg font-semibold text-black capitalize">{member.role}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Role
                </label>
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRole === role.value
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-black capitalize">
                          {role.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {role.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning if changing to/from admin */}
              {(selectedRole === 'admin' || member.role === 'admin') && selectedRole !== member.role && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    <strong>Warning:</strong> Changing admin roles can have significant security implications. 
                    Make sure this change is intentional.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving || selectedRole === member.role}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Role'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

