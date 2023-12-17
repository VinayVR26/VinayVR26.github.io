import React, { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useUserAuth } from "../../context/UserAuthContext";
import Header from "../Header/Header";

const Settings = () => {
  const { user } = useUserAuth();
  const [reminderOption, setReminderOption] = useState("None");

  const fetchReminderOption = async () => {
    try {
      const userProfileRef = doc(db, "users", user.email);
      const userProfileSnap = await getDoc(userProfileRef);
      if (userProfileSnap.exists()) {
        const userProfileData = userProfileSnap.data();
        const reminderOption = userProfileData.reminderOption || "None";
        setReminderOption(reminderOption);
      }
    } catch (error) {
      console.log("Error fetching reminder option:", error.message);
    }
  };

  useEffect(() => {
    fetchReminderOption();
  }, [user]);

  const handleReminderOptionChange = async (event) => {
    const newReminderOption = event.target.value;

    try {
      const userProfileRef = doc(db, "users", user.email);
      await updateDoc(userProfileRef, {
        reminderOption: newReminderOption,
      });
      setReminderOption(newReminderOption);
      console.log("Reminder option updated successfully.");
    } catch (error) {
      console.error("Error updating reminder option:", error);
    }
  };

  return (
    <Box m="20px">
      <Header title="SETTINGS"/>
      <Box maxWidth="300px">
        <FormControl fullWidth variant="outlined">
          <InputLabel>Reminder Option</InputLabel>
          <Select
            value={reminderOption}
            onChange={handleReminderOptionChange}
            label="Reminder Option"
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default Settings;
