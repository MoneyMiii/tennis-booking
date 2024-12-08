import React, { useCallback, useEffect, useState } from "react";

import { Box, Button, Typography } from "@mui/material";

import {
  addAccount,
  addSlot,
  deleteAccount,
  deleteSlot,
  getAccounts,
  getCarnetsReservation,
  getSlots,
  updateAccount
} from "./api/api";
import CustomCalendar from "./components/customCalendar/CustomCalendar";
import Loader from "./components/loader/Loader";
import ModalAccountComponent from "./components/modals/ModalAccountComponent";
import ModalAddComponent from "./components/modals/ModalAddComponent";
import ModalCarnetComponent from "./components/modals/ModalCarnetComponent";
import ModalDeleteComponent from "./components/modals/ModalDeleteComponent";
import ModalErrorComponent from "./components/modals/ModalErrorComponent";
import { useLoader } from "./contexts/loaderContext";
import { Account, CarnetReservation, Slot } from "./types/types";

const App: React.FC = () => {
  const { loading, setLoading } = useLoader();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [carnetsReservation, setCarnetsReservation] = useState<
    CarnetReservation[]
  >([]);

  const [courtType, setCourtType] = useState<
    "indoor" | "outdoor" | "both" | null
  >(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCarnetReservationModalOpen, setIsCarnetReservationModalOpen] =
    useState(false);

  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    getSlots()
      .then((slots) => {
        setSlots(slots);
      })
      .catch((err: { isSuccess: boolean; message: string }) =>
        setErrorMessage(err?.message)
      )
      .finally(() => setLoading(false));
  }, [setLoading]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const accounts = await getAccounts();
      setAccounts(accounts);
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const fetchCarnets = useCallback(async () => {
    setLoading(true);
    try {
      const carnets = await getCarnetsReservation();
      setCarnetsReservation(carnets);
    } catch (error: any) {
      setErrorMessage(error?.message || "Une erreur inconnue est survenue");
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    fetchSlots();
    fetchAccounts();
    fetchCarnets();
  }, [fetchSlots, fetchAccounts, fetchCarnets]);

  const handleSlotSelect = (start: Date, end: Date) => {
    const isFullDay =
      start.getHours() === 0 &&
      start.getMinutes() === 0 &&
      end.getHours() === 0 &&
      end.getMinutes() === 0;

    if (isFullDay) {
      const adjustedStart = new Date(start);
      adjustedStart.setHours(8, 0, 0, 0);
      const adjustedEnd = new Date(start);
      adjustedEnd.setHours(22, 0, 0, 0);
      setSelectedSlot({ start: adjustedStart, end: adjustedEnd });
    } else {
      setSelectedSlot({ start, end });
    }
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedSlot && courtType) {
      setLoading(true);
      setIsModalOpen(false);
      addSlot(
        selectedSlot.start.toISOString().split("T")[0],
        selectedSlot.start.getHours(),
        selectedSlot.end.getHours(),
        courtType
      )
        .then(() => fetchSlots())
        .catch((err: { isSuccess: boolean; message: string }) => {
          setErrorMessage(err?.message);
        })
        .finally(() => setLoading(false));
    }
  };

  const handleDeleteEvent = (slot: Slot) => {
    setSlotToDelete(slot);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (slotToDelete) {
      setLoading(true);
      setIsDeleteModalOpen(false);
      deleteSlot(slotToDelete.id)
        .then(() => fetchSlots())
        .catch((err: { isSuccess: boolean; message: string }) => {
          console.log(err);
          setErrorMessage(err?.message);
        })
        .finally(() => setLoading(false));
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSlotToDelete(null);
  };

  const handleCloseErrorModal = () => {
    setErrorMessage(null);
  };

  const handleAddAccount = async (account: Omit<Account, "id">) => {
    setLoading(true);
    try {
      await addAccount(account.email, account.password, account.isUsed);
      fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setLoading(true);
    try {
      await deleteAccount(id);
      fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = async (
    id: string,
    updatedAccount: Omit<Account, "id">
  ) => {
    setLoading(true);
    try {
      await updateAccount(
        id,
        updatedAccount.email,
        updatedAccount.password,
        updatedAccount.isUsed
      );
      fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  };
  const handleOpenAccountModal = () => {
    setIsAccountModalOpen(true);
  };

  const handleCloseAccountModal = () => {
    setIsAccountModalOpen(false);
  };

  const handleOpenCarnetReservationModal = () => {
    setIsCarnetReservationModalOpen(true);
  };

  const handleCloseCarnetReservationModal = () => {
    setIsCarnetReservationModalOpen(false);
  };

  return (
    <div>
      {loading && <Loader />}
      <div style={{ padding: "20px" }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="h3">Calendrier de Réservation</Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          sx={{ marginBottom: "5px" }}
          onClick={handleOpenAccountModal}
        >
          Gérer les comptes
        </Button>
        <Button
          variant="outlined"
          size="small"
          sx={{ marginBottom: "5px" }}
          onClick={handleOpenCarnetReservationModal}
        >
          Carnet de réservation
        </Button>
        <CustomCalendar
          slots={slots}
          onSlotSelect={handleSlotSelect}
          onDeleteEvent={handleDeleteEvent}
        />
        <ModalAddComponent
          isOpen={isModalOpen}
          courtType={courtType}
          selectedSlot={selectedSlot}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onSetCourtType={setCourtType}
        />
        <ModalDeleteComponent
          isOpen={isDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          slotToDelete={slotToDelete}
        />
        <ModalAccountComponent
          isOpen={isAccountModalOpen}
          accounts={accounts}
          currentAccountId={selectedAccount?.id || ""}
          onAdd={handleAddAccount}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
          onCancel={handleCloseAccountModal}
          onSetCurrentAccount={(id: string) => {
            const account = accounts.find((c) => c.id === id) || null;
            setSelectedAccount(account);
            if (selectedAccount) {
              console.log(selectedAccount);
              handleEditAccount(id, { ...selectedAccount, isUsed: true });
            }
          }}
        />
        <ModalCarnetComponent
          isOpen={isCarnetReservationModalOpen}
          carnetsReservation={carnetsReservation}
          onCancel={handleCloseCarnetReservationModal}
        />
        <ModalErrorComponent
          isOpen={!!errorMessage}
          message={errorMessage}
          onClose={handleCloseErrorModal}
        />
      </div>
    </div>
  );
};

export default App;
