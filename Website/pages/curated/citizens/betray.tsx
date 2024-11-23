import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody } from '@chakra-ui/react';
import Image from 'next/image';
import { Loader2Icon } from 'lucide-react';
import { AssetWithMetadata } from '@/pages/collection/[pageName]';

interface BetrayalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mercenary: AssetWithMetadata
  isLoading?: boolean;
}

const BetrayalModal = ({ isOpen, onClose, onConfirm, mercenary, isLoading = false }: BetrayalModalProps) => {
    if (!mercenary) return null;

    const name = mercenary.metadata["name"];
    const firstName = name.split(' ')[0];
    let wealth = "";
    let attributes = mercenary.asset.attributes.attributeList
    for (let i = 0; i < attributes.length; i++) {
        if (attributes[i].key === "Wealth") {
            wealth = attributes[i].value;
        }
    }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered 
      motionPreset="none" 
      size="lg"
    >
      <ModalOverlay className="backdrop-blur-sm" />
      <ModalContent className="bg-transparent">
        <ModalBody className="overflow-visible p-0">
          <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
            {/* Header Image */}
            <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
              <Image
                src="/curatedLaunches/citizens/betray.png"
                layout="fill"
                style={{ objectFit: 'cover' }}
                alt="Betrayal"
                className="opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
            </div>

            {/* Warning Text */}
            <div className="space-y-4 text-center">
              <h2 className="font-serif text-2xl text-[#FF6B6B]">Confirm Betrayal</h2>
              <p className="text-[#C4A484]">
                Are you sure you want to betray {name}? 
              </p>
              <p className="text-sm text-[#8B7355]">
                You will receive {wealth} marks, but {firstName} will be lost to you forever.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-6 py-3 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 transform rounded-lg border-2 border-[#8B1818] bg-gradient-to-b from-[#A13333] to-[#8B1818] px-6 py-3 font-bold text-[#FFD7D7] transition-all hover:from-[#CC4444] hover:to-[#A13333] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2Icon className="mx-auto animate-spin" />
                ) : (
                  "Confirm Betrayal"
                )}
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BetrayalModal;