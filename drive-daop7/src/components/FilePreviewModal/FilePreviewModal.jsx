import React from 'react';
import Modal from '../Modal/Modal';
import FilePreview from '../FilePreview/FilePreview';

const FilePreviewModal = ({ isOpen, onClose, fileUrl, mimeType }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preview File">
      <FilePreview fileUrl={fileUrl} mimeType={mimeType} />
    </Modal>
  );
};


export default FilePreviewModal;


