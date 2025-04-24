import React from 'react';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Modal, Button } from '../ui';
import CreateTribeForm from './CreateTribeForm';

interface CreateTribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  sdk: AstrixSDK | null;
  title?: string;
}

/**
 * A standardized modal for creating tribes that can be reused across the application
 */
const CreateTribeModal: React.FC<CreateTribeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  sdk,
  title = 'Create New Tribe'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="xl"
    >
      <CreateTribeForm
        sdk={sdk}
        onCreated={() => {
          onCreated();
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default CreateTribeModal; 