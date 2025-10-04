import { useState, useCallback } from 'react';
import { PropertyDetails, PropertyPerson, PropertyPanelState, PropertyPanelActions } from '../types';

export const usePropertyPanel = (): PropertyPanelState & PropertyPanelActions => {
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showProperty = useCallback((propertyData: PropertyDetails) => {
    setProperty(propertyData);
    setIsVisible(true);
  }, []);

  const hideProperty = useCallback(() => {
    setIsVisible(false);
    // Keep property data for a moment to allow smooth transition
    setTimeout(() => {
      setProperty(null);
    }, 300);
  }, []);

  const onPersonClick = useCallback((person: PropertyPerson) => {
    // This will be handled by the parent component
    // The hook just provides the callback structure
    console.log('Person clicked:', person);
  }, []);

  return {
    property,
    isVisible,
    showProperty,
    hideProperty,
    onPersonClick
  };
};
