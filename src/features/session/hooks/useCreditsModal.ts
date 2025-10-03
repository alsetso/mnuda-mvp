import { useState, useCallback } from 'react';

export function useCreditsModal() {
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const showCreditsModal = useCallback(() => {
    setIsCreditsModalOpen(true);
  }, []);

  const hideCreditsModal = useCallback(() => {
    setIsCreditsModalOpen(false);
  }, []);

  return {
    isCreditsModalOpen,
    showCreditsModal,
    hideCreditsModal,
  };
}

