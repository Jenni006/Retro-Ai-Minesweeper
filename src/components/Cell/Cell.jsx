import React from "react";
import "./Cell.css";

const Cell = ({ value, revealed, flagged, onClick, onRightClick, aiHighlight }) => {
  return (
    <div
      className={`cell ${revealed ? "revealed" : ""} ${aiHighlight || ""}`}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick();
      }}
    >
      {revealed && value !== 0 ? value : ""}
      {flagged && !revealed ? "🚩" : ""}
    </div>
  );
};

export default Cell;
