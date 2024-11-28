// /src/hooks/useSlots.ts
import { useEffect, useState } from "react";

import { addSlot, deleteSlot, getSlots } from "../api/api";
import { Slot } from "../types/types";

const useSlots = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      try {
        const slots = await getSlots();
        setSlots(slots);
      } catch (error) {
        setError("Erreur lors de la récupération des créneaux");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const addEvent = async (
    date: string,
    startTime: number,
    endTime: number,
    slotType: string
  ) => {
    try {
      await addSlot(date, startTime, endTime, slotType);
      const slots = await getSlots();
      setSlots(slots);
    } catch (error) {
      setError("Erreur lors de l'ajout du créneau");
    }
  };

  const removeEvent = async (id: string) => {
    try {
      await deleteSlot(id);
      const slots = await getSlots();
      setSlots(slots);
    } catch (error) {
      setError("Erreur lors de la suppression du créneau");
    }
  };

  return { slots, addEvent, removeEvent, isLoading, error };
};

export default useSlots;
