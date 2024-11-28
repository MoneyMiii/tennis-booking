import "./ModalComponent.css";

import React from "react";
import Modal from "react-modal";

interface ModalErrorProps {
  isOpen: boolean;
  message: string | null;
  onClose: () => void;
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
    backgroundColor: "red",
    color: "white",
    borderRadius: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 20
  }
};

const ModalErrorComponent: React.FC<ModalErrorProps> = ({
  isOpen,
  message,
  onClose
}) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={modalStyles}>
      <h2>Erreur</h2>
      <p>{message}</p>
      <button onClick={onClose}>Fermer</button>
    </Modal>
  );
};

export default ModalErrorComponent;
