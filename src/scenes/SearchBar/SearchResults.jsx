import React, { useContext, useState } from 'react'
import "../../tailwindCSS.css";
import { useTheme } from "@emotion/react";
import { tokens } from '../../theme';
import StockContext from '../../context/StockContext';
import StockDataPopup from '../PopupNavigation/StockDataPopup';

const SearchResults = ({ results }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const { setStockSymbol } = useContext(StockContext);

  const shouldDisplaySymbol = (symbol) => {
    if (!symbol.includes('.') || ["BRK.A", "BRK.B", "RDS.A", "RDS.B", "T.PR", "T.PC", "T.PE", "BHE.PB", "BHE.PA"].includes(symbol)) {
      return true;
    }
    return false;
  };

  const handleOptionClick = (symbol) => {
    setStockSymbol(symbol);
    setSelectedSymbol(symbol);
    setPopupOpen(true);
  };

  return (
   
    <>
    <ul className="absolute top-12 border-2 w-full rounded-md h-64 overflow-y-scroll bg-white border-neutral-200 custom-scrollbar"
    
    style={{
      backgroundColor: colors.primary[900], 
      color: colors.black[100]
    }}
  > 
        {results.map((item) => {
          if (shouldDisplaySymbol(item.symbol)) {
            return ( 
              <li
                key={item.symbol} className="cursor-pointer p-4 m-2 flex items-center justify-between rounded-md hover:bg-indigo-200 transition duration-300"
                onClick={() => handleOptionClick(item.symbol)}
                >
                <span>{item.symbol}</span>
                <span>{item.description}</span>
            </li>
            );
          }
        })}
    </ul>
    <StockDataPopup open={isPopupOpen} onClose={() => setPopupOpen(false)} />
    </>
  );
};

export default SearchResults;

