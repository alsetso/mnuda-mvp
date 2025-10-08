'use client';

import { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { PropertyImageCarousel } from './PropertyImageCarousel';
import { ZillowProperty, ZillowApiService } from '@/features/for-sale/services/zillowApiService';
import { useApiUsageContext } from '@/features/session/contexts/ApiUsageContext';
import { useToast } from '@/features/ui/hooks/useToast';
import { apiService } from '@/features/api/services/apiService';
import { useSessionManager } from '@/features/session/hooks/useSessionManager';
import { NodeData } from '@/features/session/services/sessionStorage';
import { NodeStack } from '@/features/nodes';
import { peopleParseService } from '@/features/api/services/peopleParse';
import { personDetailParseService } from '@/features/api/services/personDetailParse';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';

interface PropertyData {
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  zpid?: string;
  [key: string]: unknown;
}

interface PropertyModalProps {
  zpid?: string;
  propertyData?: PropertyData;
  isOpen: boolean;
  onClose: () => void;
}

interface PropertyDetails extends ZillowProperty {
  // Additional detailed fields from the property details API
  description?: string;
  yearBuilt?: number;
  lotSize?: number;
  parking?: string;
  heating?: string;
  cooling?: string;
  hoaFee?: number;
  propertyTax?: number;
  latitude?: number;
  longitude?: number;
  url?: string;
  imageUrls?: string[];
  // Additional fields that might come from the detailed API
  schoolDistrict?: string;
  elementarySchool?: string;
  middleSchool?: string;
  highSchool?: string;
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  neighborhood?: string;
  county?: string;
  zipcode?: string;
  homeType?: string;
  homeStatus?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
    event: string;
  }>;
  taxHistory?: Array<{
    year: number;
    tax: number;
  }>;
}

