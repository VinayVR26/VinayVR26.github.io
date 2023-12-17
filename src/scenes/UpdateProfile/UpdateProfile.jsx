import React, { useState, useEffect } from "react";
import { Form, Alert } from "react-bootstrap";
import { useUserAuth } from "../../context/UserAuthContext";
import { db, storage } from "../Firebase/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Header from "../Header/Header";
import { Box, TextField, Button } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

const UpdateProfile = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { user } = useUserAuth();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", user.email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUsername(userData.username || "");
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setGender(userData.gender || "male");
        }
      } catch (err) {
        setError("An error occurred while fetching user data.");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user.email]);

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      // Capitalize first name and last name before storing in Firestore
      const capitalizedFirstName = capitalizeFirstLetter(firstName);
      const capitalizedLastName = capitalizeFirstLetter(lastName);

      // Upload the image to Firebase Storage and get the URL
      let imageUrl = null;
      if (image) {
        const storageRef = ref(storage, `user_images/${user.email}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      } else {
        // If no new image is uploaded, fetch the existing image URL from Firestore
        const userDocRef = doc(db, "users", user.email);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          imageUrl = userData.imageUrl || null;
        }
      }

      const userDocRef = doc(db, "users", user.email);
      await updateDoc(userDocRef, {
        username: username,
        firstName: capitalizedFirstName,
        lastName: capitalizedLastName,
        gender: gender,
        imageUrl: imageUrl,
      });

      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 100); // Refresh after 0.1 seconds
      
    } catch (err) {
      setError("An error occurred while updating the profile.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <Box m="20px">
      <Header title="UPDATE YOUR PROFILE" />
      
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleUpdateProfile}>

        <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
            <TextField
              fullWidth
              variant="filled"
              type="text"
              label="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              sx={{ gridColumn: "span 2" }}
            />

            <TextField
              fullWidth
              variant="filled"
              type="text"
              label="First Name"
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName}
              sx={{ gridColumn: "span 2" }}
            />

            <TextField
              fullWidth
              variant="filled"
              type="text"
              label="Last Name"
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
              sx={{ gridColumn: "span 2" }}
            />            
        

          <Box>
            <Button type="submit" color="secondary" variant="contained">
              Update profile
            </Button>
          </Box>
        </Box>
          
        </Form>
      
      </Box>
    </>
  );
};

export default UpdateProfile;