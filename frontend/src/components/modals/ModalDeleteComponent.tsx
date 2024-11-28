import "./ModalComponent.css";

import React from "react";
import Modal from "react-modal";

interface ModalDeleteComponentProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "300px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 10
  }
};

const ModalDeleteComponent: React.FC<ModalDeleteComponentProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <h2>Supprimer ce créneau ?</h2>
      <div>
        <button onClick={onConfirm}>Confirmer</button>
        <button onClick={onCancel}>Annuler</button>
      </div>
    </Modal>
  );
};

export default ModalDeleteComponent;
