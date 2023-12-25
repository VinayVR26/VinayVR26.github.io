import React, { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useUserAuth } from "../../context/UserAuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../Firebase/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

const CreateProfile = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");
  const [error, setError] = useState("");
  const [isUsernameUsed, setIsUsernameUsed] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      const usernameDocRef = doc(db, "usernames", "usernameList");
      const usernameDoc = await getDoc(usernameDocRef);

      if (usernameDoc.exists()) {
        const usernameList = usernameDoc.data().usernames;
        const isUsed = usernameList.includes(username);
        setIsUsernameUsed(isUsed);
      }
    };

    const timeoutId = setTimeout(() => {
      if (username.trim() !== "") {
        checkUsername();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();

    try {
      setError("");
      if (isUsernameUsed) {
        return;
      }
      const capitalizedFirstName = capitalizeFirstLetter(firstName);
      const capitalizedLastName = capitalizeFirstLetter(lastName);

      const userDocRef = doc(db, "users", user.email);
      await updateDoc(userDocRef, {
        username: username,
        firstName: capitalizedFirstName,
        lastName: capitalizedLastName,
        gender: gender,
        totalCashFlow: 10000,
        fundsForTrading: 10000,
      });

      const usernameListDocRef = doc(db, "usernames", "usernameList");
      const usernameListDoc = await getDoc(usernameListDocRef);

      if (usernameListDoc.exists()) {
        const currentUsernameList = usernameListDoc.data().usernames;
  
        if (!currentUsernameList.includes(username)) {
          const updatedUsernameList = [...currentUsernameList, username];
          await updateDoc(usernameListDocRef, {
            usernames: updatedUsernameList,
          });
        }
      }

      navigate("/dashboard");
    } catch (err) {
      setError("An error occurred while creating the profile");
    }
  };

  return (
    <>
      <div className="p-4 box">
        <h2>Create your Profile</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleCreateProfile}>
          <Form.Group className="mb-3" controlId="formBasicUsername">
            <Form.Control
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {isUsernameUsed && (
              <Alert variant="danger" className="small-padding"><div className="username-in-use">Username is in use</div></Alert>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicFirstName">
            <Form.Control
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicLastName">
            <Form.Control
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicGender">
            <Form.Label>Gender:</Form.Label>
            <Form.Control
              as="select"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Form.Control>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button className="o-btn" variant="primary" type="submit">
              Create Profile
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default CreateProfile;
