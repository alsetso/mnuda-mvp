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
        typeof response.Source === 'string' ? response.Source :
        typeof response.source === 'string' ? response.source :
        'Unknown',
      status: (() => {
        const v = response.status;
        if (typeof v === 'number' && !Number.isNaN(v)) return v;
        if (typeof v === 'string') {
          const n = Number(v);
          return Number.isNaN(n) ? 200 : n;
        }
        return 200;
      })(),
      message:
        typeof response.message === 'string' ? response.message :
        typeof response.Message === 'string' ? response.Message :
        '',
      personDetails: this.parsePersonDetails(
        (response['Person Details'] as unknown[]) || 
        (response.PersonDetails as unknown[]) || 
        (response.personDetails as unknown[]) || 
        []
      ),
      emails: this.parseEmails(
        (response['Email Addresses'] as unknown[]) || 
        (response.EmailAddresses as unknown[]) || 
        (response.Emails as unknown[]) || 
        (response.emails as unknown[]) || 
        []
      ),
      phones: this.parsePhones(
        (response['All Phone Details'] as unknown[]) || 
        (response.AllPhoneDetails as unknown[]) || 
        (response.Phones as unknown[]) || 
        (response.phones as unknown[]) || 
        []
      ),
      currentAddresses: this.parseAddresses(
        (response['Current Address Details List'] as unknown[]) || 
        (response.CurrentAddressDetailsList as unknown[]) || 
        (response.CurrentAddresses as unknown[]) || 
        (response.currentAddresses as unknown[]) || 
        []
      ),
      previousAddresses: this.parseAddresses(
        (response['Previous Address Details'] as unknown[]) || 
        (response.PreviousAddressDetails as unknown[]) || 
        (response.PreviousAddresses as unknown[]) || 
        (response.previousAddresses as unknown[]) || 
        []
      ),
      relatives: this.parseRelatedPersons(
        (response['All Relatives'] as unknown[]) || 
        (response.AllRelatives as unknown[]) || 
        (response.Relatives as unknown[]) || 
        (response.relatives as unknown[]) || 
        []
      ),
      associates: this.parseRelatedPersons(
        (response['All Associates'] as unknown[]) || 
        (response.AllAssociates as unknown[]) || 
        (response.Associates as unknown[]) || 
        (response.associates as unknown[]) || 
        []
      )
    };
  },

  parsePersonDetails(details: unknown[]): PersonDetails[] {
    if (!Array.isArray(details)) return [];
    return details.map((d) => {
      const detail = (d as Record<string, unknown>) || {};
      const get = (k: string): string => {
        const val = detail[k];
        return val !== undefined && val !== null ? String(val) : '';
      };
      return {
        age: get('Age') || get('age'),
        born: get('Born') || get('born'),
        livesIn: get('Lives in') || get('livesIn') || get('lives_in'),
        telephone: get('Telephone') || get('telephone'),
        personName: get('Person_name') || get('Person Name') || get('personName') || get('person_name')
      };
    }).filter(d => d.personName || d.age || d.born || d.livesIn || d.telephone);
  },

  parseEmails(emails: unknown[]): string[] {
    if (!Array.isArray(emails)) return [];
    return emails
      .map((email) => typeof email === 'string' ? email : String(email))
      .filter(email => email && email.includes('@'));
  },

  parsePhones(phones: unknown[]): PhoneDetails[] {
    if (!Array.isArray(phones)) return [];
    return phones.map((p) => {
      const phone = (p as Record<string, unknown>) || {};
      const get = (k: string): string => {
        const val = phone[k];
        return val !== undefined && val !== null ? String(val) : '';
      };
      return {
        provider: get('provider') || get('Provider'),
        phoneType: get('phone_type') || get('phoneType') || get('PhoneType'),
        phoneNumber: get('phone_number') || get('phoneNumber') || get('PhoneNumber'),
        lastReported: get('last_reported') || get('lastReported') || get('LastReported')
      };
    }).filter(p => p.phoneNumber);
  },

  parseAddresses(addresses: unknown[]): Address[] {
    if (!Array.isArray(addresses)) return [];
    return addresses.map((a) => {
      const addr = (a as Record<string, unknown>) || {};
      const get = (k: string): string => {
        const val = addr[k];
        return val !== undefined && val !== null ? String(val) : '';
      };
      const getOpt = (k: string): string | undefined => {
        const val = addr[k];
        return val !== undefined && val !== null && val !== '' ? String(val) : undefined;
      };
      return {
        county: get('county') || get('County'),
        postalCode: get('postal_code') || get('postalCode') || get('PostalCode'),
        addressRegion: get('address_region') || get('addressRegion') || get('AddressRegion'),
        streetAddress: get('street_address') || get('streetAddress') || get('StreetAddress'),
        addressLocality: get('address_locality') || get('addressLocality') || get('AddressLocality'),
        dateRange: getOpt('date_range') || getOpt('dateRange') || getOpt('DateRange'),
        timespan: getOpt('timespan') || getOpt('Timespan')
      };
    }).filter(a => a.streetAddress || a.addressLocality);
  },

  parseRelatedPersons(persons: unknown[]): RelatedPerson[] {
    if (!Array.isArray(persons)) return [];
    return persons.map((p) => {
      const person = (p as Record<string, unknown>) || {};
      const get = (k: string): string => {
        const val = person[k];
        return val !== undefined && val !== null ? String(val) : '';
      };
      return {
        name: get('Name') || get('name'),
        age: get('Age') || get('age'),
        personId: get('Person ID') || get('personId') || get('person_id'),
        personLink: get('Person Link') || get('personLink') || get('person_link')
      };
    }).filter(p => p.name);
  }
};
