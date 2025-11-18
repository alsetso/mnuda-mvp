'use client';

import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { IdentityDetails, CreditReportFile } from '../types';

interface ReviewStepProps {
  identityDetails: IdentityDetails;
  reports: {
    experian: CreditReportFile;
    equifax: CreditReportFile;
    transunion: CreditReportFile;
  };
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({
  identityDetails,
  reports,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  const formatSSN = (ssn: string) => {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Review & Submit</h2>
        <p className="text-gray-600 mb-6">
          Please review all information before submitting. You can go back to make changes if needed.
        </p>
      </div>

      {/* Identity Details Review */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4 border-b-2 border-gray-300 pb-2">
          Identity Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Name</p>
            <p className="font-semibold text-black">
              {identityDetails.firstName} {identityDetails.middleName} {identityDetails.lastName}
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Date of Birth</p>
            <p className="font-semibold text-black">
              {new Date(identityDetails.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">SSN</p>
            <p className="font-semibold text-black">{formatSSN(identityDetails.ssn)}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-black">{identityDetails.email}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Phone</p>
            <p className="font-semibold text-black">{identityDetails.phone}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Address</p>
            <p className="font-semibold text-black">
              {identityDetails.address.street}, {identityDetails.address.city}, {identityDetails.address.state} {identityDetails.address.zipCode}
            </p>
          </div>
        </div>
        {identityDetails.previousAddresses && identityDetails.previousAddresses.length > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-gray-300">
            <p className="text-gray-600 mb-2">Previous Addresses</p>
            {identityDetails.previousAddresses.map((addr, index) => (
              <p key={index} className="text-sm text-black mb-1">
                {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                {addr.yearsAtAddress && ` (${addr.yearsAtAddress} years)`}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Credit Reports Review */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4 border-b-2 border-gray-300 pb-2">
          Credit Reports
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <p className="font-semibold text-black">Experian</p>
                <p className="text-sm text-gray-600">
                  {reports.experian.fileName} • {formatFileSize(reports.experian.fileSize)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <p className="font-semibold text-black">Equifax</p>
                <p className="text-sm text-gray-600">
                  {reports.equifax.fileName} • {formatFileSize(reports.equifax.fileSize)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <p className="font-semibold text-black">TransUnion</p>
                <p className="text-sm text-gray-600">
                  {reports.transunion.fileName} • {formatFileSize(reports.transunion.fileSize)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              Submit Request
            </>
          )}
        </button>
      </div>
    </div>
  );
}



