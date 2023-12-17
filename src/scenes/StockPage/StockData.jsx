import React, { useContext, useEffect, useState } from "react";
import { Button, IconButton } from "@mui/material";
import { useTheme } from "@emotion/react";
import { tokens } from "../../theme";
import { useUserAuth } from "../../context/UserAuthContext";
import StockContext from "../../context/StockContext";
import { fetchStockDetails, fetchQuote } from "../../utils/api/stock-api";
import Details from "../StockDetails/Details";
import Overview from "../StockOverview/Overview";
import Chart from "../StockChart/Chart";
import StockNews from "../News/StockNews";
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";

const StockData = ({ onTrade }) => {

  const { user } = useUserAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const { stockSymbol } = useContext(StockContext);

  const [stockDetails, setStockDetails] = useState({});
  const [quote, setQuote] = useState({});
  const [filter, setFilter] = useState("1D");

  const [showNews, setShowNews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
       if (user) {
         const userDocRef = doc(db, "users", user.email);
         const userDocSnap = await getDoc(userDocRef);
         const userData = userDocSnap.data();
         const existingFavourites = userData.favorites || [];
         setIsFavorite(existingFavourites.includes(stockSymbol));
       }
    };
    fetchFavoriteStatus();
   }, [user, stockSymbol]);

  const toggleFavorite = async () => {
    setIsFavorite(!isFavorite);
    try {
      const userDocRef = doc(db, "users", user.email);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      const existingFavourites = userData.favorites || [];
      if (isFavorite) {
        const updatedFavourites = existingFavourites.filter(
          (symbol) => symbol !== stockSymbol
        );
        await updateDoc(userDocRef, { 
          favorites: updatedFavourites 
        });

      } else {
        const updatedFavourites = [...existingFavourites, stockSymbol];
        await updateDoc(userDocRef, { 
          favorites: updatedFavourites 
        });
      }    
    } catch (error) {
      console.log("Error fetching data:", error.message);
    }
  };

  const handleTradeClick = () => {
    if (onTrade) {
      onTrade(true); // Call the toggle function to switch to Transaction and show the "BACK" button
    }
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

    const updateStockOverview = async () => {
      try {
        const result = await fetchQuote(stockSymbol);
        setQuote(result);
      } catch (error) {
        setQuote({});
        console.log(error);
      }
    };

    updateStockDetails();
    updateStockOverview();
  }, [stockSymbol]);

  // Function to toggle the visibility of the news section
  const toggleNews = () => {
    setShowNews(!showNews);
  };

  // overview has 1 row and 1 column by default
  return (
    
    <div // MAIN ONE TO CONTROL SIZE
      className="h-screen grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-8 md:grid-rows-7 xl:grid-rows-5 auto-rows-fr gap-6 p-9 font-quicksand bg-neutral-100"
      style={{
        backgroundColor: colors.primary[400], // bg color of cards
        color: colors.grey[200], // color of words
        maxHeight: "calc(100vh - 187px)", // Set a maximum height to fit the screen
        overflow: showNews ? "scroll" : "hidden", // Hide any content that overflows the container
      }}>
        
        

        <div className="col-span-1 md:col-span-2 xl:col-span-3 row-span-1 flex justify-start items-center">
        <IconButton color={isFavorite ? "secondary" : "default"} onClick={toggleFavorite}>
          {isFavorite ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
        {stockSymbol ? (
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="contained" color="primary" onClick={handleTradeClick}>
              TRADE
            </Button>
          </div>
        ) : (
          ""
        )}

        </div>
        

        <div className="md:col-span-2 row-span-4">
          <Chart filter={filter} setFilter={setFilter}/>
        </div>

        <div>
          <Overview symbol={stockSymbol}
                    price={quote.pc}
                    change={quote.d}
                    changePercent={quote.dp}
                    currency={stockDetails.currency}
                    filter={filter}
          />
        </div>


        <div className="row-span-2 xl:row-span-3">
          <Details details={stockDetails} />
        </div>

        {/* Button to toggle the news section */}
      <div className="col-span-1 md:col-span-2 xl:col-span-3 row-span-1 flex justify-center items-center">
        <Button
          variant="contained"
          color="primary"
          onClick={toggleNews}
        >
          {showNews ? "Hide News" : "Show News"}
        </Button>
      </div>

      {/* Conditional rendering of StockNews component */}
      {showNews && (
        <StockNews />
      )}

    </div>

  );
};

export default StockData;