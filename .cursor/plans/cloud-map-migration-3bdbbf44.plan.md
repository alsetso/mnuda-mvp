<!-- 3bdbbf44-6db9-474c-988a-e8ddfc7c006a 71bc28fa-e3fd-47dc-abfd-3bd526515907 -->
# Cloud-Based Map with Authentication & localStorage Migration

## Overview

Phase 1 of cloud migration focusing on:

- Mandatory user authentication for map access
- Using existing Supabase tables (map.pins) for data storage
- Complete removal of localStorage
- No new tables or services yet - work with what exists

## Phase 1: Authentication & Route Protection

### Files to Modify

1. **src/app/map/page.tsx**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add auth check at top of component
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Redirect to /login if not authenticated
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Pass user.id to all data operations

2. **src/middleware.ts** (create new)

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Protect /map route
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Verify auth token
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Check credit balance before allowing access

3. **src/app/layout.tsx**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Wrap with AuthProvider
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add credit balance display in header

## Phase 3: Remove localStorage

### Files to Delete/Modify

1. **src/features/session/services/sessionStorage.ts** - REMOVE localStorage logic
2. **src/features/session/services/apiUsageService.ts** - REMOVE localStorage usage tracking
3. **src/features/session/hooks/useSessionManager.ts** - Rewrite to use Supabase

### New Cloud Services to Create

1. **src/features/session/services/supabaseSessionService.ts**
   ```typescript
                                                                                                                                                                                                                                                   - createSession(userId: string, name: string)
                                                                                                                                                                                                                                                   - getSessions(userId: string)
                                                                                                                                                                                                                                                   - getCurrentSession(userId: string)
                                                                                                                                                                                                                                                   - addNode(sessionId: string, nodeData: NodeData)
                                                                                                                                                                                                                                                   - deleteNode(nodeId: string)
   ```

2. **src/features/billing/services/creditService.ts**
   ```typescript
                                                                                                                                                                                                                                                   - checkCredits(userId: string, apiType: ApiType): boolean
                                                                                                                                                                                                                                                   - deductCredits(userId: string, apiType: ApiType, usageEventId: string)
                                                                                                                                                                                                                                                   - getBalance(userId: string): number
                                                                                                                                                                                                                                                   - recordTransaction(userId: string, amount: number, type: string)
   ```

3. **src/features/map/services/cacheService.ts**
   ```typescript
                                                                                                                                                                                                                                                   - cacheHomeData(address: Address, propertyData: unknown)
                                                                                                                                                                                                                                                   - cachePersonData(personId: string, personData: unknown)
                                                                                                                                                                                                                                                   - getHomeFromCache(address: Address)
                                                                                                                                                                                                                                                   - getPersonFromCache(personId: string)
                                                                                                                                                                                                                                                   - linkHomeToPerson(homeId: string, personId: string, relationship: string)
   ```


## Phase 4: Real-Time Billing Integration

### Files to Modify

1. **src/features/api/services/apiService.ts**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Before each API call: Check Supabase credit balance
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - After each API call: Deduct from billing.credit_balance
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Create usage.events record with all context
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Create billing.credit_transactions record
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - If credits insufficient, throw error and show modal

2. **src/app/map/page.tsx**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - handleMapClickWithSession: Add credit check
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - handlePersonTrace: Add credit check
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Show real-time credit balance in UI

3. **src/features/session/contexts/ApiUsageContext.tsx**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Replace localStorage with Supabase queries
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add real-time subscription to credit balance
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Update UI when balance changes

## Phase 5: Data Caching & Optimization

### Implement Smart Caching

1. **Before API Calls**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Check mn_homes_cache for existing property data
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Check mn_people_cache for existing person data
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Only call API if cache miss or stale (>7 days)

2. **After API Calls**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Store response in cache tables
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Link homes to people
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Update relationships
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Increment usage.events with cache_hit: true/false

3. **Admin Dashboard**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - View all cached homes (filterable by city, zip)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - View all cached people (filterable by name, location)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - See relationships and confidence scores
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Export data to CSV

## Phase 6: Map Pin Persistence

### Files to Modify

1. **src/features/map/hooks/useSkipTracePins.ts**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Load pins from map.nodes instead of localStorage
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Real-time subscription to nodes table
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Auto-update when new nodes added

2. **src/app/map/page.tsx**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Save each map click to map.nodes immediately
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Store coordinates using PostGIS GEOGRAPHY type
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Link to usage.events for billing tracking

## Phase 7: Session Management

### Replace localStorage Session System

1. **Create Supabase Functions**
   ```sql
   -- Function to get user's active session
   CREATE FUNCTION get_active_session(user_uuid UUID)
   
   -- Function to create new session
   CREATE FUNCTION create_user_session(user_uuid UUID, session_name TEXT)
   
   -- Function to add node to session
   CREATE FUNCTION add_session_node(session_uuid UUID, node_data JSONB)
   ```

2. **Update React Hooks**

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - useSessionManager: Query Supabase instead of localStorage
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - useApiUsageContext: Real-time credit balance from Supabase
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Add loading states for all queries

## Phase 8: Row Level Security (RLS)

### Security Policies

```sql
-- Users can only access their own sessions
CREATE POLICY sessions_user_policy ON map.sessions
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own nodes
CREATE POLICY nodes_user_policy ON map.nodes
  FOR ALL USING (auth.uid() = user_id);

-- Users can only view their own usage events
CREATE POLICY usage_user_policy ON usage.events
  FOR SELECT USING (auth.uid() = user_id);

-- Cache tables are readable by all authenticated users
CREATE POLICY cache_read_policy ON map.mn_homes_cache
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY cache_read_policy ON map.mn_people_cache
  FOR SELECT TO authenticated USING (true);
```

## Implementation Order

1. Create migration files for all new tables
2. Create Supabase service files
3. Add authentication gate to map page
4. Implement credit checking before API calls
5. Replace localStorage session management with Supabase
6. Implement data caching to mn_homes_cache and mn_people_cache
7. Update all API calls to log to usage.events with full context
8. Test billing deductions in real-time
9. Remove all localStorage references
10. Add admin dashboard for cache management

## Key Benefits

- **Zero Data Loss**: Everything in cloud, accessible from any device
- **Real Billing**: Actual credit deductions tied to user accounts
- **Enterprise Scale**: Cached Minnesota index reduces API costs
- **Admin Control**: Full visibility into user activity and data
- **Audit Trail**: Complete history of all API calls and credit usage
- **Performance**: Smart caching reduces redundant API calls
- **Security**: RLS ensures users only see their own data

### To-dos

- [ ] Create migration files for sessions, nodes, mn_homes_cache, mn_people_cache, enhanced usage tables
- [ ] Add authentication requirement to map page with redirect to login
- [ ] Create supabaseSessionService, creditService, and cacheService
- [ ] Integrate real-time credit checking and deduction in apiService
- [ ] Replace useSessionManager to use Supabase instead of localStorage
- [ ] Implement smart caching to mn_homes_cache and mn_people_cache
- [ ] Update all API calls to log to usage.events with node_id, session_id context
- [ ] Create Row Level Security policies for all tables
- [ ] Remove all localStorage references from codebase
- [ ] Create admin dashboard for cache management and user monitoring