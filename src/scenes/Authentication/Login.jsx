import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import { Button } from "react-bootstrap";
import GoogleButton from "react-google-button";
import { useUserAuth } from "../../context/UserAuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { db, auth } from "../Firebase/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { logIn, googleSignIn, user } = useUserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await logIn(email, password);

      const userInfo = userCredential.user;
      
      const userDocRef = doc(db, "users", email);
      console.log("Email added here");
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().username) {
        navigate("/dashboard");

      } else if (userDocSnap.exists()) {
        navigate("/create-profile");

      } else {
        navigate("/verify-email-message");

      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      await googleSignIn();
      const currentUser = auth.currentUser;
      const userDocRef = doc(db, "users", currentUser.email);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        navigate("/create-profile");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handlePasswordToggle = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  }

  return (
    <>
      {/* Display the login form */}
      <div className="p-4 box">
        <h2 className="mb-3">Welcome to Securities Trading</h2>
        {/* Display any error message */}
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Control
              type="email"
              placeholder="Email address"
              // Update the email state when the input value changes
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <div className="input-group">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                // Update the password state when the input value changes
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-link"
                onClick={handlePasswordToggle}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </Form.Group>

          {/* Submit button to log in using email/password */}
          <div className="d-grid gap-2">
            <Button className="o-btn" variant="primary" type="Submit">
              Log In
            </Button>
          </div>
        </Form>
        <hr />
        {/* Google Sign-In button */}
        <div>
          <GoogleButton
            className="g-btn"
            type="dark"
            // Call the handleGoogleSignIn function when the Google Sign-In button is clicked
            onClick={handleGoogleSignIn}
          />
        </div>
      </div>
      {/* Link to the signup page */}
      <div className="p-4 box mt-3 text-center">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
      <div className="p-4 box mt-3 text-center">
        Forgot your password? <Link to="/reset-password">Reset password</Link>
      </div>
    </>
  );
};

export default Login;