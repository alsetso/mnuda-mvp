'use client';

export function BookSection6() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">Credit Bureaus</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          The three major credit bureaus—Experian, Equifax, and TransUnion—collect and maintain credit information on millions of consumers. Each bureau operates independently.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Experian</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          One of the largest credit bureaus, Experian provides credit reports and scores to lenders and consumers. They use the FICO Score 8 model.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Equifax</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Equifax maintains credit information and provides credit monitoring services. They also use FICO scoring models.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">TransUnion</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          TransUnion provides credit reports and scores, along with identity protection services. They use VantageScore and FICO models.
        </p>
      </div>
    </div>
  );
}


