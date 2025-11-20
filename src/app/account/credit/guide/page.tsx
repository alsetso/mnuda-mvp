'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { CreditBreadcrumbs } from '@/features/credit/components/CreditBreadcrumbs';
import { BookSection1 } from '@/features/credit/components/book/BookSection1';
import { BookSection2 } from '@/features/credit/components/book/BookSection2';
import { BookSection3 } from '@/features/credit/components/book/BookSection3';
import { BookSection4 } from '@/features/credit/components/book/BookSection4';
import { BookSection5 } from '@/features/credit/components/book/BookSection5';
import { BookSection6 } from '@/features/credit/components/book/BookSection6';
import { BookSection7 } from '@/features/credit/components/book/BookSection7';
import { BookSection8 } from '@/features/credit/components/book/BookSection8';
import { BookSection9 } from '@/features/credit/components/book/BookSection9';
import { BookSection10 } from '@/features/credit/components/book/BookSection10';
import { BookSection11 } from '@/features/credit/components/book/BookSection11';
import { BookSection12 } from '@/features/credit/components/book/BookSection12';
import { BookSection13 } from '@/features/credit/components/book/BookSection13';
import { BookSection14 } from '@/features/credit/components/book/BookSection14';

const sections = [
  { id: 1, title: 'Understanding Credit', component: BookSection1 },
  { id: 2, title: 'Credit Reports Explained', component: BookSection2 },
  { id: 3, title: 'Credit Scores', component: BookSection3 },
  { id: 4, title: 'Negative Items', component: BookSection4 },
  { id: 5, title: 'Dispute Process', component: BookSection5 },
  { id: 6, title: 'Credit Bureaus', component: BookSection6 },
  { id: 7, title: 'Dispute Letters', component: BookSection7 },
  { id: 8, title: 'FCRA Rights', component: BookSection8 },
  { id: 9, title: 'FDCPA Protection', component: BookSection9 },
  { id: 10, title: 'Credit Repair Strategies', component: BookSection10 },
  { id: 11, title: 'Building Positive Credit', component: BookSection11 },
  { id: 12, title: 'Credit Monitoring', component: BookSection12 },
  { id: 13, title: 'Common Mistakes', component: BookSection13 },
  { id: 14, title: 'Success Stories', component: BookSection14 },
];

export default function CreditGuidePage() {
  const [activeSection, setActiveSection] = useState<number>(1);

  const ActiveComponent = sections.find((s) => s.id === activeSection)?.component || BookSection1;

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <CreditBreadcrumbs
            items={[
              { label: 'Credit', href: '/account/credit' },
              { label: 'Credit Guide' },
            ]}
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white border-2 border-gold-200 rounded-xl p-4 sticky top-4">
                <h2 className="text-xl font-bold text-black mb-4">Credit Guide</h2>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-gold-500 text-black font-semibold'
                          : 'text-gray-700 hover:bg-gold-100'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white border-2 border-gold-200 rounded-xl p-8">
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}




