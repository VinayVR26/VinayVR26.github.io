import { db } from '../Firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { fetchQuote } from '../../utils/api/stock-api';

const FillWaitingOrders = async (user) => {
  const userProfileRef = doc(db, 'users', user.email);
  const userProfileSnap = await getDoc(userProfileRef);
  const userProfileData = userProfileSnap.data();
  const fundsForTrading = parseFloat(userProfileData.fundsForTrading);
  const existingStocks = userProfileData.stocks || [];
  const existingWaitStocks = userProfileData.waitStocks || [];
  let existingInvestedStocks = userProfileData.investedStocks || [];
  

  for (const stock of existingWaitStocks) {
    const quote = await fetchQuote(stock.stockSymbol);
    const realTimePrice = quote.c;
      if (stock.action === "buy" && realTimePrice !== null && parseFloat(realTimePrice) <= parseFloat(stock.limitPrice)) {
        const totalPrice = parseFloat((parseFloat(realTimePrice) * parseInt(stock.unitsBoughtInTransaction)).toFixed(2));
        if (fundsForTrading >= totalPrice) {
          const fundsForTradingLeft = fundsForTrading - totalPrice;
          const { limitPrice, ...updatedStock } = stock;
          updatedStock.latestFundsForTrading = parseFloat(fundsForTradingLeft.toFixed(2));
          updatedStock.order = "FILLED";
          updatedStock.pricePerUnit = realTimePrice;
          updatedStock.expenditureOfTransaction = totalPrice;

          const reversedStocks = existingStocks.slice().reverse();
          const stockData = reversedStocks.find((aStock) => aStock.stockSymbol === updatedStock.stockSymbol);

          if (stockData) {
            updatedStock.latestUnits = stockData.latestUnits + updatedStock.unitsBoughtInTransaction;
            updatedStock.totalExpenditureOnStock = parseFloat((totalPrice + stockData.totalExpenditureOnStock).toFixed(2));
            updatedStock.totalReturnsFromStock = stockData.totalReturnsFromStock;
            updatedStock.totalUnitsBought = updatedStock.unitsBoughtInTransaction + stockData.totalUnitsBought;
            updatedStock.totalUnitsSold = stockData.totalUnitsSold;
            updatedStock.averagePriceSpent = parseFloat((updatedStock.totalExpenditureOnStock / updatedStock.totalUnitsBought).toFixed(2));
          } else {
            updatedStock.latestUnits = updatedStock.unitsBoughtInTransaction;
            updatedStock.totalExpenditureOnStock = parseFloat(totalPrice.toFixed(2));
            updatedStock.totalReturnsFromStock = 0;
            updatedStock.totalUnitsBought = updatedStock.unitsBoughtInTransaction;
            updatedStock.totalUnitsSold = 0;
            updatedStock.averagePriceSpent = parseFloat((updatedStock.totalExpenditureOnStock / updatedStock.totalUnitsBought).toFixed(2));
          }
          const currentDate = new Date();
          updatedStock.date = currentDate

          existingStocks.push(updatedStock);

          if (!existingInvestedStocks.includes(stock.stockSymbol)) {
            existingInvestedStocks.push(stock.stockSymbol)
          }

          const updatedWaitStocks = existingWaitStocks.filter(waitStock => waitStock.id != stock.id);

          await updateDoc(userProfileRef, {
            fundsForTrading: parseFloat(fundsForTradingLeft.toFixed(2)),
            stocks: existingStocks,
            waitStocks: updatedWaitStocks,
            investedStocks: existingInvestedStocks,
          });
        }
    } else if (stock.action === "sell" && realTimePrice !== null && realTimePrice >= stock.limitPrice) {
      const reversedStocks = existingStocks.slice().reverse();
      const stockData = reversedStocks.find((aStock) => aStock.stockSymbol === stock.stockSymbol);
      if (stockData && stockData.latestUnits >= stock.unitsSoldInTransaction) {
        const totalPrice = parseFloat((parseFloat(realTimePrice) * parseInt(stock.unitsSoldInTransaction)).toFixed(2));
        const fundsForTradingLeft = fundsForTrading + totalPrice;
        const { limitPrice, ...updatedStock } = stock;
        updatedStock.latestFundsForTrading = parseFloat(fundsForTradingLeft.toFixed(2));
        updatedStock.order = "FILLED";
        updatedStock.pricePerUnit = realTimePrice;
        updatedStock.returnsFromTransaction = totalPrice;
        
        updatedStock.latestUnits = stockData.latestUnits - updatedStock.unitsSoldInTransaction;
        updatedStock.totalExpenditureOnStock = stockData.totalExpenditureOnStock;
        updatedStock.totalReturnsFromStock = totalPrice + stockData.totalReturnsFromStock;
        updatedStock.totalUnitsBought = stockData.totalUnitsBought;
        updatedStock.totalUnitsSold = updatedStock.unitsSoldInTransaction + stockData.totalUnitsSold;
        updatedStock.averagePriceSpent = stockData.averagePriceSpent;
      
        const currentDate = new Date();
        updatedStock.date = currentDate;
        existingStocks.push(updatedStock);

        if (parseInt(updatedStock.latestUnits) === 0) {
          existingInvestedStocks = existingInvestedStocks.filter(ticker => {
            return ticker !== stock.stockSymbol;
          })
        }

        const updatedWaitStocks = existingWaitStocks.filter(waitStock => waitStock.id != stock.id);

        await updateDoc(userProfileRef, {
          fundsForTrading: parseFloat(fundsForTradingLeft.toFixed(2)),
          stocks: existingStocks,
          waitStocks: updatedWaitStocks,
        });
      };
    };
  };
};

export default FillWaitingOrders;