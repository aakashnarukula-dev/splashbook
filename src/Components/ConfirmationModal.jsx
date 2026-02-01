import React from "react";
import "./ConfirmationModal.css"; // Create a CSS file for modal-specific styles if needed.

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: "0px" }}>{message}</p>
        <div className="button-group" style={{ marginTop: "10px" }}>
          <button className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-confirm" onClick={onConfirm}>
            Okay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
