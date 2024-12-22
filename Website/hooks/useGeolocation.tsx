// src/hooks/useGeolocation.tsx
import { useState, useEffect } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    VStack
} from '@chakra-ui/react';

export const RESTRICTED_REGIONS = ['US', 'CN']; // Add your restricted countries


export const RestrictionModal = ({ isOpen, onClose, countryName }) => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Feature Not Available</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="start">
            <Text>
              We apologize, but this feature is not available in your region
              {countryName ? ` (${countryName})` : ''}.
            </Text>
            <Text>
              Due to local regulations, access to this feature is restricted in certain jurisdictions.
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );


interface LocationData {
    country_code: string;
    country_name: string;
    city: string | null;
    region: string | null;
  }
  
  interface GeolocationHookReturn {
    userLocation: LocationData | null;
    isLoading: boolean;
    error: string | null;
    isRestricted: () => boolean;
    isModalOpen: boolean;
    showRestrictionModal: () => void;
    hideRestrictionModal: () => void;
  }
  
  export const useGeolocation = (): GeolocationHookReturn => {
    const [userLocation, setUserLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
  
    useEffect(() => {
      const checkLocation = async (): Promise<void> => {
        try {
          const response = await fetch('/api/geolocation');
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          setUserLocation(data);
        } catch (err) {
          setError('Failed to determine location');
        } finally {
          setIsLoading(false);
        }
      };
  
      void checkLocation();
    }, []);
  
    const isRestricted = (): boolean => {
      if (!userLocation || !userLocation.country_code) return true;
      return RESTRICTED_REGIONS.includes(userLocation.country_code);
    };
  
    return {
      userLocation,
      isLoading,
      error,
      isRestricted,
      isModalOpen: isOpen,
      showRestrictionModal: onOpen,
      hideRestrictionModal: onClose
    };
  };