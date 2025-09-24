// People parsing service for converting Skip Trace API responses into formatted person data

export interface PersonRecord {
  name: string;
  age?: number;
  lives_in?: string;
  used_to_live_in?: string;
  related_to?: string;
  person_link?: string;
  person_id?: string;
  source: string;
}

export interface FormattedPeopleData {
  // Person Records
  people: PersonRecord[];
  
  // Summary counts
  totalRecords: number;
  
  // Raw data
  rawResponse: any;
  source: string;
}

export const peopleParseService = {
  parsePeopleResponse(apiResponse: any): FormattedPeopleData {
    // Extract people from PeopleDetails array
    const people: PersonRecord[] = (apiResponse.PeopleDetails || []).map((person: any) => ({
      name: person.Name || '',
      age: person.Age || undefined,
      lives_in: person["Lives in"] || undefined,
      used_to_live_in: person["Used to live in"] || undefined,
      related_to: person["Related to"] || undefined,
      person_link: person.Link || undefined,
      person_id: person["Person ID"] || undefined,
      source: apiResponse.Source || 'Unknown'
    }));
    
    return {
      // Person Records
      people,
      
      // Summary counts
      totalRecords: people.length,
      
      // Raw data
      rawResponse: apiResponse,
      source: apiResponse.Source || 'Unknown'
    };
  }
};
