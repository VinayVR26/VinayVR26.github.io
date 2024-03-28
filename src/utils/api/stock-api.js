const basePath = "https://finnhub.io/api/v1";
const websocketPath = "wss://ws.finnhub.io";
const baseHistoricalDataPath = "https://api.marketdata.app/v1/stocks/candles";

export const searchSymbol = async (query) => {
  const url = `${basePath}/search?q=${query}&token=${process.env.REACT_APP_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};

export const fetchStockDetails = async (stockSymbol) => {
  const url = `${basePath}/stock/profile2?symbol=${stockSymbol}&token=${process.env.REACT_APP_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  return await response.json();
};

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

export const subscribeQuote = (stockSymbol) => {
  const socket = new WebSocket(`${websocketPath}?token=${process.env.REACT_APP_API_KEY}`);

  socket.onopen = () => {
    // Subscribe to the stock symbol for real-time updates
    socket.send(JSON.stringify({ type: "subscribe", symbol: stockSymbol }));
  };

  return socket;
};


export const fetchStockNews = async (stockSymbol) => {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${stockSymbol}&apikey=Z97VYJB4D0NF8NS9`;
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


export const fetchHistoricalData = async (
  stockSymbol,
  resolution,
  from,
  to
) => {
  const url = `${baseHistoricalDataPath}/${resolution}/${stockSymbol}/?from=${from}&to=${to}&token=a1lMb1ZJQTRhZ0lYd1ZVcDA4T0hjVmpsUEhkMTBkOFdUQnBxV0VKQjlVVT0`;
  const response = await fetch(url);
  console.log("ITS HERE",response);

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

