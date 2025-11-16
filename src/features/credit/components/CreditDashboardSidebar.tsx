'use client';

import { CreditProfile, CreditReport, NegativeItem, CreditLetter } from '../types';

export type DashboardView = 'profile' | 'reports' | 'negatives' | 'letters';

interface CreditDashboardSidebarProps {
  profile: CreditProfile;
  reports: CreditReport[];
  negatives: NegativeItem[];
  letters: CreditLetter[];
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export function CreditDashboardSidebar({
  profile,
  reports,
  negatives,
  letters,
  activeView,
  onViewChange,
}: CreditDashboardSidebarProps) {
  const reportsCount = reports.length;
  const negativesCount = negatives.length;
  const lettersCount = letters.length;

  const menuItems = [
    {
      id: 'profile' as DashboardView,
      label: 'Profile Status',
      count: null,
      icon: '👤',
    },
    {
      id: 'reports' as DashboardView,
      label: 'Reports',
      count: reportsCount,
      icon: '📄',
    },
    {
      id: 'negatives' as DashboardView,
      label: 'Negatives',
      count: negativesCount,
      icon: '⚠️',
    },
    {
      id: 'letters' as DashboardView,
      label: 'Letters',
      count: lettersCount,
      icon: '✉️',
    },
  ];

  return (
    <div 
      className="w-80 bg-white border-r-2 border-gold-200 flex flex-col flex-shrink-0"
      style={{ height: '100%' }}
    >
      {/* Header */}
      <div className="p-6 border-b-2 border-gold-200">
        <h2 className="text-xl font-bold text-black mb-2">Credit Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            profile.status === 'active' ? 'bg-green-500' : 
            profile.status === 'inactive' ? 'bg-yellow-500' : 
            'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-600 capitalize">{profile.status}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-gold-500 bg-gold-50'
                    : 'border-gold-200 hover:border-gold-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className={`font-semibold ${
                      isActive ? 'text-black' : 'text-gray-700'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  {item.count !== null && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isActive
                        ? 'bg-gold-500 text-black'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-gold-200">
        <div className="text-xs text-gray-500">
          <p className="font-semibold mb-1">Profile Created</p>
          <p>{new Date(profile.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}</p>
        </div>
      </div>
    </div>
  );
}

