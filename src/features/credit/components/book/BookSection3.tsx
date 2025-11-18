'use client';

export function BookSection3() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">Credit Scores</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          Credit scores are three-digit numbers that represent your creditworthiness. Lenders use these scores to evaluate the risk of lending you money.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Score Ranges</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Excellent: 800-850</li>
          <li>Very Good: 740-799</li>
          <li>Good: 670-739</li>
          <li>Fair: 580-669</li>
          <li>Poor: 300-579</li>
        </ul>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Factors Affecting Your Score</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Payment history (35%)</li>
          <li>Amounts owed (30%)</li>
          <li>Length of credit history (15%)</li>
          <li>Credit mix (10%)</li>
          <li>New credit (10%)</li>
        </ul>
      </div>
    </div>
  );
}



