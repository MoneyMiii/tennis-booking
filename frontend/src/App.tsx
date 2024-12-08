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

  const [activeRequests, setActiveRequests] = useState(0); // Compteur pour les appels API en cours

  const updateLoadingState = (isActive: boolean) => {
    setActiveRequests((prev) => (isActive ? prev + 1 : prev - 1));
  };

  const fetchSlots = useCallback(async () => {
    updateLoadingState(true); // Augmenter le compteur
    try {
      const slots = await getSlots();
      setSlots(slots);
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      updateLoadingState(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    updateLoadingState(true);
    try {
      const accounts = await getAccounts();
      setAccounts(accounts);
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      updateLoadingState(false);
    }
  }, []);

  const fetchCarnets = useCallback(async () => {
    updateLoadingState(true);
    try {
      const carnets = await getCarnetsReservation();
      setCarnetsReservation(carnets);
    } catch (error: any) {
      setErrorMessage(error?.message || "Une erreur inconnue est survenue");
    } finally {
      updateLoadingState(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    fetchAccounts();
    fetchCarnets();
  }, [fetchSlots, fetchAccounts, fetchCarnets]);

  useEffect(() => {
    if (activeRequests > 0) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [activeRequests, setLoading]);

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

  const handleDeleteEvent = (slot: Slot) => {
    setSlotToDelete(slot);
    setIsDeleteModalOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedSlot && courtType) {
      updateLoadingState(true);
      setIsModalOpen(false);
      try {
        await addSlot(
          selectedSlot.start.toISOString().split("T")[0],
          selectedSlot.start.getHours(),
          selectedSlot.end.getHours(),
          courtType
        );
        fetchSlots();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          "isSuccess" in err
        ) {
          const customErr = err as { isSuccess: boolean; message: string };
          setErrorMessage(customErr.message);
        } else {
          setErrorMessage("Une erreur inconnue est survenue");
        }
      } finally {
        updateLoadingState(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (slotToDelete) {
      updateLoadingState(true);
      setIsDeleteModalOpen(false);
      try {
        await deleteSlot(slotToDelete.id);
        fetchSlots();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          "isSuccess" in err
        ) {
          const customErr = err as { isSuccess: boolean; message: string };
          setErrorMessage(customErr.message);
        } else {
          setErrorMessage("Une erreur inconnue est survenue");
        }
      } finally {
        updateLoadingState(false);
      }
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
    updateLoadingState(true);
    try {
      await addAccount(account.email, account.password, account.isUsed);
      fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      updateLoadingState(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    updateLoadingState(true);
    try {
      await deleteAccount(id);
      fetchAccounts();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      updateLoadingState(false);
    }
  };

  const handleEditAccount = async (
    id: string,
    updatedAccount: Omit<Account, "id">
  ) => {
    updateLoadingState(true);
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
      updateLoadingState(false);
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
          sx={{ marginBottom: "5px", marginRight: "10px" }}
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
