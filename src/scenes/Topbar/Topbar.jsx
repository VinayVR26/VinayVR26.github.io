import { Box, IconButton, useTheme, Badge, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, List, ListItem, ListItemText } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useUserAuth } from "../../context/UserAuthContext";
import { sortBy } from "lodash";
import Search from "../SearchBar/Search";


// can write css properties directly in the box component unlike div

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { user, logOut } = useUserAuth();
  const navigate = useNavigate();
  const [reminderCount, setReminderCount] = useState(0);
  const [displayEvents, setDisplayEvents] = useState([]);
  // State to store the selected event
  const [selectedEvent, setSelectedEvent] = useState(null);
  // State to manage whether the notifications modal is open or closed
  const [open, setOpen] = useState(false);

  const handleHomeClicked = () => {
    navigate("/dashboard");
  }

  const handleCalendarClicked = () => {
    navigate("/calendar");
  }

  const handlePersonClicked = () => {
    navigate("/update-profile");
  }

  const handleSettingsClicked = () => {
    navigate("/settings");
  }

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  // Function to open the notifications modal when the NotificationsOutlinedIcon is clicked
  const handleNotificationsClick = () => {
    setOpen(true);
  };

  // Function to close the notifications modal
  const handleClose = () => {
    setOpen(false);
  };

  // Function to handle click on an event in the notifications modal
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Function to listen for changes to the reminderCount field in Firestore
  const listenForReminderCountAndDisplayEventChanges = () => {
    const userProfileRef = doc(db, "users", user.email);
    const unsubscribe = onSnapshot(userProfileRef, (snapshot) => {
      const userProfileData = snapshot.data();
      const reminderCount = userProfileData.reminderCount || 0;
      setReminderCount(reminderCount);
      const displayEvents = userProfileData.displayEvents || []; // Update the displayEvents state with data from Firestore
      setDisplayEvents(displayEvents);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  };

  // useEffect to listen for reminderCount changes when the component mounts
  useEffect(() => {
    if (Object.keys(user).length !== 0) { // OR user.length === undefined
      listenForReminderCountAndDisplayEventChanges();
    }
  }, [user]);

  // Function to format the date to a human-readable format
  const formatDate = (timestamp) => {
    try {
      const date = timestamp.toDate();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error while formatting date:", error);
      return "Invalid Date"; // Return this if the date format is incorrect
    }
  };

  // Function to sort events by start date in ascending order
  const sortEventsByStartDate = (events) => {
    return sortBy(events, (event) => new Date(event.start.toDate())); 
  };

  // (ABOVE) Firestore stores dates as Timestamp objects, and when retrieving these dates, they are not automatically converted back to JavaScript Date objects.


  return (
    
     <Box display="flex" justifyContent="space-between" p={2}>

      <Search />
      
      {/* ICONS */}
      <Box display="flex" marginLeft="auto">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <IconButton onClick={handleNotificationsClick}>
          <Badge badgeContent={reminderCount} color="secondary">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        <IconButton onClick={handleHomeClicked}>
          <HomeOutlinedIcon />
        </IconButton>

        <IconButton onClick={handleCalendarClicked}>
          <CalendarTodayOutlinedIcon />
        </IconButton>

        <IconButton onClick={handlePersonClicked}>
          <PersonOutlinedIcon />
        </IconButton>

        <IconButton onClick={handleSettingsClicked}>
          <SettingsOutlinedIcon />
        </IconButton>

        <IconButton onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>

        {/* Notifications Modal */}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Events</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {/* Display the events in a scrollable list */}
              <Box maxHeight="400px" overflow="auto">
                <List>
                  {/* Sort events by start date before rendering */}
                  {sortEventsByStartDate(displayEvents).map((event) => (
                    <ListItem
                      key={event.id}
                      button
                      onClick={() => handleEventClick(event)}
                    >
                      <ListItemText
                      primary={`Event: ${event.title}`}
                      secondary={`Start Date: ${formatDate(event.start)}`} // Format the start date here
                    />
                  </ListItem>
                  ))}
                </List>
            </Box>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={handleClose} color="primary">
            CLOSE
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Topbar;