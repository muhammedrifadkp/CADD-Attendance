import React from "react";
import "./CLoader.css";

const CLoader = () => {
  return (
    <div className="c-loader-container">
      <svg className="c-loader" viewBox="0 0 100 100">
        <path
          d="M70,20 A40,40 0 1,0 70,80"
          fill="none"
          stroke="#ff0000"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default CLoader;
