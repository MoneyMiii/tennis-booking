import moment from "moment";

import {
  CreditCard,
  CreditCardApi,
  Slot,
  SlotApi,
  SlotCalendar
} from "../types/types";

export const convertSlotCalendarToSlot = (slotCalendar: SlotCalendar): Slot => {
  const startDate = moment(slotCalendar.start);
  const endDate = moment(slotCalendar.end);

  return {
    id: slotCalendar.id,
    start: startDate.hour(),
    end: endDate.hour(),
    date: startDate.format("YYYY-MM-DD"),
    courtType: slotCalendar.title
  };
};

export const convertSlotToSlotCalendar = (slot: Slot): SlotCalendar => {
  const startDate = moment(`${slot.date} ${slot.start}:00`, "YYYY-MM-DD HH:mm");
  const endDate = moment(`${slot.date} ${slot.end}:00`, "YYYY-MM-DD HH:mm");

  return {
    id: slot.id,
    title: slot.courtType,
    start: startDate.toDate(),
    end: endDate.toDate(),
    ressource: {
      status: slot.status
    }
  };
};

export const convertSlotApiToSlot = (slotApi: SlotApi): Slot => {
  return {
    id: slotApi.id,
    start: slotApi.start_time,
    end: slotApi.end_time,
    date: slotApi.date,
    courtType: slotApi.type,
    status: slotApi.status
  };
};

export const convertSlotToSlotApi = (slot: Slot): SlotApi => {
  return {
    id: slot.id,
    start_time: slot.start,
    end_time: slot.end,
    date: slot.date,
    type: slot.courtType,
    status: slot.status
  };
};

export const convertCreditCardApiToCreditCard = (
  creditCardApi: CreditCardApi
): CreditCard => {
  return {
    id: creditCardApi.id,
    name: creditCardApi.name,
    number: creditCardApi.number,
    cvc: creditCardApi.cvc,
    expiryMonth: creditCardApi.expiry_month,
    expiryYear: creditCardApi.expiry_year,
    isUsed: creditCardApi.is_used
  };
};

export const convertCreditCardToCreditCardApi = (
  creditCard: CreditCard
): CreditCardApi => {
  return {
    id: creditCard.id,
    name: creditCard.name,
    number: creditCard.number,
    cvc: creditCard.cvc,
    expiry_month: creditCard.expiryMonth,
    expiry_year: creditCard.expiryYear,
    is_used: creditCard.isUsed
  };
};
