import React, { useState } from "react";
import "../../../src/index.css"
import { Link } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useUserAuth } from "../../context/UserAuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { signUp, user } = useUserAuth();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return;
    }
    try {
      await signUp(email, password);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPasswordTouched(true);
    setError("");
    setConfirmPassword(e.target.value);
  };

   const handleShowPasswordsChange = () => {
    setShowPasswords((prevShowPasswords) => !prevShowPasswords);
  };
  
  return (
    <>
        <div className="p-4 box">
          <h2 className="mb-3">Firebase Auth Signup</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {showSuccess && <Alert variant="success">Sign up successful! Please check your email for the verification link.</Alert>}
          <Form onSubmit={handleSignUp}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Control
                type="email"
                placeholder="Email address"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
    
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Control
                type={showPasswords ? "text" : "password"}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
    
            <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
              <Form.Control
                type={showPasswords ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              {confirmPasswordTouched && password !== confirmPassword && (
                <Alert variant="danger">Passwords do not match.</Alert>
              )}
            </Form.Group>
    
            <Form.Group className="showPassword" controlId="formBasicShowPasswords">
              <Form.Check
                type="checkbox"
                label="Show passwords"
                onChange={handleShowPasswordsChange}
              />
            </Form.Group>
    
            <div className="d-grid gap-2">
              <Button className="o-btn" variant="primary" type="submit">
                Sign up
              </Button>
            </div>
          </Form>
        </div>
      <div className="p-4 box mt-3 text-center">
        Already have an account? <Link to="/"><div className="clickableText">Log In</div></Link>
      </div>
    </>
  );
};

export default Signup;