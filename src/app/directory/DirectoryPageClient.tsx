'use client';

import PageLayout from '@/components/PageLayout';
import { MapPinIcon, UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface CountyData {
  rank: number;
  name: string;
  population: number;
  countySeat: string;
  area: string;
  largestCity: string;
}

const counties: CountyData[] = [
  {
    rank: 1,
    name: 'Hennepin County',
    population: 1283458,
    countySeat: 'Minneapolis',
    area: '607 sq mi',
    largestCity: 'Minneapolis',
  },
  {
    rank: 2,
    name: 'Ramsey County',
    population: 545556,
    countySeat: 'Saint Paul',
    area: '170 sq mi',
    largestCity: 'Saint Paul',
  },
  {
    rank: 3,
    name: 'Dakota County',
    population: 457817,
    countySeat: 'Hastings',
    area: '587 sq mi',
    largestCity: 'Eagan',
  },
  {
    rank: 4,
    name: 'Anoka County',
    population: 380590,
    countySeat: 'Anoka',
    area: '446 sq mi',
    largestCity: 'Coon Rapids',
  },
  {
    rank: 5,
    name: 'Washington County',
    population: 288522,
    countySeat: 'Stillwater',
    area: '423 sq mi',
    largestCity: 'Woodbury',
  },
  {
    rank: 6,
    name: 'St. Louis County',
    population: 200514,
    countySeat: 'Duluth',
    area: '6,860 sq mi',
    largestCity: 'Duluth',
  },
  {
    rank: 7,
    name: 'Olmsted County',
    population: 164784,
    countySeat: 'Rochester',
    area: '655 sq mi',
    largestCity: 'Rochester',
  },
  {
    rank: 8,
    name: 'Stearns County',
    population: 160977,
    countySeat: 'Saint Cloud',
    area: '1,390 sq mi',
    largestCity: 'Saint Cloud',
  },
  {
    rank: 9,
    name: 'Scott County',
    population: 155814,
    countySeat: 'Shakopee',
    area: '368 sq mi',
    largestCity: 'Shakopee',
  },
  {
    rank: 10,
    name: 'Wright County',
    population: 151150,
    countySeat: 'Buffalo',
    area: '714 sq mi',
    largestCity: 'Buffalo',
  },
];

const formatPopulation = (pop: number): string => {
  if (pop >= 1000000) {
    return `${(pop / 1000000).toFixed(2)}M`;
  }
  return `${(pop / 1000).toFixed(0)}K`;
};

export default function DirectoryPageClient() {
  return (
    <PageLayout showHeader={true} showFooter={false} containerMaxWidth="7xl" backgroundColor="bg-gold-100">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-[-0.105em] text-black mb-6 leading-tight font-libre-baskerville italic">
            Minnesota Counties
            <span className="block text-gold-600 mt-2">Directory</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            Explore the top 10 most populous counties in Minnesota with population data, county seats, and key information.
          </p>
        </div>
      </section>

      {/* Counties Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {counties.map((county) => (
              <div
                key={county.rank}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-xl font-black text-gold-600">#{county.rank}</span>
                      <h3 className="text-xl font-black text-black leading-tight">{county.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Population</div>
                      <div className="text-base font-bold text-black">
                        {formatPopulation(county.population)}
                        <span className="text-sm font-normal text-gray-500 ml-1.5">
                          ({county.population.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BuildingOfficeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">County Seat</div>
                      <div className="text-base font-bold text-black">{county.countySeat}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <MapPinIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Largest City</div>
                      <div className="text-base font-bold text-black">{county.largestCity}</div>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Area</div>
                    <div className="text-sm font-semibold text-black">{county.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-gray-100">
            <h2 className="text-3xl font-black text-black mb-8 text-center">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center">
              <div>
                <div className="text-4xl font-black text-gold-600 mb-2">10</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Counties Listed</div>
              </div>
              <div>
                <div className="text-4xl font-black text-gold-600 mb-2">
                  {formatPopulation(counties.reduce((sum, c) => sum + c.population, 0))}
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Population</div>
              </div>
              <div>
                <div className="text-4xl font-black text-gold-600 mb-2">87%</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Of State Population</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

