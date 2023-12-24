import React, { useContext, useEffect, useState, useRef } from "react";
import Card from "../Cards/Card";
import { fetchHistoricalData, fetchQuote, subscribeQuote } from "../../utils/api/stock-api";
import StockContext from "../../context/StockContext";
import _ from 'lodash';

const Overview = ({ symbol, currency, filter }) => {
  const { stockSymbol } = useContext(StockContext);
  const [quote, setQuote] = useState({ pc: 0, d: 0, dp: 0 });


  const checkIfMarketIsOpen = () => {
    const now = new Date();
    const currentHourSGT = (now.getUTCHours() + 8) % 24 + (now.getUTCMinutes() / 60); // Convert UTC to SGT

    const currentMonth = now.getUTCMonth() + 1; // Adding 1 to get month in range 1-12
    
    let isMarketOpen = false;

    if ((currentHourSGT <= 4 || currentHourSGT >= 21.5) && (currentMonth >= 4 && currentMonth <= 9) && now.getDay() != 0) {
      // Market open for April to September between 4:30 PM to 9:30 AM (SGT)
      isMarketOpen = true;
    } else if ((currentHourSGT <= 5 || currentHourSGT >= 21.5) && (currentMonth >= 10 || currentMonth <= 3) && now.getDay() != 0) {
      // Market open for October to March between 5:30 PM to 10:30 AM (SGT)
      isMarketOpen = true;
    }

    return isMarketOpen;
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const calculateDateValueForFilter = (filter) => {
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now); // today's date

    if (filter === "1D") {
      if (startDate.getDay() === 0) {
        startDate.setDate(now.getDate() - 2);
      } else if (startDate.getDay() === 1) {
        startDate.setDate(now.getDate() - 3);
      } else {
        startDate.setDate(now.getDate() - 1);
      }
    } else if (filter === "1W") {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "1M") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (filter === "1Y") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const startDateValue = formatDate(startDate)
    const endDateValue = formatDate(endDate)
    return { startDateValue, endDateValue };
  };


  // Fetch historical data using appropriate dates and resolution
  const fetchAndSetData = async () => {
    
    const { startDateValue, endDateValue } = calculateDateValueForFilter(filter);
    let resolution = "D"; // Default to daily resolution

    try {
      const info = await fetchHistoricalData(
        stockSymbol,
        resolution,
        startDateValue,
        endDateValue
      );

      console.log("INFO", info);
      let lastIndex = (info.c).length - 1
      let endPrice = parseFloat(info.c[lastIndex].toFixed(2)); // most recent price
      let startPrice = parseFloat(info.c[0].toFixed(2)); // most oldest price

      const isMarketOpen = checkIfMarketIsOpen();

      if (!isMarketOpen) {

        if (filter === "1D") {
          const quote = await fetchQuote(stockSymbol);
          setQuote((prevQuote) => ({
            ...prevQuote,
            pc: quote.c.toFixed(2),
            d: quote.d.toFixed(2),
            dp: quote.dp.toFixed(2),
          }));
        } else {
          setQuote((prevQuote) => ({
            ...prevQuote,
            pc: endPrice.toFixed(2),
            d: (endPrice - startPrice).toFixed(2),
            dp: parseFloat(((endPrice - startPrice) / startPrice) * 100).toFixed(2),
          }));
        }
      } else {
        return startPrice;
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const throttledFetchAndSetData = _.throttle(fetchAndSetData, 4000); // 1 request every 4 seconds

    const isMarketOpen = checkIfMarketIsOpen();

    if (isMarketOpen) { // Timing to get real-time updates

      // Set up WebSocket connection for real-time updates
      const socket = subscribeQuote(stockSymbol);

      socket.onmessage = async (event) => {
        // Handle real-time updates received from WebSocket
        const data = JSON.parse(event.data);
        if (data.type === "trade" && data.data[0]?.s === stockSymbol) {
          const currentPrice = parseFloat(data.data[0].p.toFixed(2));

          let endPrice = await throttledFetchAndSetData(); // Use throttled function
          
          if (filter === "1D") {
            setQuote((prevQuote) => ({
              ...prevQuote,
              pc: currentPrice.toFixed(2),
              d: (currentPrice - endPrice).toFixed(2),
              dp: parseFloat(((currentPrice - endPrice) / endPrice) * 100).toFixed(2),
            })); 
          } else if (filter === "1W") {
            setQuote((prevQuote) => ({
              ...prevQuote,
              pc: currentPrice.toFixed(2),
              d: (currentPrice - endPrice).toFixed(2),
              dp: parseFloat(((currentPrice - endPrice) / endPrice) * 100).toFixed(2),
            })); 
          } else if (filter === "1M") {
            setQuote((prevQuote) => ({
              ...prevQuote,
              pc: currentPrice.toFixed(2),
              d: (currentPrice - endPrice).toFixed(2),
              dp: parseFloat(((currentPrice - endPrice) / endPrice) * 100).toFixed(2),
            })); 
          } else if (filter === "1Y") {
            setQuote((prevQuote) => ({
              ...prevQuote,
              pc: currentPrice.toFixed(2),
              d: (currentPrice - endPrice).toFixed(2),
              dp: parseFloat(((currentPrice - endPrice) / endPrice) * 100).toFixed(2),
            })); 
          }
        }
      };

      // Clean up the WebSocket connection on component unmount
      return () => {
        socket.close();
      };
    } else {
      fetchAndSetData();
    }
  }, [stockSymbol, filter]);


  return (
    <Card>
      <span className="absolute left-4 top-2 text-neutral-400 text-lg xl:text-xl 2xl:text-1xl">
        {symbol}
      </span>
      <div className="w-full h-full flex items-center justify-around">
        <span className="text-2xl xl:text-4xl 2xl:text-2xl flex items-center">
          ${quote.pc}
          <span className="text-lg xl:text-xl 2xl:text-1xl text-neutral-400 m-2">
            {currency}
          </span>
        </span>
        <span
          className={`text-lg xl:text-xl 2xl:text-2xl ${
            quote.d > 0 ? "text-lime-500" : "text-red-500"
          }`}
        >
          {quote.d && quote.dp ? (
            <>
              {parseFloat(quote.d).toFixed(2)} <span>({parseFloat(quote.dp).toFixed(2)}%)</span>
            </>
          ) : (
            "N/A"
          )}
        </span>
      </div>
    </Card>
  );
};

export default Overview;