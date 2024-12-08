import "./ModalComponent.css";

import React from "react";
import Modal from "react-modal";

import { Button, Stack, Typography } from "@mui/material";

import { Slot } from "../../types/types";

interface ModalDeleteComponentProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  slotToDelete: Slot | null;
}

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "30vw",
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
  onCancel,
  slotToDelete
}) => {
  console.log(slotToDelete);
  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <Typography variant="h5" sx={{ marginBottom: 2, textAlign: "center" }}>
        Voulez vous supprimer le créneau du {slotToDelete?.date} de{" "}
        {slotToDelete?.start}h à {slotToDelete?.end}h.
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "center", marginTop: 2 }}
      >
        <Button variant="outlined" color="success" onClick={onConfirm}>
          Confirmer
        </Button>
        <Button variant="outlined" color="error" onClick={onCancel}>
          Annuler
        </Button>
      </Stack>
    </Modal>
  );
};

export default ModalDeleteComponent;
