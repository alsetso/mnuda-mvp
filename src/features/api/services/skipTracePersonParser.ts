// Parser for Skip Trace Person Details API response
export interface PersonResponse {
  source: string;
  status: number;
  message: string;
  personDetails: PersonDetails[];
  emails: string[];
  phones: PhoneDetails[];
  currentAddresses: Address[];
  previousAddresses: Address[];
  relatives: RelatedPerson[];
  associates: RelatedPerson[];
}

export interface PersonDetails {
  age: string;
  born: string;
  livesIn: string;
  telephone: string;
  personName: string;
}

export interface PhoneDetails {
  provider: string;
  phoneType: string;
  phoneNumber: string;
  lastReported: string;
}

export interface Address {
  county: string;
  postalCode: string;
  addressRegion: string;
  streetAddress: string;
  addressLocality: string;
  dateRange?: string;
  timespan?: string;
}

export interface RelatedPerson {
  name: string;
  age: string;
  personId: string;
  personLink: string;
}

export const skipTracePersonParser = {
  parsePersonResponse(rawResponse: Record<string, unknown>): PersonResponse {
    const response = rawResponse as Record<string, unknown>;
    
    return {
      source:
        typeof (response as { source?: unknown }).source === 'string'
          ? ((response as { source?: unknown }).source as string)
          : String((response as { source?: unknown }).source ?? 'Unknown'),
      status: (() => {
        const v = (response as { status?: unknown }).status;
        if (typeof v === 'number' && !Number.isNaN(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v);
          return Number.isNaN(n) ? 200 : n;
        }
        return 200;
      })(),
      message:
        typeof (response as { message?: unknown }).message === 'string'
          ? ((response as { message?: unknown }).message as string)
          : String((response as { message?: unknown }).message ?? ''),
      personDetails: this.parsePersonDetails(
        (response.personDetails as unknown[]) || (response as Record<string, unknown>).PersonDetails as unknown[] || []
      ),
      emails: this.parseEmails(
        (response.emails as unknown[]) || (response as Record<string, unknown>).Emails as unknown[] || []
      ),
      phones: this.parsePhones(
        (response.phones as unknown[]) || (response as Record<string, unknown>).Phones as unknown[] || []
      ),
      currentAddresses: this.parseAddresses(
        (response.currentAddresses as unknown[]) || (response as Record<string, unknown>).CurrentAddresses as unknown[] || []
      ),
      previousAddresses: this.parseAddresses(
        (response.previousAddresses as unknown[]) || (response as Record<string, unknown>).PreviousAddresses as unknown[] || []
      ),
      relatives: this.parseRelatedPersons(
        (response.relatives as unknown[]) || (response as Record<string, unknown>).Relatives as unknown[] || []
      ),
      associates: this.parseRelatedPersons(
        (response.associates as unknown[]) || (response as Record<string, unknown>).Associates as unknown[] || []
      )
    };
  },

  parsePersonDetails(details: unknown[]): PersonDetails[] {
    return details.map((d) => {
      const detail = (d as Record<string, unknown>) || {};
      const get = (k: string): string => String(detail[k] ?? '');
      return {
        age: get('age') || get('Age'),
        born: get('born') || get('Born'),
        livesIn: get('livesIn') || get('Lives in') || get('lives_in'),
        telephone: get('telephone') || get('Telephone'),
        personName: get('personName') || get('Person_name') || get('person_name')
      };
    });
  },

  parseEmails(emails: unknown[]): string[] {
    return emails.map((email) => String(email)).filter(Boolean);
  },

  parsePhones(phones: unknown[]): PhoneDetails[] {
    return phones.map((p) => {
      const phone = (p as Record<string, unknown>) || {};
      const get = (k: string): string => String(phone[k] ?? '');
      return {
        provider: get('provider') || get('Provider'),
        phoneType: get('phoneType') || get('phone_type') || get('PhoneType'),
        phoneNumber: get('phoneNumber') || get('phone_number') || get('PhoneNumber'),
        lastReported: get('lastReported') || get('last_reported') || get('LastReported')
      };
    });
  },

  parseAddresses(addresses: unknown[]): Address[] {
    return addresses.map((a) => {
      const addr = (a as Record<string, unknown>) || {};
      const get = (k: string): string => String(addr[k] ?? '');
      const getOpt = (k: string): string | undefined =>
        addr[k] !== undefined ? String(addr[k]) : undefined;
      return {
        county: get('county') || get('County'),
        postalCode: get('postalCode') || get('postal_code') || get('PostalCode'),
        addressRegion: get('addressRegion') || get('address_region') || get('AddressRegion'),
        streetAddress: get('streetAddress') || get('street_address') || get('StreetAddress'),
        addressLocality: get('addressLocality') || get('address_locality') || get('AddressLocality'),
        dateRange: getOpt('dateRange') || getOpt('date_range') || getOpt('DateRange'),
        timespan: getOpt('timespan') || getOpt('Timespan')
      };
    });
  },

  parseRelatedPersons(persons: unknown[]): RelatedPerson[] {
    return persons.map((p) => {
      const person = (p as Record<string, unknown>) || {};
      const get = (k: string): string => String(person[k] ?? '');
      return {
        name: get('name') || get('Name'),
        age: get('age') || get('Age'),
        personId: get('personId') || get('Person ID') || get('person_id'),
        personLink: get('personLink') || get('Person Link') || get('person_link')
      };
    });
  }
};
