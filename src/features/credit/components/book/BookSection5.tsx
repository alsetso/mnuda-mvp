'use client';

export function BookSection5() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">Dispute Process</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          The dispute process allows you to challenge inaccurate, incomplete, or unverifiable information on your credit report. Understanding this process is essential for credit restoration.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">How to Dispute</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
          <li>Review your credit reports from all three bureaus</li>
          <li>Identify inaccurate or unverifiable items</li>
          <li>Gather supporting documentation</li>
          <li>Submit disputes to each credit bureau</li>
          <li>Follow up on investigation results</li>
        </ol>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Dispute Methods</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Online disputes through bureau websites</li>
          <li>Written disputes via mail (recommended for complex issues)</li>
          <li>Phone disputes for simple corrections</li>
        </ul>
      </div>
    </div>
  );
}



