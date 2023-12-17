import React, { useState, useEffect } from "react";
import { fetchQuote } from "../../utils/api/stock-api";
import { ResponsivePie } from "@nivo/pie";
import { useUserAuth } from "../../context/UserAuthContext";
import { tokens } from "../../theme";
import { Typography, useTheme } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";

const PortfolioPieChart = () => {
  const { user } = useUserAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [stocksArray, setStocksArray] = useState([]);
  const [investedAmount, setInvestedAmount] = useState(0);
  const [fundsForTrading, setFundsForTrading] = useState(0);
  const [totalCashFlow, setTotalCashFlow] = useState(0);
  const [reversedStocks, setReversedStocks] = useState();
  const [stockSymbolPrices, setStockSymbolsPrices] = useState({});
  const [stockSymbolUnits, setStockSymbolUnits] = useState({});
  const [info, setInfo] = useState([]);

  const fetchStockQuotes = async () => {
    try {
      const updatedPrices = { ...stockSymbolPrices };

      for (const symbol of stocksArray) {
        const quote = await fetchQuote(symbol);
        updatedPrices[symbol] = quote.c.toFixed(2);
      }

      setStockSymbolsPrices(updatedPrices);
    } catch (error) {
      console.log("Error fetching stock quotes:", error.message);
    }
  };

  const fetchData = async () => {
    try {
      const userDocRef = doc(db, "users", user.email);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        setFundsForTrading(userData.fundsForTrading); 
        setTotalCashFlow(userData.totalCashFlow);
        const investedAmount = parseFloat(userData.totalCashFlow);
        setInvestedAmount(investedAmount)

        const investedStocks = userData.investedStocks || [];
        setStocksArray(investedStocks);

        const existingStocks = userData.stocks || [];
        const reversedStocks = existingStocks.slice().reverse();
        setReversedStocks(reversedStocks);

      }
    } catch (error) {
      console.log("Error fetching data here:", error.message);
    }
  };

  const setData = async () => {
    if (stocksArray.length === Object.keys(stockSymbolUnits).length) {

      const infoData = [];

      for (const ticker of stocksArray) {
        const price = stockSymbolPrices[ticker];
        const units = stockSymbolUnits[ticker];
        const value = (((price * units) / investedAmount) * 100).toFixed(1); 


        const newData = {
          id: ticker,
          label: ticker,
          value: value,
        };

        infoData.push(newData)
      }

      const remainingValue = ((fundsForTrading / totalCashFlow) * 100).toFixed(1);

      const remainingFunds = {
        id: "REMAINING FUNDS",
        label: "REMAINING FUNDS",
        value: remainingValue,
      }

      infoData.push(remainingFunds)

      setInfo(infoData)
    }
  }

  useEffect(() => {
    fetchData();
  }, [user.email]);

  useEffect(() => {
    if (stocksArray.length > 0) {
      const existingUnitsData = { ...stockSymbolUnits}
      for (const symbol of stocksArray) {
        const stockData = reversedStocks.find((stock) => stock.stockSymbol === symbol);
        existingUnitsData[symbol] = stockData.latestUnits
      }
      setStockSymbolUnits(existingUnitsData)
    }
  }, [stocksArray])

  useEffect(() => {
    if (Object.keys(stockSymbolUnits).length > 0) {
      fetchStockQuotes();
    }
  }, [stockSymbolUnits])

  useEffect(() => {
    if (Object.keys(stockSymbolPrices).length > 0) {
      setData()
    }
  }, [stockSymbolPrices])


  return info.length > 0 ? ( // not info ? because an empty array is still truthy
    <ResponsivePie
      data={info}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
      }}
      margin={{ top: 25, right: 80, bottom: 60, left: 180 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderColor={{
        from: "color",
        modifiers: [["darker", 0.2]],
      }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={colors.grey[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      arcLabelsRadiusOffset={0.4}
      arcLabelsSkipAngle={7}
      arcLabelsTextColor={{
        from: "color",
        modifiers: [["darker", 2]],
      }}

      tooltip={({ datum }) => {
        const infoItem = info.find(item => item.id === datum.id);
        if (infoItem) {
          return (
            <div style={{ background: 'white', padding: '10px', border: '1px solid #ccc' }}>
              <div><strong style={{ color: 'green' }}>Name:</strong> <span style={{ color: 'green' }}>{infoItem.id}</span></div>
              <div><strong style={{ color: 'green' }}>Value:</strong> <span style={{ color: 'green' }}>{infoItem.value + '%'}</span></div>
            </div>
          );
        }
        return null; // Handle the case where no matching info item is found
      }}

      defs={[
        {
          id: "dots",
          type: "patternDots",
          background: "inherit",
          color: "rgba(255, 255, 255, 0.3)",
          size: 4,
          padding: 1,
          stagger: true,
        },
        {
          id: "lines",
          type: "patternLines",
          background: "inherit",
          color: "rgba(255, 255, 255, 0.3)",
          rotation: -45,
          lineWidth: 6,
          spacing: 10,
        },
      ]}
      
    />
  ) : (
    <Typography>Nothing to display</Typography>
  );
};

export default PortfolioPieChart;