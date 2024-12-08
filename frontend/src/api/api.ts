// api.ts (ou fichier contenant les fonctions API)
import {
  convertAccountApiToAccount,
  convertSlotApiToSlot
} from "../mappers/mappers";
import { AccountApi, CarnetReservation, SlotApi } from "../types/types";

//const API_BASE_URL = "http://192.168.1.15:5000";
const API_BASE_URL = "http://localhost:5000";

export const getSlots = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/slots`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des créneaux");
    }

    const data = await response.json();
    if (data.isSuccess) {
      return data.data.map((slot: SlotApi) => convertSlotApiToSlot(slot));
    } else {
      throw new Error(
        data.message || "Erreur inconnue lors de la récupération des créneaux"
      );
    }
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const addSlot = async (
  date: string,
  startTime: number,
  endTime: number,
  slotType: string
): Promise<{ message: string; status?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date,
        start_time: startTime,
        end_time: endTime,
        type: slotType
      })
    });

    const data = await response.json();

    if (!data.isSuccess) {
      throw new Error(data.message || "Erreur lors de l'ajout du créneau");
    }

    return {
      message: data.message,
      status: data.data?.status
    };
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const deleteSlot = async (id: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/slots/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression du créneau");
    }

    const result = await response.json();

    if (result.isSuccess) {
      return result.message;
    } else {
      throw new Error(
        result.message || "Erreur inconnue lors de la suppression"
      );
    }
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const getAccounts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des comptes");
    }

    const data = await response.json();
    if (data.isSuccess) {
      return data.data.map((accountApi: AccountApi) =>
        convertAccountApiToAccount(accountApi)
      );
    } else {
      throw new Error(
        data.message || "Erreur inconnue lors de la récupération des comptes"
      );
    }
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const addAccount = async (
  email: string,
  password: string,
  isUsed: boolean
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        is_used: isUsed
      })
    });

    const data = await response.json();

    if (!data.isSuccess) {
      throw new Error(data.message || "Erreur lors de l'ajout d'un compte'");
    }

    return data.message;
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const updateAccount = async (
  id: string,
  email: string,
  password: string,
  isUsed: boolean
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        is_used: isUsed
      })
    });

    const data = await response.json();

    if (!data.isSuccess) {
      throw new Error(
        data.message || "Erreur lors de la mise à jour d'un compte'"
      );
    }

    return data.message;
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const deleteAccount = async (id: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!data.isSuccess) {
      throw new Error(
        data.message || "Erreur lors de la suppression d'un compte'"
      );
    }

    return data.message;
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};

export const getCarnetsReservation = async (): Promise<CarnetReservation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/remaining_hours`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération des carnets de réservation"
      );
    }

    const data = await response.json();
    if (data.isSuccess) {
      const carnets: CarnetReservation[] = [
        {
          nom: "Couvert",
          nombreDeCreneaux: data.data.court_couvert_hours
        },
        {
          nom: "Découvert",
          nombreDeCreneaux: data.data.court_decouvert_hours
        }
      ];
      return carnets;
    } else {
      throw new Error(
        data.message || "Erreur inconnue lors de la récupération des carnets"
      );
    }
  } catch (error: any) {
    console.error("Erreur API:", error);
    throw new Error(error.message || "Une erreur inconnue est survenue");
  }
};
