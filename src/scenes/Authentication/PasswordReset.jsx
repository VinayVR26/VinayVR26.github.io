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
    <div className="p-4 box">
      <h2 className="mb-3">Reset Password</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      <Form onSubmit={handleResetPassword}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>
        <div className="d-grid gap-2">
        <Button className="o-btn" variant="primary" type="submit">
          Reset Password
        </Button>
        </div>
      </Form>
      <div className="p-4 box mt-3 text-center">
        Back to Log in page <Link to="/"><div className="clickableText">Log In</div></Link>
      </div>
    </div>
  );
};

export default PasswordReset;
