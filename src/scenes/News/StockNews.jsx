import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
import { tokens } from "../../theme";
import { fetchStockDetails, fetchStockNews } from "../../utils/api/stock-api";
import StockContext from "../../context/StockContext";

const StockNews = () => {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { stockSymbol } = useContext(StockContext);

  const [stockNews, setStockNews] = useState({});
  const [stockDetails, setStockDetails] = useState({});
  

  useEffect(() => {
    const updateStockNews = async () => {
      try {
        if (stockSymbol) {
          const result = await fetchStockNews(stockSymbol);
          console.log("result", result)

          const uniqueTitlesSet = new Set();
          const uniqueArticles = [];

          result.feed.forEach((article) => {
            if (!uniqueTitlesSet.has(article.title)) {
              uniqueTitlesSet.add(article.title);
              uniqueArticles.push(article);
            }
          });
          console.log("uniqueTitlesSet",uniqueTitlesSet)

          setStockNews({ ...result, feed: uniqueArticles });
          console.log("STOCK NEWS", result)
        } 
      } catch (error) {
        setStockNews({});
        console.log(error);
      }
    };


    const updateStockDetails = async () => {
      try {
        const result = await fetchStockDetails(stockSymbol);
        setStockDetails(result);
        
      } catch (error) {
        setStockDetails({});
        console.log(error);
      }
    };

    updateStockNews();
    updateStockDetails();
  }, [stockSymbol]);

  useEffect(() => {
    if (Object.keys(stockDetails).length > 0){
      console.log("Stock details2", stockDetails)
    }
  }, [stockDetails]) 


const formatDate = (time) => {
  const year = time.slice(0, 4);
  const month = time.slice(4, 6);
  const day = time.slice(6, 8);
  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
};


  return (
    <div className="xl: col-span-3">
      <div
        className="h-screen grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-8 md:grid-rows-7 xl:grid-rows-5 auto-rows-fr gap-6 p-9 font-quicksand bg-neutral-100"
        style={{
          backgroundColor: colors.primary[400],
          color: colors.grey[200],
          maxHeight: "calc(100vh - 69px)",
          maxWidth: "100%",
          overflowY: "auto"
        }}
      >

        <div className="col-span-3">
          {/* Display the news articles */}
          {stockNews.feed &&
            stockNews.feed.map((article, index) => (
              <div key={index} className="mb-6">
                {/* Display the title */}
                <h2 className="text-3xl font-bold">{article.title}</h2>
                {/* Display the date published */}
                <p className="text-lg text-gray-500 mt-1">
                  Published on {formatDate(article.time_published)}
                </p>
                {/* Display the banner-image */}
                <img 
                src={article["banner_image"]} alt="Banner" 
                className="w-full mt-2" 
                style={{ maxWidth: '500px' }}/>
                
                {/* Display the summary */}
                <p className="text-lg mt-2">{article.summary}</p>
                {/* Display the URL */}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline text-lg"
                >
                  Read more
                </a>
                {/* Add a line to separate articles */}
                <hr className="my-4 border-gray-500" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StockNews;