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

import { Account } from "../../types/types";

interface ModalAccountProps {
  isOpen: boolean;
  accounts: Account[];
  currentAccountId: string | null;
  onAdd: (account: Omit<Account, "id">) => void;
  onEdit: (id: string, account: Omit<Account, "id">) => void;
  onDelete: (id: string) => void;
  onSetCurrentAccount: (id: string) => void;
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

const ModalAccountComponent: React.FC<ModalAccountProps> = ({
  isOpen,
  accounts,
  onAdd,
  onEdit,
  onDelete,
  onSetCurrentAccount,
  onCancel
}) => {
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEditAccount(null); // Reset when modal closes
    }
  }, [isOpen]);

  const handleAdd = () => {
    const newAccount: Omit<Account, "id"> = {
      email: "",
      password: "",
      isUsed: false
    };
    setEditAccount({ ...newAccount, id: "" });
  };

  const handleSave = () => {
    if (editAccount) {
      const { id, ...accountData } = editAccount;
      if (id) {
        onEdit(id, accountData);
      } else {
        onAdd(accountData);
      }
      setEditAccount(null);
    }
  };

  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: "email",
      header: "Nom"
    },
    {
      accessorKey: "password",
      header: "Mot de passe"
    },
    {
      id: "current",
      header: "Utilisée actuellement",
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.original.isUsed}
          onChange={() => onSetCurrentAccount(row.original.id)}
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
            onClick={() => setEditAccount(row.original)}
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

  const table = useReactTable<Account>({
    data: accounts,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Typography variant="h4">Gérer les comptes</Typography>
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
          Ajouter un compte
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          {/* En-tête du tableau */}
          <TableHead>
            {table
              .getHeaderGroups()
              .map((headerGroup: HeaderGroup<Account>) => (
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
            {table.getRowModel().rows.map((row: Row<Account>) => (
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

      {editAccount && (
        <Box component="form">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: "10px"
            }}
          >
            <Typography variant="h5" gutterBottom>
              {editAccount.id ? "Modifier le compte" : "Ajouter un compte"}
            </Typography>
          </Box>

          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editAccount.email}
            onChange={(e) =>
              setEditAccount({ ...editAccount, email: e.target.value })
            }
          />

          <TextField
            label="Mot de passe"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editAccount.password}
            onChange={(e) =>
              setEditAccount({ ...editAccount, password: e.target.value })
            }
          />

          <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
            <Button variant="contained" color="success" onClick={handleSave}>
              Enregistrer
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setEditAccount(null)}
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

export default ModalAccountComponent;
