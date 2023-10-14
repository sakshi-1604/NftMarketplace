import React from 'react';
import './modal.css'; // Import your modal CSS for styling
import ContractInteraction from './FileUpload'; // Import your AssetIssuanceForm component

const Modal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>
          Close
        </button>
        <ContractInteraction />
      </div>
    </div>
  );
};

export default Modal;
