'use client';

import { BuildingOfficeIcon, MapPinIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { ModalNav } from '@/components/ui/ModalNav';

interface AboutMnUDAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutMnUDAModal({ isOpen, onClose }: AboutMnUDAModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[90vh] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalNav title="About MnUDA" onClose={onClose} />
          
          <div className="p-6 space-y-6">
            {/* Main Description */}
            <div>
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                <strong className="text-gray-900">MnUDA</strong> is the premier platform for discovering and accessing{' '}
                <strong className="text-gray-900">off-market real estate development and acquisition opportunities</strong> across Minnesota.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We connect developers, investors, and real estate professionals with exclusive opportunities that aren't available through traditional channels.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BuildingOfficeIcon className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Development Opportunities</h3>
                  <p className="text-sm text-gray-600">
                    Access exclusive off-market development projects and land acquisition opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Minnesota Focus</h3>
                  <p className="text-sm text-gray-600">
                    Comprehensive coverage of opportunities across all Minnesota cities and counties.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ChartBarIcon className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Market Intelligence</h3>
                  <p className="text-sm text-gray-600">
                    Data-driven insights and analytics to help you make informed investment decisions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Exclusive Access</h3>
                  <p className="text-sm text-gray-600">
                    Connect with property owners and developers before opportunities hit the public market.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Join MnUDA to start discovering exclusive real estate opportunities across Minnesota today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