export function PropertyModal({ zpid, propertyData, isOpen, onClose }: PropertyModalProps) {
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoSkeleton, setShowPhotoSkeleton] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosRetryCount, setPhotosRetryCount] = useState(0);
  const [isTracing, setIsTracing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Hooks for API usage and toast notifications
  const { apiUsage, showCreditsModal, canMakeApiRequest } = useApiUsageContext();
  const { withApiToast } = useToast();
  
  // Session management
  const { addNode, createNewSession } = useSessionManager();
  const [propertySession, setPropertySession] = useState<NodeData[]>([]);
  const [traceSessionId, setTraceSessionId] = useState<string | null>(null);
  const [isTraceResultsExpanded, setIsTraceResultsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basicInfo: true,
    financialInfo: true,
    locationInfo: true,
    attributionInfo: false,
    priceHistory: false,
    taxHistory: false,
    listingDetails: false,
    metadata: false,
  });

  const loadAdditionalPhotos = useCallback(async (zpid: string, retryCount = 0) => {
    const maxRetries = 2;
    const baseDelay = 1000; // 1 second base delay
    
    try {
      setLoadingPhotos(true);
      
      // Add exponential backoff delay for retries
      if (retryCount > 0) {
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        console.log(`Retrying photos API call for ZPID ${zpid}, attempt ${retryCount + 1}, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const additionalPhotos = await ZillowApiService.getPropertyPhotos(zpid);
      
      if (additionalPhotos.length > 0) {
        setProperty(prevProperty => {
          if (prevProperty) {
            // Merge additional photos with existing ones, avoiding duplicates
            const existingUrls = new Set(prevProperty.imageUrls || []);
            const newPhotos = additionalPhotos.filter(url => !existingUrls.has(url));
            
            return {
              ...prevProperty,
              imageUrls: [...(prevProperty.imageUrls || []), ...newPhotos]
            };
          }
          return prevProperty;
        });
        console.log(`Successfully loaded ${additionalPhotos.length} additional photos for ZPID:`, zpid);
      } else {
        console.log('No additional photos found for ZPID:', zpid);
      }
    } catch (err) {
      console.error(`Error loading additional photos for ZPID ${zpid}, attempt ${retryCount + 1}:`, err);
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        console.log(`Retrying photos API call for ZPID ${zpid}, attempt ${retryCount + 2}`);
        setPhotosRetryCount(retryCount + 1);
        return loadAdditionalPhotos(zpid, retryCount + 1);
      } else {
        console.error(`Failed to load photos after ${maxRetries + 1} attempts for ZPID:`, zpid);
        // Don't show error to user for photos, just log it
      }
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  const loadPropertyDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setShowPhotoSkeleton(true);
      setPhotosRetryCount(0);
      
      let fetchedPropertyData;
      
      // If propertyData is provided directly (from address search), use it
      if (propertyData) {
        fetchedPropertyData = propertyData;
      } 
      // Otherwise, fetch by zpid (existing behavior)
      else if (zpid) {
        fetchedPropertyData = await ZillowApiService.getPropertyDetails(zpid);
      } else {
        throw new Error('Either zpid or propertyData must be provided');
      }
      
      if (fetchedPropertyData) {
        setProperty(fetchedPropertyData as PropertyDetails);
        
        // Start skeleton timer for 2 seconds
        const skeletonTimer = setTimeout(() => {
          setShowPhotoSkeleton(false);
        }, 2000);
        
        // Start loading additional photos after 1.5 seconds delay
        const photosTimer = setTimeout(() => {
          const propertyZpid = fetchedPropertyData.zpid || zpid;
          if (propertyZpid) {
            loadAdditionalPhotos(propertyZpid);
          }
        }, 1500);
        
        // Clean up timers if component unmounts
        return () => {
          clearTimeout(skeletonTimer);
          clearTimeout(photosTimer);
        };
      } else {
        setError('Property details not found');
        setShowPhotoSkeleton(false);
      }
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Failed to load property details');
      setShowPhotoSkeleton(false);
    } finally {
      setLoading(false);
    }
  }, [zpid, propertyData, loadAdditionalPhotos]);

  useEffect(() => {
    if (isOpen && (zpid || propertyData)) {
      loadPropertyDetails();
    }
  }, [isOpen, zpid, propertyData, loadPropertyDetails]);

  const handleClose = () => {
    setProperty(null);
    setError(null);
    setShowPhotoSkeleton(false);
    setLoadingPhotos(false);
    setPhotosRetryCount(0);
    setIsTracing(false);
    setPropertySession([]);
    setTraceSessionId(null);
    setIsTraceResultsExpanded(true);
    setIsDropdownOpen(false);
    setExpandedSections({
      basicInfo: true,
      financialInfo: true,
      locationInfo: true,
      attributionInfo: false,
      priceHistory: false,
      taxHistory: false,
      listingDetails: false,
      metadata: false,
    });
    onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  // Handle trace functionality
  const handleTrace = useCallback(async () => {
    if (!property) return;
    
    // Check credits before making API call
    if (!canMakeApiRequest('address')) {
      showCreditsModal();
      return;
    }

    setIsTracing(true);
    try {
      const address = {
        street: typeof property.address === 'string' ? property.address : '',
        city: typeof property.city === 'string' ? property.city : '',
        state: typeof property.state === 'string' ? property.state : '',
        zip: typeof property.zipcode === 'string' ? property.zipcode : ''
      };

      // Create a new session for this property trace
      const sessionName = `Property Trace - ${address.street}`;
      const newSession = createNewSession(sessionName);
      
      // Store the session ID for display
      setTraceSessionId(newSession.id);
      
      // First, create a Zillow property node from the existing property data
      const propertyNode: NodeData = {
        id: `property-${Date.now()}`,
        type: 'api-result',
        address: address,
        apiName: 'Zillow Search',
        response: property, // Use the existing property data as the API response
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
      };

      // Add the property node to the session
      addNode(propertyNode);
      
      // Call the Skip Trace API directly
      const response = await withApiToast(
        'Address Trace',
        () => apiService.callSkipTraceAPI(address),
        {
          loadingMessage: `Tracing address: ${address.street}, ${address.city}, ${address.state} ${address.zip}`,
          successMessage: 'Address trace completed successfully',
          errorMessage: 'Failed to trace address'
        }
      );

      // Create the trace result node
      const traceNode: NodeData = {
        id: `trace-${Date.now()}`,
        type: 'api-result',
        address: address,
        apiName: 'Skip Trace',
        response: response,
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
      };

      // Add the trace node to the session
      addNode(traceNode);
      
      // Update local property session state
      setPropertySession(prev => [...prev, propertyNode, traceNode]);
      
    } catch (error) {
      console.error('Trace error:', error);
    } finally {
      setIsTracing(false);
    }
  }, [property, canMakeApiRequest, showCreditsModal, withApiToast, createNewSession, addNode]);

  // Handle person trace from the trace results
  const handlePersonTrace = useCallback(async (personId: string, personData: unknown, apiName: string, parentNodeId?: string, entityId?: string, entityData?: unknown) => {
    // If personData is already provided (from EntityModal), use it instead of making another API call
    if (personData) {
      try {
        // Parse the existing response using the person detail parser
        const parsedData = personDetailParseService.parsePersonDetailResponse(personData as Record<string, unknown>, parentNodeId || 'property-trace');
        
        const node: NodeData = {
          id: `person-${Date.now()}`,
          type: 'people-result',
          personId: personId,
          personData: parsedData,
          apiName: apiName,
          timestamp: Date.now(),
          mnNodeId: MnudaIdService.generateTypedId('node'),
          parentNodeId: parentNodeId,
          clickedEntityId: entityId,
          clickedEntityData: entityData,
        };
        
        addNode(node);
        setPropertySession(prev => [...prev, node]);
        return;
      } catch (err) {
        console.error('Error parsing existing person data:', err);
        // Fall through to make a new API call if parsing fails
      }
    }

    // Only make API call if no personData was provided or parsing failed
    // Check credits before making API call
    if (!canMakeApiRequest('person-id')) {
      showCreditsModal();
      return;
    }

    try {
      const resp = await withApiToast(
        'Person Trace',
        () => apiService.callPersonAPI(personId),
        {
          loadingMessage: `Tracing person: ${personId}`,
          successMessage: 'Person details retrieved successfully',
          errorMessage: 'Failed to retrieve person details',
        }
      );
      
      // Parse the response using the person detail parser
      const parsedData = personDetailParseService.parsePersonDetailResponse(resp as Record<string, unknown>, parentNodeId || 'property-trace');
      
      const node: NodeData = {
        id: `person-${Date.now()}`,
        type: 'people-result',
        personId: personId,
        personData: parsedData,
        apiName: apiName,
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
        parentNodeId: parentNodeId,
        clickedEntityId: entityId,
        clickedEntityData: entityData,
      };
      
      addNode(node);
      setPropertySession(prev => [...prev, node]);
    } catch (err) {
      console.error('Person trace error:', err);
    }
  }, [canMakeApiRequest, showCreditsModal, withApiToast, addNode]);

  const formatPrice = useCallback((price: number) => {
    return ZillowApiService.formatPrice(price);
  }, []);

  const formatSquareFeet = useCallback((sqft: number) => {
    return ZillowApiService.formatSquareFeet(sqft);
  }, []);

  const formatLotSize = useCallback((lotSize: number) => {
    return ZillowApiService.formatLotSize(lotSize);
  }, []);

  // Export property as PDF
  const exportToPDF = useCallback(async () => {
    if (!property) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Property Address
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const address = typeof property.address === 'string' ? property.address : 'Address not available';
    doc.text(address, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // City, State, ZIP
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const location = `${typeof property.city === 'string' ? property.city : 'City'}, ${typeof property.state === 'string' ? property.state : 'State'} ${typeof property.zipcode === 'string' ? property.zipcode : ''}`;
    doc.text(location, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Price
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(property.price), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Property Image (first image if available)
    if (property.imageUrls && property.imageUrls.length > 0) {
      try {
        // Add image placeholder or note
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Property Image:', 20, yPosition);
        yPosition += 8;
        
        // Add a placeholder box for the image
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition, pageWidth - 40, 60, 'FD');
        
        // Add text inside the box
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Property image available at:', 25, yPosition + 15);
        doc.text(property.imageUrls[0], 25, yPosition + 25);
        doc.text('(View full image on Zillow)', 25, yPosition + 35);
        
        // Add note about additional images
        if (property.imageUrls.length > 1) {
          doc.text(`+ ${property.imageUrls.length - 1} more images available`, 25, yPosition + 45);
        }
        
        yPosition += 80;
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        // Continue without image if there's an error
      }
    }

    // Status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.text(`Status: ${property.status?.toUpperCase() || 'N/A'}`, 20, yPosition);
    if (property.daysOnZillow > 0) {
      doc.text(`${property.daysOnZillow} Days on Market`, pageWidth - 20, yPosition, { align: 'right' });
    }
    yPosition += 20;

    // Property Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Details', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const details = [
      property.bedrooms > 0 ? `Bedrooms: ${property.bedrooms}` : null,
      property.bathrooms > 0 ? `Bathrooms: ${property.bathrooms}` : null,
      property.squareFeet > 0 ? `Square Feet: ${formatSquareFeet(property.squareFeet)}` : null,
      property.lotSize > 0 ? `Lot Size: ${formatLotSize(property.lotSize)}` : null,
      property.yearBuilt ? `Year Built: ${property.yearBuilt}` : null,
      property.propertyType ? `Property Type: ${property.propertyType}` : null,
    ].filter(Boolean);

    details.forEach((detail) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(detail || '', 20, yPosition);
      yPosition += 8;
    });

    // Financial Information
    if (property.hoaFee || property.propertyTax) {
      yPosition += 10;
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Information', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (property.hoaFee && property.hoaFee > 0) {
        doc.text(`HOA Fee: $${property.hoaFee.toLocaleString()}/mo`, 20, yPosition);
        yPosition += 8;
      }
      if (property.propertyTax && property.propertyTax > 0) {
        doc.text(`Property Tax: $${property.propertyTax.toLocaleString()}/yr`, 20, yPosition);
        yPosition += 8;
      }
    }

    // Description
    if (property.description) {
      yPosition += 10;
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Split description into lines that fit the page width
      const maxWidth = pageWidth - 40;
      const descriptionLines = doc.splitTextToSize(property.description, maxWidth);
      
      descriptionLines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by MNUDA - Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    // Download the PDF
    const fileName = `${address.replace(/[^a-zA-Z0-9]/g, '_')}_Property_Report.pdf`;
    doc.save(fileName);
  }, [property, formatPrice, formatSquareFeet, formatLotSize]);

  // Parse Zillow property data into entities
  const parseZillowPropertyEntities = useCallback((propertyData: PropertyDetails, parentNodeId: string) => {
    const entities: Array<{
      type: string;
      address?: string;
      city?: string;
      state?: string;
      zipcode?: string;
      zpid?: string;
      [key: string]: unknown;
    }> = [];
    
    // Property entity
    entities.push({
      type: 'property',
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zip: propertyData.zipcode,
      beds: propertyData.bedrooms,
      baths: propertyData.bathrooms,
      sqft: propertyData.squareFeet,
      lot_size: propertyData.lotSize,
      year_built: propertyData.yearBuilt,
      property_type: propertyData.propertyType,
      price: propertyData.price,
      source: 'Zillow',
      parentNodeId: parentNodeId,
      isTraceable: false,
      mnEntityId: MnudaIdService.generateEntityId({
        type: 'property',
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zip: propertyData.zipcode
      }, parentNodeId)
    });

    // Address entity
    if (propertyData.address) {
      entities.push({
        type: 'address',
        category: 'property',
        street: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        postal: propertyData.zipcode,
        coordinates: propertyData.latitude && propertyData.longitude ? {
          latitude: propertyData.latitude,
          longitude: propertyData.longitude
        } : undefined,
        source: 'Zillow',
        parentNodeId: parentNodeId,
        isTraceable: true, // Addresses can be traced
        mnEntityId: MnudaIdService.generateEntityId({
          type: 'address',
          street: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          postal: propertyData.zipcode,
          category: 'property'
        }, parentNodeId)
      });
    }

    // Image entities
    if (propertyData.imageUrls && propertyData.imageUrls.length > 0) {
      propertyData.imageUrls.forEach((url, index) => {
        entities.push({
          type: 'image',
          category: 'property_photo',
          url: url,
          caption: `Property Photo ${index + 1}`,
          order: index,
          source: 'Zillow',
          parentNodeId: parentNodeId,
          isTraceable: false,
          mnEntityId: MnudaIdService.generateEntityId({
            type: 'image',
            url: url,
            category: 'property_photo',
            order: index
          }, parentNodeId)
        });
      });
    }

    return {
      entities,
      totalEntities: entities.length,
      entityCounts: {
        properties: entities.filter(e => e.type === 'property').length,
        addresses: entities.filter(e => e.type === 'address').length,
        images: entities.filter(e => e.type === 'image').length,
        phones: 0,
        emails: 0,
        persons: 0
      }
    };
  }, []);

  // Calculate entity count from nodes - count ALL entities with mnEntityId
  const getEntityCount = useCallback((nodes: NodeData[]) => {
    let entityCount = 0;
    nodes.forEach(node => {
      if (node.type === 'api-result' && node.response) {
        // For Skip Trace results, count the people found
        if (node.apiName === 'Skip Trace') {
          try {
            const peopleData = peopleParseService.parsePeopleResponse(
              node.response as Record<string, unknown>, 
              node.mnNodeId || 'unknown'
            );
            entityCount += peopleData?.totalRecords || 0;
          } catch (error) {
            console.error('Error parsing people data for entity count:', error);
          }
        }
        // For Zillow results, count property entities
        else if (node.apiName === 'Zillow Search') {
          try {
            const propertyData = node.response as PropertyDetails;
            const parsedData = parseZillowPropertyEntities(propertyData, node.mnNodeId || 'unknown');
            entityCount += parsedData.totalEntities || 0;
          } catch (error) {
            console.error('Error parsing Zillow property data for entity count:', error);
            // Fallback: count as 1 entity
            entityCount += 1;
          }
        }
      } else if (node.type === 'people-result' && node.personData) {
        // For person detail nodes, count all entities from the parsed data
        try {
          // Check if personData is already parsed (has entities array)
          if (node.personData && typeof node.personData === 'object' && 'entities' in node.personData) {
            const parsedData = node.personData as Record<string, unknown>;
            entityCount += parsedData.totalEntities || 0;
          } else {
            // If not parsed, try to parse it
            const parsedData = personDetailParseService.parsePersonDetailResponse(
              node.personData as Record<string, unknown>, 
              node.mnNodeId || 'unknown'
            );
            entityCount += parsedData.totalEntities || 0;
          }
        } catch (error) {
          console.error('Error parsing person detail data for entity count:', error);
          // Fallback: count as 1 entity
          entityCount += 1;
        }
      }
    });
    return entityCount;
  }, [parseZillowPropertyEntities]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative h-screen w-full max-w-4xl mx-auto bg-white overflow-y-auto flex flex-col rounded-none md:rounded-lg">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-3 shadow-md">
          <div className="flex items-center">
            {/* Left Section - Back button (fixed width) */}
            <div className="w-1/3 flex justify-start">
              <button onClick={handleClose} className="flex items-center text-sm font-medium text-blue-200 hover:text-white transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to results
              </button>
            </div>

            {/* Center Section - MNUDA Logo (fixed width, centered) */}
            <div className="w-1/3 flex justify-center">
              <span className="text-xl font-bold">MNUDA</span>
            </div>

            {/* Right Section - Credits and Actions (fixed width) */}
            <div className="w-1/3 flex justify-end items-center space-x-2">
              {/* User Credits Display - Plain Text */}
              {apiUsage && (
                <div className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                  apiUsage.hasUnlimitedCredits 
                    ? 'text-green-200' 
                    : apiUsage.creditsRemaining && apiUsage.creditsRemaining <= 1
                    ? 'text-red-200'
                    : apiUsage.creditsRemaining && apiUsage.creditsRemaining <= 3
                    ? 'text-yellow-200'
                    : 'text-blue-200'
                }`}>
                  Credits: {apiUsage.hasUnlimitedCredits ? '∞' : apiUsage.creditsRemaining}
                </div>
              )}
              
              {/* Three-dot dropdown menu */}
              {property && (
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center justify-center w-8 h-8 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        {/* Download PDF */}
                        <button
                          onClick={() => {
                            exportToPDF();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </button>
                        
                        {/* View on Zillow */}
                        {property?.url && (
                          <a
                            href={property.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on Zillow
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-64 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading property</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadPropertyDetails}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
              >
                Try Again
              </button>
            </div>
          ) : property ? (
            <div className="p-6">
              {/* Property Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPrice(property.price)}
                    </h1>
                    <h2 className="text-xl text-gray-700 mb-1">
                      {typeof property.address === 'string' ? property.address : 'Address not available'}
                    </h2>
                    <p className="text-gray-500">
                      {typeof property.city === 'string' ? property.city : 'City'}, {typeof property.state === 'string' ? property.state : 'State'} {typeof property.zipcode === 'string' ? property.zipcode : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      {property.status?.toUpperCase()}
                    </span>
                    {property.daysOnZillow > 0 && (
                      <span className="text-sm font-medium text-gray-600">
                        {property.daysOnZillow} DAYS ON MARKET
                      </span>
                    )}
                  </div>
                </div>
                
              </div>

              {/* Trace Results Section */}
              {propertySession.length > 0 && (
                <div className="mb-6 w-full">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg">
                    {/* Accordion Header */}
                    <button
                      onClick={() => setIsTraceResultsExpanded(!isTraceResultsExpanded)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">Trace Results</h3>
                          {traceSessionId && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                              Session: {traceSessionId.slice(-8)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                              {propertySession.length} node{propertySession.length !== 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {getEntityCount(propertySession)} entit{getEntityCount(propertySession) !== 1 ? 'ies' : 'y'}
                            </span>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${isTraceResultsExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    {/* Accordion Content */}
                    {isTraceResultsExpanded && (
                      <div className="border-t border-gray-200">
                        <div className="max-h-96 overflow-y-auto p-4">
                          <NodeStack
                            nodes={propertySession}
                            onPersonTrace={handlePersonTrace}
                            onDeleteNode={(nodeId) => {
                              setPropertySession(prev => prev.filter(node => node.id !== nodeId));
                            }}
                            onAddNode={(node) => {
                              setPropertySession(prev => [...prev, node]);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Images */}
              {showPhotoSkeleton ? (
                /* Photo Skeleton Loading */
                <div className="mb-6">
                  <div className="relative h-64 md:h-80 rounded-lg overflow-hidden bg-gray-200 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 animate-pulse"></div>
                        <div className="h-4 bg-gray-300 rounded w-32 mx-auto animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <PropertyImageCarousel
                    images={property.imageUrls || []}
                    alt={typeof property.address === 'string' ? property.address : 'Property'}
                  />
                </div>
              )}

              {/* Listing Details */}
              {property.listingSubType && (
                <div className="mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('listingDetails')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Listing Details</h3>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.listingDetails ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {expandedSections.listingDetails && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(property.listingSubType).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm text-gray-700">{key.replace('is_', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Details Accordion */}
              <div className="space-y-4 mb-6">
                {/* Basic Property Information */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('basicInfo')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Basic Property Information</h3>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.basicInfo ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedSections.basicInfo && (
                    <div className="border-t border-gray-200">
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            {property.bedrooms > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bedrooms</span>
                                <span className="font-medium">{property.bedrooms}</span>
                              </div>
                            )}
                            {property.bathrooms > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bathrooms</span>
                                <span className="font-medium">{property.bathrooms}</span>
                              </div>
                            )}
                            {property.squareFeet > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Square Feet</span>
                                <span className="font-medium">{formatSquareFeet(property.squareFeet)}</span>
                              </div>
                            )}
                            {property.lotSize > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Lot Size</span>
                                <span className="font-medium">{formatLotSize(property.lotSize)}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            {property.yearBuilt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Year Built</span>
                                <span className="font-medium">{property.yearBuilt}</span>
                              </div>
                            )}
                            {property.propertyType && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Property Type</span>
                                <span className="font-medium">{property.propertyType}</span>
                              </div>
                            )}
                            {property.homeType && property.homeType !== property.propertyType && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Home Type</span>
                                <span className="font-medium">{property.homeType}</span>
                              </div>
                            )}
                            {property.homeStatus && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Home Status</span>
                                <span className="font-medium">{property.homeStatus}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Financial Information */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('financialInfo')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.financialInfo ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedSections.financialInfo && (
                    <div className="border-t border-gray-200">
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price</span>
                              <span className="font-medium">{formatPrice(property.price)}</span>
                            </div>
                            {property.currency && property.currency !== 'USD' && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Currency</span>
                                <span className="font-medium">{property.currency}</span>
                              </div>
                            )}
                            {property.hoaFee && property.hoaFee > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">HOA Fee</span>
                                <span className="font-medium">${property.hoaFee.toLocaleString()}/mo</span>
                              </div>
                            )}
                            {property.propertyTax && property.propertyTax > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Property Tax</span>
                                <span className="font-medium">${property.propertyTax.toLocaleString()}/yr</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            {property.heating && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Heating</span>
                                <span className="font-medium">{property.heating}</span>
                              </div>
                            )}
                            {property.cooling && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cooling</span>
                                <span className="font-medium">{property.cooling}</span>
                              </div>
                            )}
                            {property.parking && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Parking</span>
                                <span className="font-medium">{property.parking}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('locationInfo')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.locationInfo ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedSections.locationInfo && (
                    <div className="border-t border-gray-200">
                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address</span>
                            <span className="font-medium text-right max-w-xs">{property.address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">City</span>
                            <span className="font-medium">{property.city}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">State</span>
                            <span className="font-medium">{property.state}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ZIP Code</span>
                            <span className="font-medium">{property.zipcode}</span>
                          </div>
                          {property.county && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">County</span>
                              <span className="font-medium">{property.county}</span>
                            </div>
                          )}
                          {(property.latitude && property.longitude) && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Coordinates</span>
                              <span className="font-medium text-sm">{property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}</span>
                            </div>
                          )}
                          {(property.latitude && property.longitude) && (
                            <div className="pt-2">
                              <a
                                href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-800 hover:text-blue-900"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                View on Google Maps
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attribution Information */}
                {property.attributionInfo && (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('attributionInfo')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Agent & Listing Information</h3>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.attributionInfo ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {expandedSections.attributionInfo && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              {property.attributionInfo.agentName && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Agent Name</span>
                                  <span className="font-medium">{property.attributionInfo.agentName}</span>
                                </div>
                              )}
                              {property.attributionInfo.agentPhoneNumber && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Agent Phone</span>
                                  <span className="font-medium">{property.attributionInfo.agentPhoneNumber}</span>
                                </div>
                              )}
                              {property.attributionInfo.agentEmail && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Agent Email</span>
                                  <span className="font-medium text-sm">{property.attributionInfo.agentEmail}</span>
                                </div>
                              )}
                              {property.attributionInfo.brokerName && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Broker Name</span>
                                  <span className="font-medium">{property.attributionInfo.brokerName}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-3">
                              {property.attributionInfo.mlsId && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">MLS ID</span>
                                  <span className="font-medium">{property.attributionInfo.mlsId}</span>
                                </div>
                              )}
                              {property.attributionInfo.mlsName && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">MLS Name</span>
                                  <span className="font-medium">{property.attributionInfo.mlsName}</span>
                                </div>
                              )}
                              {property.attributionInfo.lastUpdated && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Last Updated</span>
                                  <span className="font-medium text-sm">{property.attributionInfo.lastUpdated}</span>
                                </div>
                              )}
                              {property.attributionInfo.trueStatus && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">True Status</span>
                                  <span className="font-medium">{property.attributionInfo.trueStatus}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price History */}
                {property.priceHistory && property.priceHistory.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('priceHistory')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {property.priceHistory.length} entries
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.priceHistory ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    {expandedSections.priceHistory && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <div className="space-y-3">
                            {property.priceHistory.map((entry, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                <div>
                                  <div className="font-medium">{formatPrice(entry.price)}</div>
                                  <div className="text-sm text-gray-600">{entry.event}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">{entry.date}</div>
                                  <div className="text-xs text-gray-400">{entry.source}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tax History */}
                {property.taxHistory && property.taxHistory.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('taxHistory')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Tax History</h3>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {property.taxHistory.length} entries
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.taxHistory ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    {expandedSections.taxHistory && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <div className="space-y-3">
                            {property.taxHistory.map((entry, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                <div>
                                  <div className="font-medium">Year {entry.year}</div>
                                  {entry.assessment && (
                                    <div className="text-sm text-gray-600">Assessment: {formatPrice(entry.assessment)}</div>
                                  )}
                                </div>
                                <div className="text-right">
                                  {entry.taxPaid && (
                                    <div className="font-medium">{formatPrice(entry.taxPaid)}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* Metadata */}
                {property.metadata && (
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('metadata')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.metadata ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {expandedSections.metadata && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Can Show Price History</span>
                              <span className={`font-medium ${property.metadata.canShowPriceHistory ? 'text-green-600' : 'text-red-600'}`}>
                                {property.metadata.canShowPriceHistory ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Can Show Tax History</span>
                              <span className={`font-medium ${property.metadata.canShowTaxHistory ? 'text-green-600' : 'text-red-600'}`}>
                                {property.metadata.canShowTaxHistory ? 'Yes' : 'No'}
                              </span>
                            </div>
                            {property.metadata.listingStatus && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Listing Status</span>
                                <span className="font-medium">{property.metadata.listingStatus}</span>
                              </div>
                            )}
                            {property.metadata.propertyStatus && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Property Status</span>
                                <span className="font-medium">{property.metadata.propertyStatus}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Zillow Owned</span>
                              <span className={`font-medium ${property.metadata.isZillowOwned ? 'text-blue-600' : 'text-gray-600'}`}>
                                {property.metadata.isZillowOwned ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>

        {/* Sticky Footer with Action Buttons */}
        {property && (
          <div className="flex-shrink-0 border-t bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Property ID: {zpid}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Trace Button */}
                <button
                  onClick={handleTrace}
                  disabled={isTracing || !property}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTracing ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Tracing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Trace Address
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
