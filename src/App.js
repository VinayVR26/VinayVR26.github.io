import React, { useEffect, useState } from "react";
import "./tailwindCSS.css";
import "./initial.css";
import "./index.css";
import { Container, Row, Col } from "react-bootstrap";
import { Routes, Route, useLocation } from "react-router-dom";
import { UserAuthContextProvider } from "./context/UserAuthContext";
import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useUserAuth } from "./context/UserAuthContext";
import Login from "./scenes/Authentication/Login";
import Signup from "./scenes/Authentication/Signup";
import VerifyEmailMessage from "./scenes/Authentication/VerifyEmailMessage";
import PasswordReset from "./scenes/Authentication/PasswordReset";
import CreateProfile from "./scenes/Authentication/CreateProfile";
import ProtectedRoute from "./scenes/Authentication/ProtectedRoute";
import Topbar from "./scenes/Topbar/Topbar";
import Dashboard from "./scenes/Dashboard/Dashboard";
import UpdateProfile from "./scenes/UpdateProfile/UpdateProfile";
import Calendar from "./scenes/Calendar/Calendar";
import StockContext from "./context/StockContext";
import Orders from "./scenes/Orders/Orders";
import Settings from "./scenes/Settings/Settings";
import UpdateTotalCashFlow from "./scenes/Background/UpdateTotalCashFlow";
import FillWaitingOrders from "./scenes/Background/FillWaitingOrders";

function App() {
  const [theme, colorMode] = useMode();
  const location = useLocation();
  const [stockSymbol, setStockSymbol] = useState("");

  const isInitialStage = location.pathname === "/" || location.pathname === "/signup" || location.pathname === "/reset-password" || location.pathname === "/create-profile" || location.pathname === "/verify-email-message";

  const { user } = useUserAuth();

  const checkMarketOpen = () => {
    const now = new Date();
    const currentHourSGT = (now.getUTCHours() + 8) % 24 + (now.getUTCMinutes() / 60);
  
    const currentMonth = now.getUTCMonth() + 1;
  
    if ((currentHourSGT <= 4.5 || currentHourSGT >= 21.5) && (currentMonth >= 4 && currentMonth <= 9)) {
      return true;
  
    } else if ((currentHourSGT <= 5.5 || currentHourSGT >= 21.5) && (currentMonth >= 10 || currentMonth <= 3)) {
      return true;
    };
  
    return false;
  };
 
  useEffect(() => {
    if (user && checkMarketOpen()) {
      const interval = setInterval(() => {
        FillWaitingOrders(user);
      }, 30000); 

      return () => clearInterval(interval);
    } 
  }, [user]);

  useEffect(() => {
    if (user && checkMarketOpen()) {
      const interval = setInterval(() => {
        UpdateTotalCashFlow(user);
      }, 30000); 

      return () => clearInterval(interval);
    } 
  }, [user]);


  return (
    <>
      {/* Conditionally add the 'initial-stage' class based on the initial stage */}
      <div className={isInitialStage ? "initial-stage-container" : ""}>
        <Container style={{ width: "400px" }}>
          <Row>
            <Col>
              <UserAuthContextProvider>
                <Routes>
                  {/* Login component is shown when the "/" route is accessed */}
                  <Route path="/" element={<Login />} />
                  {/* Signup component is shown when the "/signup" route is accessed */}
                  <Route path="/signup" element={<Signup />} />
                  {/* Add route for password reset */}
                  <Route path="/reset-password" element={<PasswordReset />} />
                  {/* Add route for verify email message */}
                  <Route path="/verify-email-message" element={<VerifyEmailMessage />} />
                  {/* Add route for creating a profile */}
                  <Route
                    path="/create-profile"
                    element={<CreateProfile />}
                  />
                </Routes>
              </UserAuthContextProvider>
            </Col>
          </Row>
        </Container>
      </div>


      <StockContext.Provider value={{ stockSymbol, setStockSymbol }}>
      {/* Render the Topbar component only if not in the "initial-stage" */}
      {!isInitialStage && (
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
                {/* Wrap the main content in a div */}
                <div className="app">
                  {/* Render the Sidebar component outside the "initial-stage" div */}
                  <main className="content">
                    {/* Render the Topbar component outside the "initial-stage" div */}
                    <Topbar />
                    {/* UserAuthContextProvider provides authentication context to the entire app */}
                    <UserAuthContextProvider>
                      {/* Routes and Route components from react-router-dom handle navigation */}
                      <Routes>
                        {/* ProtectedRoute makes sure the "/home" route is accessible only to logged-in users */}

                        {/* Add route for dashboard */}
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                                        
                        {/* Add route for updating a profile */}
                        <Route
                          path="/update-profile"
                          element={
                            <ProtectedRoute>
                              <UpdateProfile />
                            </ProtectedRoute>
                          }
                        />

                        {/* Add route for orders */}
                        <Route
                          path="/orders"
                          element={
                            <ProtectedRoute>
                              <Orders />
                            </ProtectedRoute>
                          }
                        />

                        {/* Add route for calendar */}
                        <Route
                          path="/calendar"
                          element={
                            <ProtectedRoute>
                              <Calendar />
                            </ProtectedRoute>
                          }
                        />

                        {/* Add route for settings */}
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <Settings />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </UserAuthContextProvider>
                  </main>
                </div>
          </ThemeProvider>
        </ColorModeContext.Provider>
      )}
      </StockContext.Provider>
    </>
  );
}

export default App;
