import React from 'react';

const OrderSummary = ({ transactionData }) => {

  console.log(transactionData)

  return (
    <>
      <div>
        <h1>Order Summary</h1>
        {transactionData && (
          <>
            <p>Symbol: {transactionData.stockSymbol}</p>
            <p>Total Price: {transactionData.expenditureOfTransaction}</p>
            <p>Action: {transactionData.action}</p>
            <p>Quantity: {transactionData.unitsBoughtInTransaction}</p>
            <p>Type of Trade: {transactionData.tradeType}</p>
            <p>TIF: {transactionData.tif}</p>
            <p>Account: {transactionData.account}</p>
          </>
        )}
      </div>
    </>
  );
};

export default OrderSummary;
