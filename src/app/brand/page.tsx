'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AccordionSectionProps {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, description, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 px-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-black mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          {isOpen ? (
            <ChevronUpIcon className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-8">
          {children}
        </div>
      )}
    </div>
  );
}

export default function BrandPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <PageLayout showHeader={true} showFooter={true} containerMaxWidth="7xl" backgroundColor="bg-white">
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-black mb-4">MNUDA Brand Standards</h1>
          <p className="text-lg text-gray-600">Official typography and component standards for brand consistency across all MNUDA platforms.</p>
        </div>

        <div className="space-y-0">
          {/* Fonts */}
          <AccordionSection
            title="Fonts"
            description="Font families and typefaces used throughout the platform"
            isOpen={openSections.has('fonts')}
            onToggle={() => toggleSection('fonts')}
          >
            <div className="space-y-12">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Libre Baskerville</h4>
                <div className="space-y-4">
                  <div className="bg-gold-100 p-8 rounded-xl border border-gold-200">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Font Family</p>
                        <p className="text-lg font-libre-baskerville">Libre Baskerville, serif</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Available Weights</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-white rounded text-sm">400 (Regular)</span>
                          <span className="px-2 py-1 bg-white rounded text-sm">700 (Bold)</span>
                          <span className="px-2 py-1 bg-white rounded text-sm">400 Italic</span>
                          <span className="px-2 py-1 bg-white rounded text-sm">700 Italic</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Usage</p>
                        <p className="text-sm text-gray-700">Primary mission statements and impact headings</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Example</p>
                        <h1 className="text-6xl font-medium tracking-[-0.105em] text-black font-libre-baskerville italic">
                          For the Love of Minnesota
                        </h1>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Tailwind Class</p>
                        <code className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded">font-libre-baskerville</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Inter</h4>
                <div className="space-y-4">
                  <div className="bg-white p-8 rounded-xl border border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Font Family</p>
                        <p className="text-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Inter, system-ui, sans-serif</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Available Weights</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-50 rounded text-sm">400 (Regular)</span>
                          <span className="px-2 py-1 bg-gray-50 rounded text-sm">500 (Medium)</span>
                          <span className="px-2 py-1 bg-gray-50 rounded text-sm">600 (Semibold)</span>
                          <span className="px-2 py-1 bg-gray-50 rounded text-sm">700 (Bold)</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Usage</p>
                        <p className="text-sm text-gray-700">Default body text, UI elements, buttons, forms, and all standard content</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Examples</p>
                        <div className="space-y-3">
                          <p className="text-base text-gray-700" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                            Standard body text for detailed information delivery.
                          </p>
                          <p className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                            Semibold heading text
                          </p>
                          <p className="text-base font-bold text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                            Bold emphasis text
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Default</p>
                        <p className="text-xs text-gray-600">Applied globally via body element</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Font Stack</h4>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Primary Body Font</p>
                      <code className="text-xs text-gray-700 font-mono">Inter, system-ui, -apple-system, sans-serif</code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Heading Font (Impact)</p>
                      <code className="text-xs text-gray-700 font-mono">Libre Baskerville, serif</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Typography */}
          <AccordionSection
            title="Typography"
            description="Headings, body text, and content hierarchy"
            isOpen={openSections.has('typography')}
            onToggle={() => toggleSection('typography')}
          >
            <div className="space-y-12">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">H1 - Impact Statement</h4>
                <div className="bg-gold-100 p-8 rounded-xl border border-gold-200">
                  <h1 className="text-7xl sm:text-8xl lg:text-9xl font-medium tracking-[-0.105em] text-black mb-4 leading-tight font-libre-baskerville italic">
                    For the Love of
                    <span className="block text-gold-600 mt-2">Minnesota</span>
                  </h1>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">text-7xl sm:text-8xl lg:text-9xl font-medium tracking-[-0.105em] font-libre-baskerville italic</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">H2 - Section Heading</h4>
                <div className="bg-white p-8 rounded-xl border border-gray-200">
                  <h2 className="text-4xl sm:text-5xl font-black text-black">Property Acquisition Services</h2>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">text-4xl sm:text-5xl font-black</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Subtitle</h4>
                <div className="bg-white p-8 rounded-xl border border-gray-200">
                  <h2 className="text-4xl sm:text-5xl font-black text-black mb-4">Property Acquisition Services</h2>
                  <p className="text-xl text-gray-700 max-w-2xl">Comprehensive identification and acquisition of distressed properties throughout Minnesota markets</p>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">text-xl text-gray-700</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Body Text</h4>
                <div className="bg-white p-8 rounded-xl border border-gray-200">
                  <p className="text-base text-gray-700 leading-relaxed max-w-2xl">Standard content paragraphs for detailed information delivery. Used for service descriptions, operational procedures, and stakeholder communications.</p>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">text-base text-gray-700 leading-relaxed</div>
              </div>
            </div>
          </AccordionSection>

          {/* Buttons */}
          <AccordionSection
            title="Buttons"
            description="Primary, secondary, and action buttons"
            isOpen={openSections.has('buttons')}
            onToggle={() => toggleSection('buttons')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Primary Button</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-lg font-bold rounded-lg hover:bg-gray-900 transition-all shadow-lg">
                    Get Started
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 bg-gold-500 text-black px-8 py-4 text-lg font-bold rounded-lg hover:bg-gold-600 transition-all">
                    View Properties
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">bg-black text-white px-8 py-4 font-bold rounded-lg</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Secondary Button</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="inline-flex items-center justify-center gap-2 border-2 border-black text-black px-6 py-3 text-base font-medium rounded-lg hover:bg-gray-50 transition-all">
                    Learn More
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 border-2 border-gold-500 text-gold-600 px-6 py-3 text-base font-medium rounded-lg hover:bg-gold-50 transition-all">
                    Cancel
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">border-2 border-black text-black px-6 py-3 font-medium rounded-lg</div>
              </div>
            </div>
          </AccordionSection>

          {/* Forms */}
          <AccordionSection
            title="Forms"
            description="Input fields, selects, and textareas"
            isOpen={openSections.has('forms')}
            onToggle={() => toggleSection('forms')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Text Input</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Address</label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Textarea</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter notes..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">Same as input with rows prop</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Select</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent">
                    <option>Select status...</option>
                    <option>Off Market</option>
                    <option>Under Contract</option>
                    <option>Sold</option>
                  </select>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">Same styling as input</div>
              </div>
            </div>
          </AccordionSection>

          {/* Cards */}
          <AccordionSection
            title="Cards"
            description="Feature cards and content modules"
            isOpen={openSections.has('cards')}
            onToggle={() => toggleSection('cards')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Light Card</h4>
                <div className="bg-gold-100 rounded-xl p-8 border border-gold-200">
                  <h3 className="text-2xl font-black text-black mb-4">Property Development</h3>
                  <p className="text-gray-700 leading-relaxed">Strategic redevelopment of acquired properties including residential rehabilitation and commercial conversion.</p>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">bg-gold-100 rounded-xl p-8 border border-gold-200</div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Dark Card</h4>
                <div className="bg-black rounded-xl p-8 border border-white/20">
                  <div className="text-3xl font-black text-gold-400 mb-2">Portfolio Growth</div>
                  <p className="text-gray-300">Systematic expansion of managed property assets through disciplined acquisition practices.</p>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">bg-black rounded-xl p-8 border border-white/20</div>
              </div>
            </div>
          </AccordionSection>

          {/* Modals & Overlays */}
          <AccordionSection
            title="Modals & Overlays"
            description="Dialog windows and slide-over panels"
            isOpen={openSections.has('modals')}
            onToggle={() => toggleSection('modals')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Modal Header</h4>
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600">Modal content area</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">px-6 py-4 border-b for header</div>
              </div>
            </div>
          </AccordionSection>

          {/* Tables */}
          <AccordionSection
            title="Tables"
            description="Data tables and lists"
            isOpen={openSections.has('tables')}
            onToggle={() => toggleSection('tables')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Data Table</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Address</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">123 Main St</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Off Market</td>
                        <td className="px-4 py-3 text-sm text-gray-900">$250,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">bg-gray-50 for header, hover:bg-gray-50 for rows</div>
              </div>
            </div>
          </AccordionSection>

          {/* Badges & Tags */}
          <AccordionSection
            title="Badges & Tags"
            description="Status indicators and labels"
            isOpen={openSections.has('badges')}
            onToggle={() => toggleSection('badges')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Status Badges</h4>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gold-200 text-gold-800">Off Market</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Under Contract</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Sold</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">px-3 py-1 rounded-full text-xs font-semibold</div>
              </div>
            </div>
          </AccordionSection>

          {/* Navigation */}
          <AccordionSection
            title="Navigation"
            description="Tabs and menu items"
            isOpen={openSections.has('navigation')}
            onToggle={() => toggleSection('navigation')}
          >
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tabs</h4>
                <div className="border-b border-gray-200">
                  <div className="flex space-x-1">
                    <button className="px-4 py-2 text-sm font-medium border-b-2 border-accent text-accent">Overview</button>
                    <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900">Documents</button>
                    <button className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900">Notes</button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-mono">border-b-2 border-accent for active</div>
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>
    </PageLayout>
  );
}
