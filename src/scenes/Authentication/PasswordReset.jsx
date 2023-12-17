import React, { useState } from "react";
import "../../../src/index.css"
import { Form, Button, Alert } from "react-bootstrap";
import { useUserAuth } from "../../context/UserAuthContext";
import { Link } from "react-router-dom";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { resetPassword } =  useUserAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await resetPassword(email);
      setMessage("Password reset email sent. Please check your inbox.");
    } catch (error) {
      setError("Error sending password reset email. Please try again.");
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      <Form onSubmit={handleResetPassword}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Reset Password
        </Button>
      </Form>
      <div className="p-4 box mt-3 text-center">
        Back to Log in page <Link to="/">Log In</Link>
      </div>
    </div>
  );
};

export default PasswordReset;
