export interface Slot {
  id: string;
  start: number;
  end: number;
  date: string;
  courtType: "indoor" | "outdoor" | "both";
  status?: "book" | "not_book" | "waiting";
}

export interface SlotApi {
  id: string;
  start_time: number;
  end_time: number;
  date: string;
  type: "indoor" | "outdoor" | "both";
  status?: "book" | "not_book" | "waiting";
}

export interface SlotCalendar {
  id: string;
  title: "indoor" | "outdoor" | "both";
  start: Date;
  end: Date;
  ressource: Ressource;
}

export interface Ressource {
  status?: "book" | "not_book" | "waiting";
}

export interface CreditCardApi {
  id: string;
  name: string;
  number: string;
  cvc: string;
  expiry_month: number;
  expiry_year: number;
  is_used: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  number: string;
  cvc: string;
  expiryMonth: number;
  expiryYear: number;
  isUsed: boolean;
}
