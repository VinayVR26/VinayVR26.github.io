import { db } from '../Firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { fetchQuote } from '../../utils/api/stock-api';

const UpdateTotalCashFlow = async (user) => {
  const userProfileRef = doc(db, 'users', user.email);
  const userProfileSnap = await getDoc(userProfileRef);
  const userProfileData = userProfileSnap.data();
  const fundsForTrading = parseFloat(userProfileData.fundsForTrading);
  const stocksArray = userProfileData.stocks || [];

  const reversedStocks = stocksArray.slice().reverse();
  const uniqueStocks = [];

  for (const reversedObj of reversedStocks) {
    const existingStock = uniqueStocks.find(stock => stock.stockSymbol === reversedObj.stockSymbol);

    if (!existingStock) {
      uniqueStocks.push({
        stockSymbol: reversedObj.stockSymbol,
        unitsInPossession: reversedObj.latestUnits,
        averagePriceSpent: reversedObj.averagePriceSpent,
      });
    }
    
  }


  let valueToAdd = 0;
  let valueFromTrading = 0;
  
  for (const data of uniqueStocks) {
    const stockDetails = await fetchQuote(data.stockSymbol);
    const latestPrice = stockDetails.c;
    valueToAdd = (data.unitsInPossession * latestPrice);
    valueFromTrading += valueToAdd;
  }
  
  const updatedTotalCashFlow = parseFloat((parseFloat(fundsForTrading) + parseFloat(valueFromTrading)).toFixed(2));


  await updateDoc(userProfileRef, {
    totalCashFlow: updatedTotalCashFlow,
  }); 
};

export default UpdateTotalCashFlow;
