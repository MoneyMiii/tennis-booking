import React, { useCallback, useEffect, useState } from "react";

import { addSlot, deleteSlot, getSlots } from "./api/api";
import CustomCalendar from "./components/customCalendar/CustomCalendar";
import Loader from "./components/loader/Loader";
import ModalAddComponent from "./components/modals/ModalAddComponent";
import ModalDeleteComponent from "./components/modals/ModalDeleteComponent";
import ModalErrorComponent from "./components/modals/ModalErrorComponent";
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
    getSlots()
      .then((slots) => {
        setSlots(slots);
      })
      .catch((err: { isSuccess: boolean; message: string }) =>
        setErrorMessage(err?.message)
      )
      .finally(() => setLoading(false));
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
