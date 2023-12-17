const basePath = "https://finnhub.io/api/v1";
const websocketPath = "wss://ws.finnhub.io";

/**
 * Searches best stock matches based on a user's query
 * @param {string} query - The user's query, e.g. 'fb'
 * @returns {Promise<Object[]>} Response array of best stock matches
 */
export const searchSymbol = async (query) => {
  const url = `${basePath}/search?q=${query}&token=${process.env.REACT_APP_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};

/**
 * Fetches the details of a given company
 * @param {string} stockSymbol - Symbol of the company, e.g. 'FB'
 * @returns {Promise<Object>} Response object
 */
export const fetchStockDetails = async (stockSymbol) => {
  const url = `${basePath}/stock/profile2?symbol=${stockSymbol}&token=${process.env.REACT_APP_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};

/**
 * Fetches the latest quote of a given stock
 * @param {string} stockSymbol - Symbol of the company, e.g. 'FB'
 * @returns {Promise<Object>} Response object
 */
export const fetchQuote = async (stockSymbol) => { 
  const url = `${basePath}/quote?symbol=${stockSymbol}&token=${process.env.REACT_APP_API_KEY}`;
  const response = await fetch(url);
  //console.log("fetchQuote",url)

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};

/**
 * Subscribes to real-time updates for a given stock
 * @param {string} stockSymbol - Symbol of the company, e.g. 'FB'
 * @returns {WebSocket} WebSocket object
 */
export const subscribeQuote = (stockSymbol) => {
  const socket = new WebSocket(`${websocketPath}?token=${process.env.REACT_APP_API_KEY}`);

  socket.onopen = () => {
    // Subscribe to the stock symbol for real-time updates
    socket.send(JSON.stringify({ type: "subscribe", symbol: stockSymbol }));
  };

  return socket;
};


export const fetchStockNews = async (stockSymbol) => {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${stockSymbol}&apikey=C8T27SI6MYVIZYBS`;
  console.log("URL", url)
  const response = await fetch(url);
  console.log("response", response)

  if (!response.ok) {
    const message = `An error has occurred: ${response.status}`;
    throw new Error(message);
  }

  const newsItems = await response.json();
  console.log("newsItems", newsItems)

  return newsItems;
};



/**
 * Fetches historical data of a stock (to be displayed on a chart)
 * @param {string} stockSymbol - Symbol of the company, e.g. 'FB'
 * @param {string} resolution - Resolution of timestamps. Supported resolution includes: 1, 5, 15, 30, 60, D, W, M
 * @param {number} from - UNIX timestamp (seconds elapsed since January 1st, 1970 at UTC). Interval initial value.
 * @param {number} to - UNIX timestamp (seconds elapsed since January 1st, 1970 at UTC). Interval end value.
 * @returns {Promise<Object>} Response object
 */
export const fetchHistoricalData = async (
  stockSymbol,
  resolution,
  from,
  to
) => {
  const url = `${basePath}/stock/candle?symbol=${stockSymbol}&resolution=${resolution}&from=${from}&to=${to}&token=${process.env.REACT_APP_API_KEY}`;
  const response = await fetch(url);
  //console.log("ITS HERE",response);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};

export const fetchGeneralNews = async () => {
  const url = `${basePath}/news?category=general&token=${process.env.REACT_APP_API_KEY}`;
  console.log("generalNews", url)
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occurred: ${response.status}`;
    throw new Error(message);
  }

  const generalNewsItems = await response.json();
  console.log("generalNewsItems", generalNewsItems.data)

  return generalNewsItems;
};

/**
 * Fetches historical data of a stock (to be displayed on a chart)
 * @param {string} stockSymbol - Symbol of the company, e.g. 'FB'
 * @param {string} ipoDate - IPO's date
 * @param {string} todaysDate - Today's date
 * @returns {Promise<Object>} Response object
 */

export const fetchEarningsCalendar = async (

  ipoDate,
  todaysDate,
  stockSymbol
  
) => {
  console.log("STOCK SYMBOL", stockSymbol);
  const url = `${basePath}/calendar/earnings?symbol=${stockSymbol}&token=${process.env.REACT_APP_API_KEY}`;

  console.log("earnings history url", url);
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occurred: ${response.status}`;
    throw new Error(message);
  }

  const earningsCalendarItems = await response.json();
  console.log("earnings items", earningsCalendarItems.data)

  return earningsCalendarItems;
}

