import React, { useCallback, useEffect, useState } from "react";

import {
  addCreditCard,
  addSlot,
  deleteCreditCard,
  deleteSlot,
  getCreditCards,
  getSlots,
  updateCreditCard
} from "./api/api";
import CustomCalendar from "./components/customCalendar/CustomCalendar";
import Loader from "./components/loader/Loader";
import ModalAddComponent from "./components/modals/ModalAddComponent";
import ModalCreditCardComponent from "./components/modals/ModalCreditCardComponent";
import ModalDeleteComponent from "./components/modals/ModalDeleteComponent";
import ModalErrorComponent from "./components/modals/ModalErrorComponent";
import { useLoader } from "./contexts/loaderContext";
import { CreditCard, Slot } from "./types/types";

const App: React.FC = () => {
  const { loading, setLoading } = useLoader();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  const [courtType, setCourtType] = useState<
    "indoor" | "outdoor" | "both" | null
  >(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);

  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

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

  const fetchCreditCards = useCallback(async () => {
    setLoading(true);
    try {
      const cards = await getCreditCards();
      setCreditCards(cards);
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    fetchSlots();
    fetchCreditCards();
  }, [fetchSlots, fetchCreditCards]);

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

  const handleAddCard = async (card: Omit<CreditCard, "id">) => {
    setLoading(true);
    try {
      await addCreditCard(
        card.name,
        card.number,
        card.cvc,
        card.expiryMonth,
        card.expiryYear,
        card.isUsed
      );
      fetchCreditCards();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    setLoading(true);
    try {
      await deleteCreditCard(id);
      fetchCreditCards();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCard = async (
    id: string,
    updatedCard: Omit<CreditCard, "id">
  ) => {
    setLoading(true);
    try {
      await updateCreditCard(
        id,
        updatedCard.name,
        updatedCard.number,
        updatedCard.cvc,
        updatedCard.expiryMonth,
        updatedCard.expiryYear,
        updatedCard.isUsed
      );
      fetchCreditCards();
    } catch (err: any) {
      setErrorMessage(err?.message);
    } finally {
      setLoading(false);
    }
  };
  const handleOpenCreditCardModal = () => {
    setIsCreditCardModalOpen(true);
  };

  const handleCloseCreditCardModal = () => {
    setIsCreditCardModalOpen(false);
  };

  return (
    <div>
      {loading && <Loader />}
      <div style={{ padding: "20px" }}>
        <h1>Calendrier de Réservation</h1>
        <button onClick={handleOpenCreditCardModal}>
          Gérer les cartes de crédit
        </button>
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
        <ModalCreditCardComponent
          isOpen={isCreditCardModalOpen}
          creditCards={creditCards}
          currentCardId={selectedCard?.id || ""}
          onAdd={handleAddCard}
          onEdit={handleEditCard}
          onDelete={handleDeleteCard}
          onCancel={handleCloseCreditCardModal}
          onSetCurrentCard={(id: string) => {
            const card = creditCards.find((c) => c.id === id) || null;
            setSelectedCard(card);
            if (selectedCard) {
              console.log(selectedCard);
              handleEditCard(id, { ...selectedCard, isUsed: true });
            }
          }}
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
