import moment from "moment";

import { Slot, SlotApi, SlotCalendar } from "../types/types";

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
