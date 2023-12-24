import React, { useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import { Button } from '@mui/material';
import StockContext from '../../context/StockContext';
import { useUserAuth } from '../../context/UserAuthContext';
import { fetchQuote, subscribeQuote } from '../../utils/api/stock-api';
import CardNoBorder from '../Cards/CardNoBorder';

const Transaction = ({ onReview }) => {

  const { user } = useUserAuth();
  const { stockSymbol } = useContext(StockContext);

  const [action, setAction] = useState('buy');
  const [quantity, setQuantity] = useState('0');
  const [quantityError, setQuantityError] = useState('');
  const [buyError, setBuyError] = useState('');
  const [sellError, setSellError] = useState('');
  const [limitPriceError, setLimitPriceError] = useState('');

  const [tradeType, setTradeType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState(0);
  const [tif, setTif] = useState('Day');
  const [username, setUsername] = useState("");
  
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  const [fundsForTrading, setFundsForTrading] = useState(0);
  const [updatedFundsForTrading, setUpdatedFundsForTrading] = useState(0);

  const [currentUnits, setCurrentUnits] = useState(0);
  const [newUnits, setNewUnits] = useState(0);

  const [transactionData, setTransactionData] = useState(null);


  // Fetch the user's profile from Firestore based on their email
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfileRef= doc(db, "users", user.email);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data();
          setUsername(userProfileData.username || "");
          setFundsForTrading(parseFloat(userProfileData.fundsForTrading) || 0); // most updated remaining funds for trading are obtained (Not from stocks array)

          // Reverse the stocks array to get the latest data first
          const reversedStocks = userProfileData.stocks.slice().reverse();
          const stockData = reversedStocks.find((stock) => stock.stockSymbol === stockSymbol);

          if (stockData) {
            // Found the latest data for the stock being traded
            setCurrentUnits(parseInt(stockData.latestUnits, 10) || 0);
          } else {
            // If the stock symbol is not found, assume the current units are 0
            setCurrentUnits(0);
          }
        }
      } catch (error) {
        console.log("Error fetching data:", error.message);
      }
    };

    fetchUserProfile();
  }, [user, stockSymbol]);

  // Function to fetch real-time data for the stock
  const fetchStockQuote = async () => {
    try {
      const quote = await fetchQuote(stockSymbol);
      setPricePerUnit(quote.c);
    } catch (error) {
      console.log('Error fetching stock quote:', error.message);
    }
  };

  const fetchStockQuoteForLimit = async () => {
    try {
      const quote = await fetchQuote(stockSymbol);
      setLimitPrice(quote.c);
    } catch (error) {
      console.log('Error fetching stock quote:', error.message);
    }
  }

  useEffect(() => {
    if (tradeType === 'LIMIT') {
      // Fetch real-time data for the stock when trade type is LIMIT
      fetchStockQuoteForLimit();
    }
  }, [tradeType]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Fetch real-time data for the stock on initial mount
    fetchStockQuote();

    const now = new Date();
    const currentHourSGT = (now.getUTCHours() + 8) % 24 + (now.getUTCMinutes() / 60);

    const currentMonth = now.getUTCMonth() + 1;

    if (isMarketOpen()) {
      // WebSocket connection for real-time updates
      const socket = subscribeQuote(stockSymbol);

      socket.onmessage = (event) => {
        // Handle real-time updates received from WebSocket
        const data = JSON.parse(event.data);
        if (data.type === "trade" && data.data[0]?.s === stockSymbol) {
          const newPricePerUnit = parseFloat(data.data[0].p.toFixed(2));
          setPricePerUnit(newPricePerUnit);
        }
      };

      // Clean up the WebSocket connection on component unmount
      return () => {
        socket.close();
      };
    }
    
  }, [stockSymbol]);

  // Function to calculate totalPrice based on quantity and price per unit
  const calculateTotalPrice = () => {
    if (quantity !== '' && pricePerUnit) {
      const parsedQuantity = parseInt(quantity);
      if (!isNaN(parsedQuantity)) {
        return (parsedQuantity * parseFloat(pricePerUnit));
      }
    }
    return 0;
  };

  // Function to calculate new funds for trading based on action and totalPrice
  const calculateNewFundsForTrading = () => {
    const newTotalPrice = calculateTotalPrice(); // Use the updated totalPrice
    if (action === 'buy') {
      return (parseFloat((parseFloat(fundsForTrading) - parseFloat(newTotalPrice)).toFixed(2)));
    } else if (action === 'sell') {
      return (parseFloat((parseFloat(fundsForTrading) + parseFloat(newTotalPrice)).toFixed(2)));
    }
    return parseFloat((fundsForTrading).toFixed(2));
  };

  // Function to calculate new units of stock held based on action and quantity
  const calculateNewUnits = () => {
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity)) {
      return currentUnits; 
    }
    else {
      if (action === 'buy') {
        return parseInt((currentUnits + parsedQuantity), 10);
      } else if (action === 'sell') {
        return parseInt((currentUnits - parsedQuantity), 10);
      }
    }
  };

  // Update totalPrice and newFundsForTrading whenever quantity, pricePerUnit, action, or fundsForTrading changes
  useEffect(() => {
    // If quantity is empty or not a valid number, set it to 0
    const parsedQuantity = parseFloat(quantity);
    if (!isNaN(parsedQuantity) || quantity === '') {
      const newTotalPrice = calculateTotalPrice().toFixed(2);
      setTotalPrice(parseFloat(newTotalPrice));
      const newFundsForTrading = calculateNewFundsForTrading();
      // Consider current units and new quantity tgt to calculate newUnits
      const newTotalUnits =  calculateNewUnits();

      if (action === "buy") {
        if (newFundsForTrading >= 0 && totalPrice <= updatedFundsForTrading && newTotalUnits >= 0) {
          setUpdatedFundsForTrading(newFundsForTrading);
          setNewUnits(newTotalUnits);
        } else {
          setUpdatedFundsForTrading(fundsForTrading);
          setNewUnits(currentUnits);
        }
      } else { // action = sell
        if (parsedQuantity <=  currentUnits && newTotalUnits >= 0) {
          setUpdatedFundsForTrading(newFundsForTrading);
          setNewUnits(newTotalUnits);
        } else {
          setUpdatedFundsForTrading(fundsForTrading);
          setNewUnits(currentUnits);
        }
      }
    }
  }, [quantity, pricePerUnit, action, fundsForTrading, currentUnits]);

  const handleQuantityChange = (e) => {
    const inputValue = e.target.value;
    // Remove any non-digit characters and set the sanitized value
    setQuantity(inputValue.replace(/\D/g, ''));
    setQuantityError(''); // Clear any previous quantity error message
    setBuyError(''); // Clear any previous buy error message
    setSellError(''); // Clear any previous sell error message
  };

  const handleLimitPriceChange = (e) => {
    const inputValue = e.target.value;
    setLimitPrice(inputValue.replace(/[^\d.]/g, ''));
    setLimitPriceError('');
  }


  const handleReview = async () => { // AFTER BUTTON IS CLICKED

    const userQtyInput = parseInt(quantity, 10);  // what the user has typed in

    if (quantity === '' || isNaN(userQtyInput)) {
      setQuantityError("Quantity field cannot be left blank");
      return;

    } else if (userQtyInput === 0) {
      setQuantityError("Quantity cannot be 0")
      return;
    }

    if (action === "buy" && parseFloat((userQtyInput * pricePerUnit).toFixed(2)) > parseFloat(fundsForTrading)) {
      setBuyError("You do not have enough funds for this transaction");
      return;
    }

    if (action === "sell" && userQtyInput > currentUnits) {
      setSellError("You cannot sell more units than you have");
      return;
    }

    if (String(limitPrice).startsWith(".")) {
      setLimitPriceError("Invalid Price");
      return;
    }

    const decimalCount = String(limitPrice).split(".").length - 1;
    if (decimalCount > 1) {
      setLimitPriceError("Invalid price");
      return;
    }

    const newUnitsAfterTransaction = calculateNewUnits();

    try {
      const transactionData = {
        stockSymbol,
        pricePerUnit: parseFloat(pricePerUnit),
        latestUnits: newUnitsAfterTransaction,
        action,
        tradeType,
        tif,
        account: username,
        latestFundsForTrading: parseFloat(updatedFundsForTrading),
      };

      // Fetch user's existing stocks array
      const userProfileRef = doc(db, 'users', user.email);
      const userProfileSnap = await getDoc(userProfileRef);
      const userProfileData = userProfileSnap.data();
      const existingStocks = userProfileData.stocks || [];
      const existingWaitStocks = userProfileData.waitStocks || [];
      let existingInvestedStocks = userProfileData.investedStocks || [];

      // Add unitsBought and unitsSold fields based on the action
      if (action === 'buy' && tradeType === "MARKET") {
        transactionData.unitsBoughtInTransaction = userQtyInput;
        transactionData.unitsSoldInTransaction = 0;
        transactionData.expenditureOfTransaction = totalPrice;
        transactionData.returnsFromTransaction = 0;
      } else if (action === "sell" && tradeType === "MARKET") {
        transactionData.unitsBoughtInTransaction = 0;
        transactionData.unitsSoldInTransaction = userQtyInput;
        transactionData.expenditureOfTransaction = 0;
        transactionData.returnsFromTransaction = totalPrice;
      } else if (action === "buy" && tradeType === "LIMIT") {
        transactionData.unitsBoughtInTransaction = userQtyInput;
        transactionData.unitsSoldInTransaction = 0;
        transactionData.expenditureOfTransaction = 0;
        transactionData.returnsFromTransaction = 0;
      } else if (action === "sell" && tradeType === "LIMIT") {
        transactionData.unitsBoughtInTransaction = 0;
        transactionData.unitsSoldInTransaction = userQtyInput;
        transactionData.expenditureOfTransaction = 0;
        transactionData.returnsFromTransaction = 0;
      }

      const reversedStocks = existingStocks.slice().reverse();
      const stockData = reversedStocks.find((stock) => stock.stockSymbol === stockSymbol); // Find the most updated data of transaction of the stock

      if (!stockData) {
        if (action === "buy" && tradeType === "MARKET") {
          transactionData.totalExpenditureOnStock = totalPrice;
          transactionData.totalReturnsFromStock = 0;
          transactionData.totalUnitsBought = userQtyInput;
          transactionData.totalUnitsSold = 0;
          transactionData.averagePriceSpent = parseFloat((totalPrice / userQtyInput).toFixed(2));

          if (!existingInvestedStocks.includes(stockSymbol)) {
            existingInvestedStocks.push(stockSymbol)
          }
        }
      } else {
        if (action === "buy" && tradeType === "MARKET") {
          transactionData.totalExpenditureOnStock = parseFloat((totalPrice + stockData.totalExpenditureOnStock).toFixed(2));
          transactionData.totalReturnsFromStock = stockData.totalReturnsFromStock;
          transactionData.totalUnitsBought = userQtyInput + stockData.totalUnitsBought;
          transactionData.totalUnitsSold = stockData.totalUnitsSold;
          transactionData.averagePriceSpent = parseFloat((transactionData.totalExpenditureOnStock / transactionData.totalUnitsBought).toFixed(2));

          if (!existingInvestedStocks.includes(stockSymbol)) {
            existingInvestedStocks.push(stockSymbol)
          }
          
        } else if (action === "sell" && tradeType === "MARKET") {
          transactionData.totalExpenditureOnStock = stockData.totalExpenditureOnStock;
          transactionData.totalReturnsFromStock = totalPrice + stockData.totalReturnsFromStock;
          transactionData.totalUnitsBought = stockData.totalUnitsBought;
          transactionData.totalUnitsSold = userQtyInput + stockData.totalUnitsSold;
          transactionData.averagePriceSpent = stockData.averagePriceSpent;

          if (newUnitsAfterTransaction === 0) {
            existingInvestedStocks = existingInvestedStocks.filter(ticker => {
              return ticker !== stockSymbol;
            })
          }
        }
      }

      const currentDate = new Date();


      if (tradeType === "MARKET") {
        transactionData.order = "FILLED";  
        transactionData.date = currentDate
        existingStocks.push(transactionData);

        
        // Update the user's stocks array and fundsForTrading
        await updateDoc(userProfileRef, {
          fundsForTrading: parseFloat(updatedFundsForTrading),
          stocks: existingStocks,
          investedStocks: existingInvestedStocks
        });

        setTransactionData(transactionData);
        onReview(transactionData);
        

      } else if (tradeType === "LIMIT") {
        transactionData.order = "WAITING";  
        transactionData.limitPrice = limitPrice;
        const now = new Date();
        const id = now.toISOString();
        transactionData.id = id;
        transactionData.date = currentDate
        existingWaitStocks.push(transactionData);

        // Update the user's waitStocks array and fundsForTrading
        await updateDoc(userProfileRef, {
          waitStocks: existingWaitStocks,
        });

        setTransactionData(transactionData);
        onReview(transactionData);

      }
    } catch (error) {
      console.log('Error storing transaction data:', error.message);
    }

  };

  const isMarketOpen = () => {
    const now = new Date();
    const currentHourSGT = (now.getUTCHours() + 8) % 24 + (now.getUTCMinutes() / 60); // Convert UTC to SGT
  
    const currentMonth = now.getUTCMonth() + 1; // Adding 1 to get month in range 1-12
  
    if ((currentHourSGT <= 4.5 || currentHourSGT >= 21.5) && (currentMonth >= 4 && currentMonth <= 9) && now.getDay() != 0) {
      // Market open for April to September between 9:30 PM to 4:30 AM (SGT)
      return true;
  
    } else if ((currentHourSGT <= 5.5 || currentHourSGT >= 21.5) && (currentMonth >= 10 || currentMonth <= 3) && now.getDay() != 0) {
      // Market open for October to March between 10:30 PM to 5:30 AM (SGT)
      return true;
    };
  
    return false;
  };

  return (
    <CardNoBorder>
    <div>
      <div>{stockSymbol}</div>
      <div>Price per unit: {pricePerUnit}</div>
      <div>Total Price: {totalPrice}</div>
      <div>New funds for trading: {updatedFundsForTrading}</div>
      <div>Current units of {stockSymbol} held: {currentUnits}</div>
      <div>New units of {stockSymbol} held: {newUnits}</div>
      <Form>
        <Form.Group controlId="action">
          <Form.Label>Action</Form.Label>
          <Form.Control as="select" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="quantity">
          <Form.Label>Quantity</Form.Label>
          <Form.Control type="text" value={quantity} onChange={handleQuantityChange} />
          {/* Display the error message if quantityError or buyError or sellError are truthy */}
          {quantityError && <div className="text-danger">{quantityError}</div>}
          {buyError && <div className="text-danger">{buyError}</div>}
          {sellError && <div className="text-danger">{sellError}</div>}
        </Form.Group>
        <Form.Group controlId="tradeType">
          <Form.Label>Type of Trade</Form.Label>
          <Form.Control as="select" value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
            <option value="MARKET">MARKET</option>
            <option value="LIMIT">LIMIT</option>
          </Form.Control>
        </Form.Group>
        {tradeType === "LIMIT" && (
          <Form.Group controlId="limitPrice">
            <Form.Label>Limit Price</Form.Label>
            <Form.Control type="text" value={limitPrice} onChange={handleLimitPriceChange}/>
            {/* Display the error message if limitPriceError is truthy */}
            {limitPriceError && <div className="text-danger">{limitPriceError}</div>}
          </Form.Group>
        )}
        <Form.Group controlId="tif">
          <Form.Label>TIF</Form.Label>
          <Form.Control as="select" value={tif} onChange={(e) => setTif(e.target.value)}>
            <option value="Day">Day</option>
            <option value="GTC">GTC</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="account">
          <Form.Label>Account</Form.Label>
          <Form.Control type="text" value={username} readOnly />
        </Form.Group>
        {isMarketOpen() && (
          <Button variant="contained" onClick={handleReview}>Review</Button>
        )}
      </Form>
      </div>
    </CardNoBorder>
  );
};

export default Transaction;
