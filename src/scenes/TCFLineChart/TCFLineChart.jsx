import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { db } from "../Firebase/firebase";
import { doc, getDoc, updateDoc,arrayUnion } from "firebase/firestore";

const TCFLineChart = ({ isDashboard = false }) => {
  const { user } = useUserAuth();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [date, setDate] = useState();
  const [lineData, setLineData] = useState([]);

  const fetchData = async () => {
    try {
      const userDocRef = doc(db, "users", user.email);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const cashFlow = userData.totalCashFlow;

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = today.getFullYear();
        const todaysDate = `${dd}-${mm}-${yyyy}`;
        setDate(todaysDate);

        // Check if the current date exists in the lineData array
        let existingLineData = userData.lineData || [];
        existingLineData = existingLineData.map(data => ({ x: data.x, y: data.y }));
    

        if (!existingLineData.some(data => data.x === todaysDate)) {
          const toAdd = {
            x: todaysDate,
            y: cashFlow,
          };


          setLineData([...existingLineData, toAdd]);

          await updateDoc(userDocRef, {
            lineData: arrayUnion(toAdd)
          });

        }
        setLineData(existingLineData)
      }
    } catch (error) {
      console.log("Error fetching data here:", error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // [] means run once


  const finalData = [{ id: "Total Cash Flow", color: "#4cceac", data: lineData }];



  return (
    <ResponsiveLine
      data={finalData}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
        tooltip: {
          container: {
            color: colors.primary[500],
          },
        },
      }}
      colors={isDashboard ? { datum: "color" } : { scheme: "nivo" }} // added
      margin={{ top: 50, right: 110, bottom: 50, left: 80 }}
      xScale={{ type: "point" }}
      yScale={{
        type: "linear",
        min: "auto",
        max: "auto",
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      curve="catmullRom"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: "bottom",
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Date", 
        legendOffset: 25,
        legendPosition: "middle",
      }}
      axisLeft={{
        orient: "left",
        tickValues: 5, 
        tickSize: 3,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Total Cash Flow (USD)",
        legendOffset: -55,
        legendPosition: "middle",
      }}
      enableGridX={false}
      enableGridY={false}
      pointSize={8}
      pointColor={{ theme: "background" }}
      pointBorderWidth={2}
      pointBorderColor={{ from: "serieColor" }}
      pointLabelYOffset={-12}
      useMesh={true}
      
    />
  );
};

export default TCFLineChart;