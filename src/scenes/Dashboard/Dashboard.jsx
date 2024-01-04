import React, { useState, useEffect } from "react";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { fetchQuote, fetchGeneralNews } from "../../utils/api/stock-api";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { Link } from "react-router-dom";
import "../../index.css";
import Header from "../Header/Header";
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TCFLineChart from "../TCFLineChart/TCFLineChart";
import PortfolioPieChart from "../PortfolioPieChart/PortfolioPieChart"
import StatBox from "./StatBox";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import _ from 'lodash';
import { useMediaQuery } from "@mui/material";


const Dashboard = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [username, setUsername] = useState("");
  const [fundsForTrading, setFundsForTrading] = useState(0);
  const [totalCashFlow, setTotalCashFlow] = useState(0);
  const [ratio, setRatio] = useState(0.5);
  const [transactionData, setTransactionData] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [percentageChange, setPercentageChange] = useState({});
  const [newsData, setNewsData] = useState({});


  const [invested, setInvested] = useState([]);
  const [investedPrices, setInvestedPrices] = useState({});
  const [investedChange, setInvestedChange] = useState({});
  const [mostPositive, setMostPositive] = useState({ symbol: "", change: 0 });
  const [mostNegative, setMostNegative] = useState({ symbol: "", change: 0 });

  const [ranOnce, setRanOnce] = useState(false);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  

  const checkIfMarketIsOpen = () => {
    const now = new Date();
    const currentHourSGT = (now.getUTCHours() + 8) % 24 + (now.getUTCMinutes() / 60);
    const currentMonth = now.getUTCMonth() + 1;
    let isMarketOpen = false;

    if ((currentHourSGT <= 4 || currentHourSGT >= 21.5) && (currentMonth >= 4 && currentMonth <= 9)) {
      isMarketOpen = true;

    } else if ((currentHourSGT <= 5 || currentHourSGT >= 21.5) && (currentMonth >= 10 || currentMonth <= 3)) {
      isMarketOpen = true;
    }

    return isMarketOpen;
  }

  const fetchForInvested = async () => {
    try {
      const updatedInvestedPrices = { ...investedPrices}
      const updatedInvestedChange = { ...investedChange}

      for (const symbol of invested) {
        const quote = await fetchQuote(symbol);
        updatedInvestedPrices[symbol] = quote.c.toFixed(2)
        updatedInvestedChange[symbol] = quote.dp.toFixed(2)
      }

      setInvestedPrices(updatedInvestedPrices)
      setInvestedChange(updatedInvestedChange)

    } catch (error) {
      console.log("Error fetching stock quotes:", error.message);
    }
  };

  const fetchStockQuotes = async () => {
    try {
      const updatedPrices = { ...stockPrices };
      const updatedPercentage = { ...percentageChange};

      for (const symbol of favourites) {
        const quote = await fetchQuote(symbol);
        updatedPrices[symbol] = quote.c.toFixed(2);
        updatedPercentage[symbol] = quote.dp;
      }

      setStockPrices(updatedPrices);
      setPercentageChange(updatedPercentage);
    } catch (error) {
      console.log("Error fetching stock quotes:", error.message);
    }
  };

  const setNews = async () => {
    try {
      const results = await fetchGeneralNews();
      const extractedData = [];
      for (const article of results) {
        const { headline, datetime, image, summary, url } = article; 
        const formattedDate = new Date(datetime * 1000);
        const dd = String(formattedDate.getDate()).padStart(2, '0');
        const mm = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const yyyy = formattedDate.getFullYear();
        const formattedDatetime = `${dd}-${mm}-${yyyy}`;


        extractedData.push({ headline, datetime: formattedDatetime, image, summary, url });
        
      }


      setNewsData(extractedData);
  
    } catch (error) {
      console.error(error);
    }
  };


  
  const fetchData = async () => {
    try {
      const userDocRef = doc(db, "users", user.email);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUsername(userDocSnap.data().username || "");
        const userData = userDocSnap.data();
        setFundsForTrading(userData.fundsForTrading || 0);
        setTotalCashFlow(userData.totalCashFlow || 0);
        const value = (fundsForTrading / (fundsForTrading + totalCashFlow))
        setRatio(value)
        const existingStocks = userData.stocks || [];
        const existingWaitStocks = userData.waitStocks || [];
        const mergedStocks = [...existingStocks, ...existingWaitStocks];

        mergedStocks.sort((a, b) => b.date.toDate() - a.date.toDate());

        const formattedMergedStocks = mergedStocks.map((stock) => {
          const date = stock.date.toDate();
          const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
          return { ...stock, date: formattedDate };
        }); 
        setTransactionData(formattedMergedStocks);

        const favouritesArray = userData.favorites || [];
        setFavourites(favouritesArray);

        const investedStocks = userData.investedStocks || [];
        setInvested(investedStocks);

      }
    } catch (error) {
      console.log("Error fetching data:", error.message);
    }
  };

    useEffect(() => {
      fetchData();
      setNews();
    }, [user.email]);

    useEffect(() => {
      if (favourites.length > 0) {
        const isMarketOpen = checkIfMarketIsOpen();
        if (isMarketOpen) {
          if (!ranOnce) {
            fetchStockQuotes();
            setRanOnce(true);
          } 
          const interval = setInterval(() => {
          fetchStockQuotes();
        }, 10000); 

        return () => clearInterval(interval);
        } else {
          fetchStockQuotes();
        }
      }
    }, [favourites]);

    useEffect(() => {
      if (invested.length > 0) {
        fetchForInvested();
        const interval = setInterval(() => {
          fetchForInvested();
        }, 5000); 

        return () => clearInterval(interval);
      }
    }, [invested]);

    useEffect(() => {
      const calculateMostPositiveAndNegativeChange = () => {
        if (Object.keys(investedChange).length > 0) {
          let maxPositiveChange = -Infinity;
          let minNegativeChange = Infinity;
          let mostPositiveStock = "";
          let mostNegativeStock = "";
  
          for (const symbol in investedChange) {
            const change = parseFloat(investedChange[symbol]);
  
            if (change > maxPositiveChange) {
              mostPositiveStock = symbol;
              maxPositiveChange = change;
            }
  
            if (change < minNegativeChange) {
              mostNegativeStock = symbol;
              minNegativeChange = change;
            }
          }
  
          setMostPositive({ symbol: mostPositiveStock, change: maxPositiveChange });
          setMostNegative({ symbol: mostNegativeStock, change: minNegativeChange });
        }
      };
  
      calculateMostPositiveAndNegativeChange();
    }, [investedChange]);


    const cancelOrder = async order => {
      try {
        const userProfileRef = doc(db, 'users', user.email);
        const userProfileSnap = await getDoc(userProfileRef);
        const userProfileData = userProfileSnap.data();
        const existingWaitStocks = userProfileData.waitStocks || [];
        const existingCancelledStocks = userProfileData.cancelStocks || [];
  
        if (order.order === "WAITING") {
          order.order = "CANCELLED";
          existingCancelledStocks.push(order);
          const updatedWaitStocks = existingWaitStocks.filter(waitStock => waitStock.id != order.id);

          setTransactionData((prevData) => prevData.filter((transaction) => transaction.id !== order.id));
  
          await updateDoc(userProfileRef, {
            waitStocks: updatedWaitStocks,
            cancelStocks: existingCancelledStocks,
          });

  
         }
      } catch (error) {
        console.log('Error cancelling order:', error.message);
      }
    };


  if (user && user.emailVerified) {
    return (
      <Box m="20px">
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Header title={
          <div>
            <span>WELCOME {username} </span>
          </div>} />
        </Box>
        
        <Box
          display="grid"
          gridTemplateColumns={`repeat(${isSmallScreen ? 12 : 12}, 1fr)`}
          gridAutoRows="140px"
          gap="20px"
        >
          {/* Account info */}
          <Box
            gridColumn="span 6"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={
                <div>
                  <span>Funds for trading: </span>
                  <span style={{ color: colors.blueAccent[500] }}>{fundsForTrading}</span>
                  <br />
                  <span>Total cash flow: </span>
                  <span style={{ color: colors.greenAccent[500] }}>{totalCashFlow}</span>
                </div>
              }
              subtitle=""
              progress={`${ratio}`}
              increase=""
              icon={
                <MonetizationOnIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px", marginTop: "-25px"}}
                />
              }
            />
          </Box>

          <Box
            gridColumn="span 6"
            backgroundColor={colors.primary[400]}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <StatBox
              title={
              <div>
                <div style={{ marginBottom: '15px' }}>
              <span>Best and Worst performers</span>
                </div>

              {invested.length === 1 ? (
                <div>
                <Typography variant="h6" color="textPrimary">
                  {`${invested[0]} `}
                  <span
                    style={{
                      color:
                        investedChange[invested[0]] > 0
                          ? colors.greenAccent[500]
                          : investedChange[invested[0]] < 0
                          ? colors.redAccent[500]
                          : 'white',
                    }}
                  >
                    {`(${investedChange[invested[0]]}%)`}
                  </span>
                </Typography>
              </div>
        ) : invested.length > 1 ? (
          <div>
            {mostPositive.symbol && (
              <div>
                <Typography variant="h6" color="textPrimary">
                  Best Performer: {mostPositive.symbol}
                  <span
                    style={{
                      color:
                        mostPositive.change > 0
                          ? 'green'
                          : mostPositive.change < 0
                          ? 'red'
                          : 'white',
                    }}
                  >
                    {` (${mostPositive.change}%)`}
                  </span>
                </Typography>
              </div>
            )}
            {mostNegative.symbol && (
              <div>
                <Typography variant="h6" color="textPrimary">
                  Worst Performer: {mostNegative.symbol}
                  <span
                    style={{
                      color:
                        mostNegative.change > 0
                          ? 'green'
                          : mostNegative.change < 0
                          ? 'red'
                          : 'white',
                    }}
                  >
                    {` (${mostNegative.change}%)`}
                  </span>
                </Typography>
              </div>
            )}
          </div>
        ) : (
          <Typography variant="h6" color="textPrimary">
            Nothing to display
          </Typography>
        )}
      </div>
    }
  />
          </Box>


  
          {/* ROW 2 */}
          <Box
            gridColumn="span 8"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
          >
            <Box
              mt="25px"
              p="0 30px"
              display="flex "
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="600"
                  color={colors.grey[100]}
                >
                  Portfolio Growth
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={colors.greenAccent[500]}
                >
                  
                </Typography>
              </Box>
              <Box>
              </Box>
            </Box>
            <Box height="250px" m="-20px 0 0 0">
              <TCFLineChart isDashboard={true} />
            </Box>
          </Box>

          {/* Portfolio */}
          <Box
            gridColumn={isSmallScreen ? "span 12" : "span 4"}
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            padding="20px"
            
          >
            <Typography
              variant="h5"
              fontWeight="600"
              sx={{ marginBottom: "10px" }}
            >
              Portfolio Breakdown
            </Typography>
            <Box height={isSmallScreen ? "auto" : "280px"} width="100%">
              <PortfolioPieChart />
            </Box>
          </Box>
        

          {/* News */}

          {newsData.length > 0 ? (
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            overflow="auto"
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              colors={colors.grey[100]}
              p="15px"
            >
              <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                Headlines
              </Typography>
            </Box>
            {newsData.map((article, i) => (
              <Box
                key={`${article.headline}-${i}`}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`4px solid ${colors.primary[500]}`}
                p="15px"
              >
                <Box>
                  <Typography
                    color={colors.greenAccent[500]}
                    variant="h6"
                    fontWeight="600"
                    style={{ marginBottom: '5px' }}
                  >
                    {article.headline} {' '}
                    <span style={{ color: colors.grey[100] }}>
                      ({article.datetime})
                    </span>
                  </Typography>

                  <img src={article.image} alt="Image" 
                  style={{ maxWidth: '70%', height: 'auto', display: 'block', margin: '0 auto', marginBottom: '5px' }}/>
                </Box>

                <Box style={{ textAlign: 'center' }}>
                <Typography 
                  color={colors.grey[100]}
                  style={{ marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold' }}>{article.summary}</span>
                </Typography>
                </Box> 

            
                <Box 
                color={colors.grey[100]}
                >

                  <Typography
                    color={colors.greenAccent[500]}
                    variant="body3"
                    fontWeight="bold"
                  >
                    <a
                    href = {article.url}
                    >Read more
                    </a>
                  </Typography>
                </Box>

              </Box>
            ))}
          </Box>
          ) : (
            <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            overflow="auto"
            >
                <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`4px solid ${colors.primary[500]}`}
                colors={colors.grey[100]}
                p="15px"
              >
              <Typography color={colors.grey[100]} variant="h5" fontWeight="600">Top Headlines</Typography>
              </Box>

              <Box>
                  <Typography
                    color={colors.greenAccent[500]}
                    variant="h6"
                    fontWeight="600">
                      Loading News...
                    </Typography>
                  </Box>
            </Box>
          )}

          {/* Favourites */}
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            overflow="auto"
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              colors={colors.grey[100]}
              p="15px"
            >
              <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                Favourites
              </Typography>
            </Box>
            {favourites.length === 0 ? (
              <Box p="15px">
                <Typography variant="h6" color="textPrimary">
                  Nothing to display
                </Typography>
              </Box>
            ) : (
              favourites.map((stock, i) => (
                <Box
                  key={`${stock}-${i}`}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  borderBottom={`4px solid ${colors.primary[500]}`}
                  p="15px"
                >
                  <Box>
                    <Typography
                      color={colors.greenAccent[500]}
                      variant="h5"
                      fontWeight="600"
                    >
                      {stock}
                    </Typography>
                  </Box>

                  <Box 
                    backgroundColor={colors.greenAccent[500]}
                    p="2px 5px"
                    borderRadius="4px"
                  >
                  {stockPrices[stock]}
                  </Box> 

                  <Box 
                  color={colors.grey[100]}>

                    <Typography
                      color={parseFloat(percentageChange[stock]) >= 0 ? colors.greenAccent[500] : colors.redAccent[500]}
                      variant="body3"
                      fontWeight="bold"
                    >
                      {percentageChange[stock] !== null && percentageChange[stock] !== undefined ? (
                        (parseFloat(percentageChange[stock]) > 0 ? "+" : "") +
                        percentageChange[stock].toFixed(2) + "%"
                      ) : "Loading..."}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          {/* Recent Transactions */}
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            overflow="auto"
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              colors={colors.grey[100]}
              p="15px"
            >
              <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
                Recent Transactions
              </Typography>
            </Box>

            {transactionData.length === 0 ? (
              <Box p="15px">
                <Typography variant="h6" color="textPrimary">
                  Nothing to display
                </Typography>
              </Box>
            ) : (
            
              transactionData.map((transaction, i) => (
                <Box
                  key={`${transaction.account}-${i}`}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  borderBottom={`4px solid ${colors.primary[500]}`}
                  p="15px"
                >
                  <Box>
                    <Typography
                      color={colors.greenAccent[500]}
                      variant="h5"
                      fontWeight="600"
                    >
                      {transaction.order === 'WAITING' ? (
                        `${transaction.stockSymbol} (LIMIT - $${transaction.limitPrice})`
                      ) : (
                        `${transaction.stockSymbol} ($${transaction.pricePerUnit.toFixed(2)})`
                      )}
                    </Typography>
                    <Typography color={colors.grey[100]}>
                    {transaction.order === 'WAITING' ? (
                      transaction.action === 'buy' ? `WAITING (Buy - ${transaction.unitsBoughtInTransaction} units)` : `WAITING (Sell - ${transaction.unitsSoldInTransaction} units)`
                    ) : (
                      transaction.action === 'buy'
                        ? `Bought - ${transaction.unitsBoughtInTransaction} units`
                        : `Sold - ${transaction.unitsSoldInTransaction} units`
                    )}
                    </Typography>
                  </Box>

                  <Box color={colors.grey[100]}>{transaction.date}</Box>
                  
                  <Box backgroundColor={colors.greenAccent[500]}
                    p="2px 5px"
                    borderRadius="4px"
                  >
                  {transaction.order === 'WAITING' ? (
                      <button onClick={() => cancelOrder(transaction)}>Cancel order</button>
                    ) : transaction.action === 'buy' ? (
                      `Expenditure: $${transaction.expenditureOfTransaction}`
                    ) : (
                      `Returns: $${transaction.returnsFromTransaction}`
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    );


  } else if (user) {
    return (
        <div className="p-4 box">
          You are logged out. Return to Log In <Link to="/">Log In</Link>
        </div>
    );
  } else {
    navigate("/");
    return null;
  }
};

export default Dashboard;