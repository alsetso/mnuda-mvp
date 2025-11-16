export interface IdentityDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  ssn: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  previousAddresses?: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    yearsAtAddress: string;
  }>;
}

export interface CreditReportFile {
  file: File;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

export interface CreditRestorationRequest {
  identityDetails: IdentityDetails;
  reports: {
    experian: CreditReportFile;
    equifax: CreditReportFile;
    transunion: CreditReportFile;
  };
}

// New profile-based types
export interface CreditProfile {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth: string;
  ssn: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  previousAddresses?: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    yearsAtAddress?: string;
  }>;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreditReport {
  id: string;
  creditProfileId: string;
  bureau: 'experian' | 'equifax' | 'transunion';
  storagePath: string;
  fileName: string;
  fileSize?: number | null;
  uploadedAt: string;
  parsedAt?: string | null;
  parsingStatus: 'pending' | 'parsing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface CreditLetter {
  id: string;
  creditProfileId: string;
  bureau: 'experian' | 'equifax' | 'transunion';
  letterType: 'sent' | 'received';
  subject?: string | null;
  content?: string | null;
  storagePath?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  status: 'draft' | 'sent' | 'received' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Negative Item Types (matching database enums)
export type NegativeItemType =
  | 'LATE_PAYMENT'
  | 'COLLECTION'
  | 'CHARGE_OFF'
  | 'REPOSSESSION'
  | 'FORECLOSURE'
  | 'BANKRUPTCY'
  | 'PUBLIC_RECORD'
  | 'TAX_LIEN'
  | 'CIVIL_JUDGMENT'
  | 'SETTLEMENT'
  | 'DELINQUENCY'
  | 'DEROGATORY_TRADELINE'
  | 'CLOSED_BY_GRANTOR'
  | 'VOLUNTARY_SURRENDER'
  | 'PAID_CHARGE_OFF'
  | 'PAID_COLLECTION'
  | 'INQUIRY'
  | 'FRAUD_FLAG'
  | 'IDENTITY_FLAG';

export type NegativeItemStatus =
  | 'DEROGATORY'
  | 'ADVERSE'
  | 'NEGATIVE'
  | 'PAST_DUE'
  | 'PAST_DUE_WITH_AMOUNT'
  | 'PAST_DUE_NO_AMOUNT'
  | 'CHARGE_OFF'
  | 'COLLECTION'
  | 'SETTLED'
  | 'SETTLED_LESS_THAN_FULL'
  | 'PAID'
  | 'PAID_IN_FULL'
  | 'PAID_DEROGATORY'
  | 'PAID_COLLECTION'
  | 'PAID_CHARGE_OFF'
  | 'PAID_LATE'
  | 'ACCOUNT_CLOSED'
  | 'CLOSED_BY_GRANTOR'
  | 'REPOSSESSED'
  | 'FORECLOSED'
  | 'BANKRUPTCY_INCLUDED'
  | 'BANKRUPTCY_DISCHARGED'
  | 'BANKRUPTCY_FILED'
  | 'BANKRUPTCY_DISMISSED'
  | 'DISPUTE'
  | 'DISPUTE_RESOLVED'
  | 'CONSUMER_DISAGREES'
  | 'REINVESTIGATION_IN_PROGRESS'
  | 'TRANSFERRED'
  | 'SOLD'
  | 'WRITTEN_OFF'
  | 'PAYMENT_AFTER_CHARGE_OFF'
  | 'PAYMENT_AFTER_COLLECTION'
  | 'DEFAULTED'
  | 'SERIOUSLY_DELINQUENT'
  | 'CHRONICALLY_DELINQUENT';

export type ComplianceViolationType =
  | 'WRONG_DATE_OPENED'
  | 'WRONG_DATE_REPORTED'
  | 'WRONG_LAST_PAYMENT_DATE'
  | 'WRONG_DOB'
  | 'WRONG_DOFD'
  | 'REAGING'
  | 'DUPLICATE_ACCOUNT'
  | 'DUPLICATE_COLLECTION'
  | 'INCORRECT_BALANCE'
  | 'INCORRECT_LIMIT'
  | 'INCORRECT_PAYMENT_HISTORY'
  | 'MISSING_ECOA_CODE'
  | 'MISSING_COMPLIANCE_CODE'
  | 'MIXED_FILE'
  | 'ILLEGAL_REINSERTION'
  | 'REPORTING_AFTER_DISCHARGE'
  | 'ACCOUNT_SHOULD_BE_ZERO_BALANCE'
  | 'PAST_7_YEAR_LIMIT'
  | 'UNVERIFIABLE_INFORMATION'
  | 'NO_PERMISSIBLE_PURPOSE';

export interface NegativeItem {
  id?: string;
  creditProfileId: string;
  bureau: 'experian' | 'equifax' | 'transunion';
  itemType: NegativeItemType;
  itemSubtype?: string | null;
  itemStatus: NegativeItemStatus;
  accountName?: string | null;
  accountNumber?: string | null;
  creditorName?: string | null;
  originalCreditor?: string | null;
  collectionAgency?: string | null;
  dateOpened?: string | null;
  dateReported?: string | null;
  dateOfFirstDelinquency?: string | null;
  dateClosed?: string | null;
  lastPaymentDate?: string | null;
  balanceAmount?: number | null;
  originalAmount?: number | null;
  creditLimit?: number | null;
  monthlyPayment?: number | null;
  isPaid?: boolean;
  isDisputed?: boolean;
  isVerified?: boolean;
  disputeStatus?: string | null;
  complianceViolations?: ComplianceViolationType[];
  violationDetails?: Record<string, any> | null;
  rawText?: string | null;
  pageNumber?: number | null;
  confidenceScore?: number | null;
  parsingMethod?: 'manual' | 'ai' | 'hybrid' | null;
  parsedByUserId?: string | null;
  parsedAt?: string | null;
  reviewStatus?: 'pending' | 'reviewed' | 'disputed' | 'resolved';
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  daysLate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedCreditReport {
  bureau: 'experian' | 'equifax' | 'transunion';
  totalItems: number;
  items: NegativeItem[];
  parsingMethod: 'manual' | 'ai' | 'hybrid';
  parsedAt: string;
}
