# Onboarding Map Point Format

## JSONB Structure for `map_point` Field Type

The `onboarding_answers.value` column stores map_point data as JSONB. The format supports both single and multiple locations.

### Single Location Format

For questions that expect a single location (e.g., "What is your primary address?"):

```json
{
  "address": "123 Main St, Minneapolis, MN 55401",
  "lat": 44.9778,
  "lng": -93.2650
}
```

### Multiple Locations Format

For questions that expect multiple locations (e.g., "Where are your properties?" or "Where are your business locations?"):

```json
[
  {
    "address": "123 Main St, Minneapolis, MN 55401",
    "lat": 44.9778,
    "lng": -93.2650
  },
  {
    "address": "456 Oak Ave, St. Paul, MN 55101",
    "lat": 44.9537,
    "lng": -93.0900
  }
]
```

### Determining Single vs Multiple

The question's `options` JSONB field can specify if multiple locations are allowed:

```json
{
  "allowMultiple": true  // If true, store as array; if false/undefined, store as object
}
```

Alternatively, check the question `key`:
- Keys containing "locations", "properties", "businesses" (plural) → multiple
- Keys containing "address", "location", "headquarters" (singular) → single

## Use Cases

### Single Location Questions
- Primary residence address
- Business headquarters
- Main office location

**Example Question:**
```json
{
  "key": "primary_address",
  "label": "What is your primary address?",
  "field_type": "map_point",
  "options": { "allowMultiple": false }
}
```

**Stored Answer:**
```json
{
  "address": "123 Main St, Minneapolis, MN 55401",
  "lat": 44.9778,
  "lng": -93.2650
}
```

### Multiple Location Questions
- Investment properties (investor profile)
- Multiple houses (homeowner with multiple properties)
- Business locations (business owner with multiple locations)
- Service areas (contractor with multiple service locations)

**Example Question:**
```json
{
  "key": "property_locations",
  "label": "Where are your properties located?",
  "field_type": "map_point",
  "options": { "allowMultiple": true }
}
```

**Stored Answer:**
```json
[
  {
    "address": "123 Main St, Minneapolis, MN 55401",
    "lat": 44.9778,
    "lng": -93.2650
  },
  {
    "address": "456 Oak Ave, St. Paul, MN 55101",
    "lat": 44.9537,
    "lng": -93.0900
  }
]
```

**Business Owner Example:**
```json
{
  "key": "business_locations",
  "label": "Where are your business locations?",
  "field_type": "map_point",
  "options": { "allowMultiple": true }
}
```

**Stored Answer:**
```json
[
  {
    "address": "789 Business Blvd, Minneapolis, MN 55402",
    "lat": 44.9780,
    "lng": -93.2700
  },
  {
    "address": "321 Commerce St, Bloomington, MN 55420",
    "lat": 44.8408,
    "lng": -93.2983
  }
]
```

## Implementation Notes

1. **Question Configuration**: The question's `key` and `label` should indicate if multiple locations are expected
   - Single: "primary_address", "business_headquarters"
   - Multiple: "property_locations", "business_locations", "service_locations"

2. **UI Behavior**: 
   - Single location: Show one address search input
   - Multiple locations: Show "Add Location" button, allow adding/removing locations

3. **Pin Creation**: 
   - For single location: Create one pin
   - For multiple locations: Create multiple pins (one per location)

4. **Validation**:
   - Single location: Ensure object has `address`, `lat`, `lng`
   - Multiple locations: Ensure array contains objects with `address`, `lat`, `lng`

## Migration Path

Existing answers stored as strings (just the address) should be migrated to the new format:

```sql
-- Migration example: Convert string addresses to object format
UPDATE onboarding_answers
SET value = jsonb_build_object(
  'address', value::text,
  'lat', NULL,
  'lng', NULL
)
WHERE question_id IN (
  SELECT id FROM onboarding_questions WHERE field_type = 'map_point'
)
AND jsonb_typeof(value) = 'string';
```

## Pin Creation

When a `map_point` question is answered:
- **Single location**: Creates 1 pin with the question label as the name
- **Multiple locations**: Creates multiple pins, each named "{question label} - {address part}"

All pins are created with:
- Emoji: 📍
- Visibility: public
- Description: "Onboarding: {question label}"
- Coordinates: From the stored lat/lng or geocoded from address

