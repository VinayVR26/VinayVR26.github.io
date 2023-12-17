import React from "react";
import { useTheme } from "@emotion/react";
import { tokens } from "../../theme";

const CardNoBorder = ({ children }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <div className="w-full h-full rounded-md relative p-7 bg-grey"

    style={{
      cursor: "auto",
      backgroundColor: colors.primary[400],
      color: colors.grey[100]
    }}
  >
      {children}
    </div>
  );
};

export default CardNoBorder;
