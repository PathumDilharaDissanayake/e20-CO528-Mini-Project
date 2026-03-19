import { useState, useCallback } from 'react';

interface UseImageModalReturn {
  isOpen: boolean;
  selectedImage: string | null;
  openModal: (imageUrl: string) => void;
  closeModal: () => void;
}

export const useImageModal = (): UseImageModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openModal = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  }, []);

  return { isOpen, selectedImage, openModal, closeModal };
};

export default useImageModal;
