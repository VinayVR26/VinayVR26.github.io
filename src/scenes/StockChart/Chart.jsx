import React, { useContext, useEffect, useState } from "react";
import ChartFilter from './ChartFilter';
import Card from '../Cards/Card';
import { createDate, convertDateToUnixTimestamp, convertUnixTimestampToDate } from '../../utils/helpers/date-helper';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StockContext from "../../context/StockContext";
import { chartConfig } from '../../constants/config';
import { fetchHistoricalData } from "../../utils/api/stock-api";

const Chart = ({ filter, setFilter }) => {
  const [data, setData] = useState([]);
  const { stockSymbol } = useContext(StockContext);

  const formatData = (data) => {
    return data.c.map((item, index) => {
      return {
        value: item.toFixed(2),
        date: convertUnixTimestampToDate(data.t[index]),
      };
    });
  };

  const getDateRange = () => {
    const { days, weeks, months, years } = chartConfig[filter];
    const now = new Date();
    if (now.getDay() === 0) {
      chartConfig[filter].days = 2;
    } else if (now.getDay() === 1) {
      chartConfig[filter].days = 3;
    }

    const endDate = new Date();
    const startDate = createDate(endDate, -days, -weeks, -months, -years);

    const startTimestampUnix = convertDateToUnixTimestamp(startDate);
    const endTimestampUnix = convertDateToUnixTimestamp(endDate);
    return { startTimestampUnix, endTimestampUnix };
  };

  const updateChartData = async () => {
    try {
      const { startTimestampUnix, endTimestampUnix } = getDateRange();
      const resolution = chartConfig[filter].resolution;
      const result = await fetchHistoricalData(
        stockSymbol,
        resolution,
        startTimestampUnix,
        endTimestampUnix
      );
      setData(formatData(result));
    } catch (error) {
      setData([]);
    }
  };

  useEffect(() => {
    updateChartData();
  }, [stockSymbol, filter]);

  return (
    <Card>
        <ul className="flex absolute top-2 right-2 z-40">
        {Object.keys(chartConfig).map((item) => (
          <li key={item}>
            <ChartFilter
              text={item}
              active={filter === item}
              onClick={() => {
                setFilter(item);
              }}
            />
          </li>
        ))}
      </ul>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
              <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="rgb(199 210 254)" // gradient below graph from bottom to top
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="rgb(199 210 254)" // gradient below graph from top to bottom
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            
          <Area
            type="monotone"
            dataKey="value"
            stroke="#312e81"
            fill="url(#chartColor)"
            fillOpacity={1}
            strokeWidth={0.5}
          />
          <Tooltip />
          <XAxis dataKey={"date"} />
          <YAxis domain={["dataMin", "dataMax"]} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default Chart