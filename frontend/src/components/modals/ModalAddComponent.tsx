import React from "react";
import Modal from "react-modal";

import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography
} from "@mui/material";

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

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as "indoor" | "outdoor" | "both";
    onSetCourtType(value);
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <Box sx={{ padding: 2 }}>
        <Typography variant="h5" sx={{ marginBottom: 2, textAlign: "center" }}>
          Sélectionner le type de court
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Choisissez le type de court</FormLabel>
          <RadioGroup
            aria-label="courtType"
            name="courtType"
            value={courtType}
            onChange={handleRadioChange}
          >
            <FormControlLabel
              value="indoor"
              control={<Radio />}
              label="Indoor"
            />
            <FormControlLabel
              value="outdoor"
              control={<Radio />}
              label="Outdoor"
            />
            <FormControlLabel value="both" control={<Radio />} label="Both" />
          </RadioGroup>
        </FormControl>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 3
          }}
        >
          <Button variant="outlined" color="success" onClick={onConfirm}>
            Valider
          </Button>
          <Button variant="outlined" color="error" onClick={onCancel}>
            Annuler
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalAddComponent;
