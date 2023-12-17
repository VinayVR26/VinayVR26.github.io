import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext';
import { useTheme } from '@emotion/react';
import { tokens } from '../../theme';
import { doc, collection, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import { Button } from '@mui/material';
import ButtonGroup from '@mui/material/ButtonGroup';


const Orders = () => {
  const { user } = useUserAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);


  const fetchOrders = async () => {
    try {
      const ordersCollection = collection(db, 'users');
      const ordersSnapshot = await getDocs(ordersCollection);
      const ordersData = ordersSnapshot.docs.map(doc => doc.data());
      const allStocks = ordersData.map(user => user.stocks || []);
      const allWaitStocks = ordersData.map(user => user.waitStocks || []);
      const allCancelStocks = ordersData.map(user => user.cancelStocks || []);

      const allOrders = [...allStocks.flat(), ...allWaitStocks.flat(), ...allCancelStocks.flat()];
      setOrders(allOrders);
    } catch (error) {
      console.log("Error fetching orders: ", error.message);
    }
  };

  useEffect(() => {
    if (Object.keys(user).length !== 0) {
      fetchOrders();
    }
  }, [user]);



  const filteredOrders = orders.filter(order => {
    if (filter === "All") return true;
    if (filter === "Filled") return order.order === "FILLED";
    if (filter === "Waiting") return order.order === "WAITING";
    if (filter === "Cancelled") return order.order === "CANCELLED";
    return false;
  });

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

        await updateDoc(userProfileRef, {
          waitStocks: updatedWaitStocks,
          cancelStocks: existingCancelledStocks,
        });

        fetchOrders();

       }
    } catch (error) {
      console.log("Error cancelling order:", error.message);
    }
  };

  const renderOrderDetails = order => {
    if (order.order === "FILLED") {
      return (
        <>
          <p>Symbol: {order.stockSymbol}</p>
          <p>Action: {order.action}</p>
          {order.action === 'buy' ? (
            <>
              <p>Units Bought: {order.unitsBoughtInTransaction}</p>
              <p>Price per unit: {order.pricePerUnit}</p>
              <p>Expenditure: {order.expenditureOfTransaction}</p>
              <p>Units in possession: {order.latestUnits}</p>
            </>
          ) : ( // action = "sell"
            <>
              <p>Units Sold: {order.unitsSoldInTransaction}</p>
              <p>Price per unit: {order.pricePerUnit}</p>
              <p>Returns: {order.returnsFromTransaction}</p>
              <p>Units in possession: {order.latestUnits}</p>
            </>
          )}
        </>
      );
    } else if (order.order === "WAITING") {
      return (
        <>
          <p>Symbol: {order.stockSymbol}</p>
          <p>Action: {order.action}</p>
          <p>Limit Price per unit: {order.limitPrice}</p>
          <div style={{ float: 'right' }}>
            <button onClick={() => cancelOrder(order)}>Cancel Order</button>
          </div>
          {order.action === "buy" ? (
            <> 
              <p>Units to buy: {order.unitsBoughtInTransaction}</p>
            </>
          ) : (
            <> 
              <p>Units to sell: {order.unitsSoldInTransaction}</p>
            </>
          )}
        </>
      );
    } else if (order.order === "CANCELLED") {
      return (
        <>
          <p>Symbol: {order.stockSymbol}</p>
          <p>Action: {order.action}</p>
          <p>Limit Price per unit: {order.limitPrice}</p>
          {order.action === "buy" ? (
            <> 
              <p>Units to buy: {order.unitsBoughtInTransaction}</p>
            </>
          ) : (
            <> 
              <p>Units to sell: {order.unitsSoldInTransaction}</p>
            </>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <>
      <div
        style={{
          maxHeight: "calc(100vh - 69px)",
          overflowY: "auto",
        }}
      >
        <h1>All Orders</h1>
        <ButtonGroup
          color="primary"
          aria-label="outlined primary button group"
          style={{ marginBottom: '20px' }}
        >
          <Button
            variant={filter === 'All' ? 'contained' : 'outlined'}
            onClick={() => setFilter('All')}
          >
            All
          </Button>
          <Button
            variant={filter === 'Filled' ? 'contained' : 'outlined'}
            onClick={() => setFilter('Filled')}
          >
            Filled
          </Button>
          <Button
            variant={filter === 'Waiting' ? 'contained' : 'outlined'}
            onClick={() => setFilter('Waiting')}
          >
            Waiting
          </Button>
          <Button
            variant={filter === 'Cancelled' ? 'contained' : 'outlined'}
            onClick={() => setFilter('Cancelled')}
          >
            Cancelled
          </Button>
        </ButtonGroup>
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Action</th>
              <th>Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={index}>
                <td>{order.stockSymbol}</td>
                <td>{order.action}</td>
                <td>{renderOrderDetails(order)}</td>
                <td>
                  {order.order === 'WAITING' && (
                    <button onClick={() => cancelOrder(order)}>Cancel Order</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Orders;