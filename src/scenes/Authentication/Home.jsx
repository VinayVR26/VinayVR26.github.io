import React, { useState, useEffect } from "react";
import { Button, Nav, Navbar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import "../../src/index.css";

const Home = () => {
  const { logOut, user } = useUserAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userDocRef = doc(db, "users", user.email);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUsername(userDocSnap.data().username || "");
        }
      } catch (error) {
        console.log("Error fetching username:", error.message);
      }
    };

    fetchUsername();
  }, [user.email]);


  if (user && user.emailVerified) {
    return (
      <>
  
        {/* Display a welcome message with the user's email */}
        <div className="p-4 box mt-3 text-center">
          Welcome <br />
          {username ? username: "Loading..."}
        </div>

        <div className="logout-button-container">
          <Button variant="primary" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        <div className="navbar-container">
          <Navbar bg="light" expand="lg">
            <Navbar.Brand>Menu</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link as={Link} to="/home">Home</Nav.Link>
                <Nav.Link as={Link} to="/update-profile">Update Profile</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </div>     
      </>
    );
  } else if (user) {
    return (
      <>
        <div className="p-4 box">
          <h2>Email Verification Required</h2>
          <p>Please check your email and verify your account to access the content.</p>
        </div>
        <div className="p-4 box">
          Return to Log In <Link to="/">Log In</Link>
        </div>
      </>
    );
  } else {
    navigate("/");
    return null;
  }
};

export default Home;
