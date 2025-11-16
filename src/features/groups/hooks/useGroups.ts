import { useState, useEffect, useCallback } from 'react';
import { GroupService, type Group } from '../services/groupService';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await GroupService.getAllGroups();
      setGroups(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load groups');
      setError(error);
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const refreshGroups = useCallback(() => {
    return loadGroups();
  }, [loadGroups]);

  return {
    groups,
    isLoading,
    error,
    refreshGroups,
  };
}

