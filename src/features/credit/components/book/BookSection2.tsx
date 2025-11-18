'use client';

export function BookSection2() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-black mb-6">Credit Reports Explained</h2>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          Your credit report is a detailed record of your credit history compiled by credit bureaus. It contains information about your accounts, payment history, and public records.
        </p>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">What's in a Credit Report?</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Personal information (name, address, SSN)</li>
          <li>Account information (credit cards, loans, mortgages)</li>
          <li>Payment history and account status</li>
          <li>Credit inquiries</li>
          <li>Public records (bankruptcies, liens, judgments)</li>
          <li>Collections and negative items</li>
        </ul>
        <h3 className="text-2xl font-bold text-black mt-8 mb-4">The Three Major Bureaus</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Experian, Equifax, and TransUnion are the three major credit bureaus. Each maintains its own version of your credit report, and they may contain different information.
        </p>
      </div>
    </div>
  );
}


