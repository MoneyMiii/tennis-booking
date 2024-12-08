import React from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@mui/material";

interface ModalErrorProps {
  isOpen: boolean;
  message: string | null;
  onClose: () => void;
}

const ModalErrorComponent: React.FC<ModalErrorProps> = ({
  isOpen,
  message,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        <Typography variant="h6" color="error">
          Erreur
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="textPrimary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalErrorComponent;
