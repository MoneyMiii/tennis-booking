import "./ModalComponent.css";

import React, { useEffect, useState } from "react";
import Modal from "react-modal";

import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import {
  ColumnDef,
  HeaderGroup,
  Row,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";

import { CreditCard } from "../../types/types";

interface ModalCreditCardProps {
  isOpen: boolean;
  creditCards: CreditCard[];
  currentCardId: string | null;
  onAdd: (card: Omit<CreditCard, "id">) => void;
  onEdit: (id: string, card: Omit<CreditCard, "id">) => void;
  onDelete: (id: string) => void;
  onSetCurrentCard: (id: string) => void;
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
    width: "66vw",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 10
  }
};

const ModalCreditCardComponent: React.FC<ModalCreditCardProps> = ({
  isOpen,
  creditCards,
  onAdd,
  onEdit,
  onDelete,
  onSetCurrentCard,
  onCancel
}) => {
  const [editCard, setEditCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditCard(null); // Reset when modal closes
    }
  }, [isOpen]);

  const handleAdd = () => {
    const newCard: Omit<CreditCard, "id"> = {
      name: "",
      number: "",
      expiryMonth: 1,
      expiryYear: new Date().getFullYear(),
      cvc: "",
      isUsed: false
    };
    setEditCard({ ...newCard, id: "" });
  };

  const handleSave = () => {
    if (editCard) {
      const { id, ...cardData } = editCard;
      if (id) {
        onEdit(id, cardData);
      } else {
        onAdd(cardData);
      }
      setEditCard(null);
    }
  };

  const columns: ColumnDef<CreditCard>[] = [
    {
      accessorKey: "name",
      header: "Nom"
    },
    {
      accessorKey: "number",
      header: "Numéro"
    },
    {
      accessorFn: (row: CreditCard) => `${row.expiryMonth}/${row.expiryYear}`,
      header: "Date d'expiration"
    },
    {
      id: "current",
      header: "Utilisée actuellement",
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.original.isUsed}
          onChange={() => onSetCurrentCard(row.original.id)}
        />
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEditCard(row.original)}
          >
            Modifier
          </Button>
          {!row.original.isUsed && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => onDelete(row.original.id)}
            >
              Supprimer
            </Button>
          )}
        </Stack>
      )
    }
  ];

  const table = useReactTable<CreditCard>({
    data: creditCards,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Typography variant="h4">Gérer les cartes de crédit</Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "15px"
        }}
      >
        <Button
          size="small"
          variant="outlined"
          sx={{ marginBottom: "15px" }}
          onClick={handleAdd}
        >
          Ajouter une carte
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          {/* En-tête du tableau */}
          <TableHead>
            {table
              .getHeaderGroups()
              .map((headerGroup: HeaderGroup<CreditCard>) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      align="center"
                      sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableHead>

          {/* Corps du tableau */}
          <TableBody>
            {table.getRowModel().rows.map((row: Row<CreditCard>) => (
              <TableRow
                key={row.id}
                sx={{
                  "&:nth-of-type(odd)": { backgroundColor: "#f9f9f9" },
                  "&:nth-of-type(even)": { backgroundColor: "#ffffff" },
                  "&:hover": { backgroundColor: "#f1f1f1" }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} align="center">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editCard && (
        <Box component="form">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: "10px"
            }}
          >
            <Typography variant="h5" gutterBottom>
              {editCard.id ? "Modifier la carte" : "Ajouter une carte"}
            </Typography>
          </Box>

          <TextField
            label="Nom"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editCard.name}
            onChange={(e) => setEditCard({ ...editCard, name: e.target.value })}
          />

          <TextField
            label="Numéro"
            type="number"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editCard.number}
            onChange={(e) =>
              setEditCard({ ...editCard, number: e.target.value })
            }
          />

          <Stack direction="row" spacing={2} sx={{ marginY: 2 }}>
            <TextField
              label="Mois d'expiration"
              type="number"
              variant="outlined"
              fullWidth
              slotProps={{
                input: {
                  inputProps: {
                    min: 1,
                    max: 12
                  }
                }
              }}
              value={editCard.expiryMonth}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1 && value <= 12) {
                  setEditCard({ ...editCard, expiryMonth: value });
                }
              }}
            />
            <TextField
              label="Année d'expiration"
              type="number"
              variant="outlined"
              fullWidth
              slotProps={{
                input: {
                  inputProps: {
                    min: new Date().getFullYear()
                  }
                }
              }}
              value={editCard.expiryYear}
              onChange={(e) => {
                const currentYear = new Date().getFullYear();
                if (parseInt(e.target.value, 10) >= currentYear) {
                  setEditCard({
                    ...editCard,
                    expiryYear: Number(e.target.value)
                  });
                }
              }}
            />
          </Stack>

          <TextField
            label="CVC"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editCard.cvc}
            onChange={(e) => setEditCard({ ...editCard, cvc: e.target.value })}
          />

          <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
            <Button variant="contained" color="success" onClick={handleSave}>
              Enregistrer
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setEditCard(null)}
            >
              Annuler
            </Button>
          </Stack>
        </Box>
      )}

      <div>
        <Button
          variant="outlined"
          size="small"
          sx={{ marginTop: "15px" }}
          onClick={onCancel}
        >
          Fermer
        </Button>
      </div>
    </Modal>
  );
};

export default ModalCreditCardComponent;
