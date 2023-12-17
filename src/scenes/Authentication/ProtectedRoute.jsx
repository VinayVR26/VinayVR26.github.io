import React from "react";
import { Navigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";

const ProtectedRoute = ({ children }) => { // This line defines the ProtectedRoute component as an arrow function that takes a single parameter children. In React, children is a special prop that represents the content nested within the component's opening and closing tags. In this case, the ProtectedRoute component is expected to wrap other components that need protection (i.e., can only be accessed by authenticated users).

  const { user } = useUserAuth(); 

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute; 
