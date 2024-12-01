import "./ModalComponent.css";

import React, { useEffect, useState } from "react";
import Modal from "react-modal";

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
    width: "600px",
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
        <div>
          <button onClick={() => setEditCard(row.original)}>Modifier</button>
          {!row.original.isUsed && (
            <button onClick={() => onDelete(row.original.id)}>Supprimer</button>
          )}
        </div>
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
      <h2>Gérer les cartes de crédit</h2>
      <div>
        <button onClick={handleAdd}>Ajouter une carte</button>
      </div>

      <table>
        <thead>
          {table
            .getHeaderGroups()
            .map((headerGroup: HeaderGroup<CreditCard>) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: Row<CreditCard>) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {editCard && (
        <div className="edit-card-form">
          <h3>{editCard.id ? "Modifier la carte" : "Ajouter une carte"}</h3>
          <div>
            <label>Nom :</label>
            <input
              type="text"
              value={editCard.name}
              onChange={(e) =>
                setEditCard({ ...editCard, name: e.target.value })
              }
            />
          </div>
          <div>
            <label>Numéro :</label>
            <input
              type="text"
              value={editCard.number}
              onChange={(e) =>
                setEditCard({ ...editCard, number: e.target.value })
              }
            />
          </div>
          <div>
            <label>Mois d'expiration :</label>
            <input
              type="number"
              min={1}
              max={12}
              value={editCard.expiryMonth}
              onChange={(e) =>
                setEditCard({
                  ...editCard,
                  expiryMonth: Number(e.target.value)
                })
              }
            />
          </div>
          <div>
            <label>Année d'expiration :</label>
            <input
              type="number"
              min={new Date().getFullYear()}
              value={editCard.expiryYear}
              onChange={(e) =>
                setEditCard({
                  ...editCard,
                  expiryYear: Number(e.target.value)
                })
              }
            />
          </div>
          <div>
            <label>CVC :</label>
            <input
              type="text"
              value={editCard.cvc}
              onChange={(e) =>
                setEditCard({ ...editCard, cvc: e.target.value })
              }
            />
          </div>
          <div>
            <button onClick={handleSave}>Enregistrer</button>
            <button onClick={() => setEditCard(null)}>Annuler</button>
          </div>
        </div>
      )}

      <div>
        <button onClick={onCancel}>Fermer</button>
      </div>
    </Modal>
  );
};

export default ModalCreditCardComponent;
