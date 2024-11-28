import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";

import "./CustomCalendar.css";

import moment from "moment";
import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";

import {
  convertSlotCalendarToSlot,
  convertSlotToSlotCalendar
} from "../../mappers/mappers";
import { Slot, SlotCalendar } from "../../types/types";

moment.locale("fr");
const localizer = momentLocalizer(moment);

interface CustomCalendarProps {
  slots: Slot[];
  onSlotSelect: (start: Date, end: Date) => void;
  onDeleteEvent: (slot: Slot) => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  slots,
  onSlotSelect,
  onDeleteEvent
}) => {
  const eventPropGetter = (event: SlotCalendar) => {
    let backgroundColor = "#f0f0f0";

    switch (event.ressource.status) {
      case "book":
        backgroundColor = "#28a745";
        break;
      case "not_book":
        backgroundColor = "#dc3545";
        break;
      case "waiting":
        backgroundColor = "#ffc107";
        break;
    }

    return {
      style: {
        backgroundColor
      }
    };
  };

  return (
    <Calendar
      localizer={localizer}
      events={slots.map((slot) => convertSlotToSlotCalendar(slot))}
      onSelectSlot={({ start, end }) => onSlotSelect(start, end)}
      onSelectEvent={(slotCalendar) => {
        let slot = convertSlotCalendarToSlot(slotCalendar);
        onDeleteEvent(slot);
      }}
      selectable
      step={60}
      defaultView="week"
      views={["week"]}
      min={new Date(2023, 1, 1, 8, 0)}
      max={new Date(2023, 1, 1, 22, 0)}
      timeslots={1}
      culture="fr"
      formats={{
        timeGutterFormat: (date) => moment(date).format("HH:mm"),
        dayFormat: (date) => moment(date).format("ddd D MMM"),
        dayRangeHeaderFormat: ({ start, end }) =>
          `${moment(start).format("dddd D MMMM")} - ${moment(end).format(
            "dddd D MMMM"
          )}`,
        dateFormat: (date) => moment(date).format("ddd D MMM")
      }}
      eventPropGetter={eventPropGetter}
    />
  );
};

export default CustomCalendar;
