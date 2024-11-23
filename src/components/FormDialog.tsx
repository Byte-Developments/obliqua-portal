import Modal from './Modal';

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

function FormDialog({ isOpen, onClose, title, children, maxWidth }: FormDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={maxWidth}>
      {children}
    </Modal>
  );
}

export default FormDialog;