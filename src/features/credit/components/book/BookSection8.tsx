'use client';

export function BookSection8() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">FCRA Rights</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Fair Credit Reporting Act (FCRA) protects your rights regarding credit reporting. Understanding these rights is crucial for effective credit restoration.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Your Rights Under FCRA</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Right to access your credit reports</li>
          <li>Right to dispute inaccurate information</li>
          <li>Right to have errors corrected</li>
          <li>Right to add a statement to your report</li>
          <li>Right to know who accessed your report</li>
          <li>Right to limit prescreened offers</li>
        </ul>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Bureau Responsibilities</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Credit bureaus must investigate disputes within 30 days, correct errors, and notify you of results. They must also verify information with creditors before reporting negative items.
        </p>
      </div>
    </div>
  );
}


