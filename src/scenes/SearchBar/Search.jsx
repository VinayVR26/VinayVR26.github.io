import React, { useState, useEffect } from "react";
import { XIcon } from "@heroicons/react/solid";
import SearchResults from "./SearchResults";
import { useTheme } from "@emotion/react";
import { tokens } from "../../theme";
import { searchSymbol } from "../../utils/api/stock-api";

const Search = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [input, setInput] = useState("");
  const [bestMatches, setBestMatches] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  const closeResults = () => {
    setShowResults(false);
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      updateBestMatches();
      toggleResults();
    }
  };
  

  const updateBestMatches = async () => {
    try {
      if (input) {
        const searchResults = await searchSymbol(input);
        const result = searchResults.result;
        setBestMatches(result);
      }
    } catch (error) {
      setBestMatches([]);
      console.log(error);
    }
  };

  const clear = () => {
    setInput("");
    setBestMatches([]);
  };

  useEffect(() => {
    const fetchBestMatches = async () => {
      try {
        if (input) {
          const searchResults = await searchSymbol(input);
          const result = searchResults.result;
          setBestMatches(result);
        } else {
          setBestMatches([]);
        }
      } catch (error) {
        setBestMatches([]);
        console.log(error);
      }
    };

    fetchBestMatches();
  }, [input]);

  return (
    <div className="flex items-center my-0 border-2 rounded-md relative h-10 z-50 w-96 bg-white border-neutral-200"

      style={{
        backgroundColor: colors.primary[500], // bg color of cards
        color: colors.black[100], // color of words
      }}
    >
        <input 
        type="text" 
        value={input} 
        className="w-full px-4 py-2 focus:outline-none rounded-md"
        placeholder="Search Security"
        onChange={(event) => setInput(event.target.value)}
        //onKeyPress={handleKeyPress} // Handle "Enter" key press
      />
       {input && (
        <button onClick={clear} className="m-1">
          <XIcon className="h-4 w-4 fill-gray-500" />
        </button>
      )}
      
      {input && bestMatches.length > 0 ? (
        <SearchResults results={bestMatches} />
      ) : null}
    </div>
  );
};


export default Search;