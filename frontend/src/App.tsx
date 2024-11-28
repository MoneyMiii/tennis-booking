import React, { useCallback, useEffect, useState } from "react";

import { addSlot, deleteSlot, getSlots } from "./api/api";
import CustomCalendar from "./components/CustomCalendar";
import Loader from "./components/Loader";
import ModalAddComponent from "./components/ModalAddComponent";
import ModalDeleteComponent from "./components/ModalDeleteComponent";
import ModalErrorComponent from "./components/ModalErrorComponent";
import { useLoader } from "./contexts/loaderContext";
import { Slot } from "./types/types";

const App: React.FC = () => {
  const { loading, setLoading } = useLoader();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [courtType, setCourtType] = useState<
    "indoor" | "outdoor" | "both" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const slotsFromApi = await getSlots();
      setSlots(slotsFromApi);
    } catch (error: any) {
      setErrorMessage(
        "Une erreur est survenue lors de la récupération des créneaux."
      );
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

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
      try {
        await addSlot(
          selectedSlot.start.toISOString().split("T")[0],
          selectedSlot.start.getHours(),
          selectedSlot.end.getHours(),
          courtType
        );
        setIsModalOpen(false);
        await fetchSlots();
      } catch (error) {
        setErrorMessage(
          "Une erreur est survenue lors de l'ajout de l'événement."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteEvent = (slot: Slot) => {
    setSlotToDelete(slot);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (slotToDelete) {
      setLoading(true);
      try {
        await deleteSlot(slotToDelete.id);
        setIsDeleteModalOpen(false);
        await fetchSlots();
      } catch (error) {
        setErrorMessage(
          "Une erreur est survenue lors de la suppression de l'événement."
        );
      } finally {
        setLoading(false);
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

  return (
    <div>
      {loading && <Loader />}
      <div style={{ padding: "20px" }}>
        <h1>Calendrier de Réservation</h1>
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
