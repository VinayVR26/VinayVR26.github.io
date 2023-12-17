import React, { useContext, useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { fetchStockDetails } from "../../utils/api/stock-api";
import StockData from "../StockPage/StockData";
import StockContext from "../../context/StockContext";
import Transaction from "../Transaction/Transaction";
import OrderSummary from "../OrderSummary/OrderSummary";


const StockDataPopup = ({ open, onClose }) => {
  const { stockSymbol } = useContext(StockContext);
  const [stockDetails, setStockDetails] = useState({});
  const [showTransaction, setShowTransaction] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [transactionData, setTransactionData] = useState(null);


  const toggleShowTransaction = () => {
    setShowTransaction(true);
    setShowOrderSummary(false)
    setShowBackButton(true);
  };

  const toggleShowBack = () => {
    setShowTransaction(false);
    setShowOrderSummary(false);
    setShowBackButton(false);
  };

  const toggleShowOrderSummary = () => {
    setShowOrderSummary(true);
    setShowTransaction(false)
    setShowBackButton(false);
  };

  const handleTransactionReview = (data) => {
    setTransactionData(data);
    toggleShowOrderSummary();
  };

  useEffect(() => {
    const updateStockDetails = async () => {
      try {
        const result = await fetchStockDetails(stockSymbol);
        setStockDetails(result);
      } catch (error) {
        setStockDetails({});
        console.log(error);
      }
    };

    updateStockDetails();
  }, [stockSymbol]);

  useEffect(() => {
    if (!open) {
      setShowTransaction(false);
      setShowOrderSummary(false);
      setShowBackButton(false);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth 
    >
      <DialogTitle>{stockDetails.name} ({stockSymbol})</DialogTitle>
      <DialogContent>
        {showTransaction ? (
          <Transaction onReview={handleTransactionReview} onBack={toggleShowBack} />
        ) : showOrderSummary ? (
          <OrderSummary transactionData={transactionData} />
        ) : (
          <StockData onTrade={toggleShowTransaction}  />
        )}
      </DialogContent>
      <DialogActions>
        
        {showBackButton && (
          <Button variant="contained" onClick={toggleShowBack} color="primary">
            BACK
          </Button>
        )}

        {showOrderSummary ? (
          <>
        <Button variant="contained" onClick={() => setShowOrderSummary(false)} color="primary">
          BACK TO STOCK DATA
        </Button>

        <Button variant="contained" onClick={onClose} color="primary">
        CLOSE
        </Button>

          </>
      ) : (
        <Button variant="contained" onClick={onClose} color="primary">
          CLOSE
        </Button>
      )}
      </DialogActions>
    </Dialog>
  );
};

export default StockDataPopup;
