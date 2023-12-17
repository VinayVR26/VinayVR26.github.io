import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import { formatDate } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import Header from "../Header/Header";
import { tokens } from "../../theme";
import { useUserAuth } from "../../context/UserAuthContext";
import { db } from "../Firebase/firebase";
import { getDoc, addDoc, updateDoc, deleteDoc, collection, doc, onSnapshot } from "firebase/firestore";
import { sortBy } from "lodash";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const { user } = useUserAuth();
  const calendarRef = useRef(null); 
  const [reminderOption, setReminderOption] = useState("none");

  Date.prototype.getWeek = function () {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  };

  const handleNextYear = () => {
    const calendarApi = calendarRef.current.getApi();
    const currentDate = calendarApi.getDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    calendarApi.gotoDate(new Date(currentYear + 1, currentMonth, currentDay));
};


  const handlePrevYear = () => {
    const calendarApi = calendarRef.current.getApi();

    const currentDate = calendarApi.getDate();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    calendarApi.gotoDate(new Date(currentYear - 1, currentMonth, currentDay));
  };

  const updateReminderCount = async () => {
    try {
    const userProfileRef= doc(db, "users", user.email);
    const userProfileSnap = await getDoc(userProfileRef);
    const userProfileData = userProfileSnap.data();
    const existingEvents = userProfileData.events || [];
    const reminderOption = userProfileData.reminderOption || "none";
    
    let reminderCount = 0;
    let displayEventsToAdd = [];
    const currentDate = new Date();

    for (const event of existingEvents) {
      const eventId = event.id;
      const eventStart = new Date(event.start);
      const eventTitle = event.title;
      const eventEnd = new Date(event.end);

      const eventToDisplay = {
        id: eventId,
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
      }


      switch (reminderOption) {
        case "none":
          break;
        case "day":
          if (eventStart.toDateString() === currentDate.toDateString()) {
            reminderCount++;
            displayEventsToAdd.push(eventToDisplay);
          }
          break;
        case "week":
          const currentWeek = new Date().getWeek();
          if (eventStart.getWeek() === currentWeek) {
            reminderCount++;
            displayEventsToAdd.push(eventToDisplay);
          }
          break;
        case "month":
          if (
            eventStart.getMonth() === currentDate.getMonth() &&
            eventStart.getFullYear() === currentDate.getFullYear()
          ) {
            reminderCount++;
            displayEventsToAdd.push(eventToDisplay);
          }
          break;
        case "year":
          if (eventStart.getFullYear() === currentDate.getFullYear()) {
            reminderCount++;
            displayEventsToAdd.push(eventToDisplay);
          }
          break;
        default:
          break;
        }
      }

      await updateDoc(userProfileRef, {
        reminderCount,
        displayEvents: displayEventsToAdd,
      });
      console.log("Event count updated successfully.");
    } catch (error) {
      console.error("Error fetching events from Firestore: ", error);
    }
  };

  const listenForReminderOptionChanges = () => {
    const userProfileRef = doc(db, "users", user.email);
    const unsubscribe = onSnapshot(userProfileRef, (snapshot) => {
      const userProfileData = snapshot.data();
      const reminderOption = userProfileData.reminderOption || "none";
      setReminderOption(reminderOption);//
      updateReminderCount();
    });

    return () => {
      unsubscribe();
    };
  };

  const handleDateSelect = (arg) => {
    const selected = {
      view: arg.view,
      dateStr: arg.startStr,
      startStr: arg.startStr,
      endStr: arg.endStr,
      allDay: arg.allDay,
    };

    handleDateClick(selected);
  };


  const handleDateClick = async (selected) => {
    const title = prompt("Please enter a new title for your event");
    const calendarApi = selected.view.calendar;
    calendarApi.unselect();

    if (title) {
      const currentTime = new Date().toISOString();

      const newEvent = {
        id: `${selected.dateStr}-${currentTime}-${title}`,
        title,
        start: selected.startStr,
        end: selected.endStr,
        allDay: selected.allDay,
      };

      calendarApi.addEvent(newEvent);

      if (newEvent && Object.keys(newEvent).length > 0) {
        try {
          const userProfileRef= doc(db, "users", user.email);
          const userProfileSnap = await getDoc(userProfileRef);
          const userProfileData = userProfileSnap.data();
          const existingEvents = userProfileData.events || [];
          existingEvents.push(newEvent)
          await updateDoc(userProfileRef, {
            events: existingEvents,
          });
          updateReminderCount();

        } catch (error) {
          console.error("Error adding document: ", error);
        }
      }
    }
  };

  const handleEventClick = async (selected) => {
    if (
      window.confirm(
        `Are you sure you want to delete the event '${selected.event.title}'`)) {
      const eventIdToDelete = selected.event.id;
      selected.event.remove();

      try {
        const userProfileRef = doc(db, "users", user.email);
        const userProfileSnap = await getDoc(userProfileRef);
        const userProfileData = userProfileSnap.data();
        const existingEvents = userProfileData.events || [];
        const eventIndexToDelete = existingEvents.findIndex((event) => event.id === eventIdToDelete);

        if (eventIndexToDelete !== -1) {
          existingEvents.splice(eventIndexToDelete, 1);

          await updateDoc(userProfileRef, {
            events: existingEvents,
          });
          updateReminderCount();
        } else {
          console.log("Event not found in Firestore. It may have already been deleted.");
        }
      } catch (error) {
        console.error("Error deleting event from Firestore: ", error);
      }
    }
  };

  const handleEventDrop = async (eventDropInfo) => {
    const { event } = eventDropInfo;
    const updatedEvent = {
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end ? event.end.toISOString() : null,
      allDay: event.allDay,
    };

    try {
      const userProfileRef = doc(db, "users", user.email);
      const userProfileSnap = await getDoc(userProfileRef);
      const userProfileData = userProfileSnap.data();
      const existingEvents = userProfileData.events || [];

      const eventIndexToUpdate = existingEvents.findIndex(
        (ev) => ev.id === updatedEvent.id
      );

      if (eventIndexToUpdate !== -1) {
        existingEvents[eventIndexToUpdate] = updatedEvent;

        await updateDoc(userProfileRef, {
          events: existingEvents,
        });

        updateReminderCount();
      } else {
        console.log("Event not found in Firestore. It may have been deleted.");
      }
    } catch (error) {
      console.error("Error updating event in Firestore: ", error);
    }
  };

  useEffect(() => {
    const fetchEventsFromFirestore = async () => {
      try {
        const userProfileRef = doc(db, "users", user.email);
        const userProfileSnap = await getDoc(userProfileRef);
        const userProfileData = userProfileSnap.data();
        const existingEvents = userProfileData.events || [];
        setCurrentEvents(existingEvents);

        const fullCalendarEvents = existingEvents.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end ? event.end : null,
          allDay: event.allDay,
        }));

        const calendarApi = calendarRef.current.getApi();
        calendarApi.removeAllEvents();
        calendarApi.addEventSource(fullCalendarEvents);
      } catch (error) {
        console.error("Error fetching events from Firestore: ", error);
      }
    };

    if (Object.keys(user).length !== 0) {
      fetchEventsFromFirestore();
      listenForReminderOptionChanges();
    }
  }, [user]);

  const sortEventsByStartDate = (events) => {
    return sortBy(events, (event) => new Date(event.start));
  };

  return (
    <Box m="20px">
      <Header title="CALENDAR"/>

      <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          backgroundColor={colors.primary[400]}
          p="15px"
          borderRadius="4px"
        >
          <Typography variant="h5">Events</Typography>
          <List>
            {/* Sort events by start date before rendering */}
            {sortEventsByStartDate(currentEvents).map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: colors.greenAccent[500],
                  margin: "10px 0",
                  borderRadius: "2px",
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Typography>
                      {formatDate(event.start, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* CALENDAR */}
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            ref={calendarRef}
            height="75vh"
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prevYear,prev,next,nextYear today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            customButtons={{
              prevYear: {
                text: "Prev Year",
                click: handlePrevYear,
              },
              nextYear: {
                text: "Next Year",
                click: handleNextYear,
              },
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventsSet={(events) => setCurrentEvents(events)}
            initialEvents={currentEvents}
            eventDrop={handleEventDrop} // Event drop handler
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Calendar;