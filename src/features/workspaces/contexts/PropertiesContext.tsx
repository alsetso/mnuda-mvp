"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { propertiesService, Property, CreatePropertyData, UpdatePropertyData } from '../services/propertiesService';

export interface PropertiesContextType {
  // State
  properties: Property[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProperties: (workspaceId: string) => Promise<void>;
  createProperty: (workspaceId: string, data: CreatePropertyData) => Promise<Property>;
  updateProperty: (id: string, data: UpdatePropertyData) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  searchProperties: (workspaceId: string, query: string) => Promise<Property[]>;
  
  // Utilities
  getPropertyById: (id: string) => Property | undefined;
  clearError: () => void;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

interface PropertiesProviderProps {
  children: ReactNode;
}

export function PropertiesProvider({ children }: PropertiesProviderProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (workspaceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertiesService.getProperties(workspaceId);
      setProperties(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties';
      setError(errorMessage);
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProperty = async (workspaceId: string, data: CreatePropertyData): Promise<Property> => {
    try {
      setError(null);
      const newProperty = await propertiesService.createProperty(workspaceId, data);
      setProperties(prev => [newProperty, ...prev]);
      return newProperty;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create property';
      setError(errorMessage);
      throw err;
    }
  };

  const updateProperty = async (id: string, data: UpdatePropertyData): Promise<Property> => {
    try {
      setError(null);
      const updatedProperty = await propertiesService.updateProperty(id, data);
      setProperties(prev => prev.map(prop => prop.id === id ? updatedProperty : prop));
      return updatedProperty;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteProperty = async (id: string): Promise<void> => {
    try {
      setError(null);
      await propertiesService.deleteProperty(id);
      setProperties(prev => prev.filter(prop => prop.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      setError(errorMessage);
      throw err;
    }
  };

  const searchProperties = async (workspaceId: string, query: string): Promise<Property[]> => {
    try {
      setError(null);
      return await propertiesService.searchProperties(workspaceId, query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search properties';
      setError(errorMessage);
      throw err;
    }
  };

  const getPropertyById = (id: string): Property | undefined => {
    return properties.find(prop => prop.id === id);
  };

  const clearError = () => {
    setError(null);
  };

  const value: PropertiesContextType = {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    searchProperties,
    getPropertyById,
    clearError
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
}
