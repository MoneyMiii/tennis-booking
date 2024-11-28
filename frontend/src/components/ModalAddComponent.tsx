import "./ModalComponent.css";

import React from "react";
import Modal from "react-modal";

interface ModalAddComponentProps {
  isOpen: boolean;
  courtType: "indoor" | "outdoor" | "both" | null;
  selectedSlot: { start: Date; end: Date } | null;
  onConfirm: () => void;
  onCancel: () => void;
  onSetCourtType: (courtType: "indoor" | "outdoor" | "both") => void;
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

const ModalAddComponent: React.FC<ModalAddComponentProps> = ({
  isOpen,
  courtType,
  selectedSlot,
  onConfirm,
  onCancel,
  onSetCourtType
}) => {
  if (!selectedSlot) return null;

  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <h2>Sélectionner le type de court</h2>
      <div>
        <label>
          <input
            type="radio"
            name="courtType"
            value="indoor"
            checked={courtType === "indoor"}
            onChange={() => onSetCourtType("indoor")}
          />
          Indoor
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            name="courtType"
            value="outdoor"
            checked={courtType === "outdoor"}
            onChange={() => onSetCourtType("outdoor")}
          />
          Outdoor
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            name="courtType"
            value="both"
            checked={courtType === "both"}
            onChange={() => onSetCourtType("both")}
          />
          Both
        </label>
      </div>
      <div>
        <button onClick={onConfirm}>Valider</button>
        <button onClick={onCancel}>Annuler</button>
      </div>
    </Modal>
  );
};

export default ModalAddComponent;
