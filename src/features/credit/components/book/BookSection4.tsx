'use client';

export function BookSection4() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">Negative Items</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          Negative items on your credit report can significantly damage your credit score. Understanding these items is crucial for effective credit restoration.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Common Negative Items</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Late payments (30, 60, 90+ days)</li>
          <li>Collections accounts</li>
          <li>Charge-offs</li>
          <li>Bankruptcies</li>
          <li>Foreclosures</li>
          <li>Repossessions</li>
          <li>Tax liens</li>
          <li>Civil judgments</li>
        </ul>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Impact on Credit</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Negative items can remain on your credit report for 7-10 years, depending on the type. However, you have the right to dispute inaccurate or unverifiable items.
        </p>
      </div>
    </div>
  );
}


