'use client';

export function BookSection9() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">FDCPA Protection</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          The Fair Debt Collection Practices Act (FDCPA) protects consumers from abusive, deceptive, and unfair debt collection practices.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">What Debt Collectors Cannot Do</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Harass or threaten you</li>
          <li>Call at unreasonable times</li>
          <li>Contact you at work if you've asked them not to</li>
          <li>Use false or misleading statements</li>
          <li>Threaten legal action they cannot take</li>
          <li>Contact third parties about your debt</li>
        </ul>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">Your Rights</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          You have the right to request validation of debts, dispute debts, and request that collectors stop contacting you. Understanding these rights can help protect you during the credit restoration process.
        </p>
      </div>
    </div>
  );
}

