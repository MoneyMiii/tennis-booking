import "./ModalComponent.css";

import React from "react";
import Modal from "react-modal";

import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

import { CarnetReservation } from "../../types/types"; // Assurez-vous que le type est bien importé

interface ModalCarnetProps {
  isOpen: boolean;
  carnetsReservation: CarnetReservation[];
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

const ModalCarnetComponent: React.FC<ModalCarnetProps> = ({
  isOpen,
  carnetsReservation,
  onCancel
}) => {
  const columns: ColumnDef<CarnetReservation>[] = [
    {
      accessorKey: "nom",
      header: "Type de cours"
    },
    {
      accessorKey: "nombreDeCreneaux",
      header: "Nombre d'heure restante"
    }
  ];

  const table = useReactTable({
    data: carnetsReservation,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel} style={modalStyles}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Typography variant="h4">Gérer les carnets de réservation</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            {table
              .getHeaderGroups()
              .map((headerGroup: HeaderGroup<CarnetReservation>) => (
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

          <TableBody>
            {table.getRowModel().rows.map((row: Row<CarnetReservation>) => (
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

export default ModalCarnetComponent;
