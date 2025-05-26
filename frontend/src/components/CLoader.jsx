import React from "react";
import "./CLoader.css";

const CLoader = () => {
  return (
    <div className="c-loader-container">
      <div className="logo-loader-wrapper">
        {/* Main rotating logo */}
        <div className="logo-main">
          <img
            src="/logos/C-logo.png"
            alt="CADD Loading"
            className="logo-image"
            onError={(e) => {
              // Fallback to cadd_logo.png if C-logo.png fails
              e.target.src = "/logos/cadd_logo.png";
            }}
          />
        </div>

        {/* Animated rings around logo */}
        <div className="ring ring-1"></div>
        <div className="ring ring-2"></div>
        <div className="ring ring-3"></div>

        {/* Pulsing dots */}
        <div className="dots-container">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>
          <div className="dot dot-4"></div>
        </div>

        {/* Loading text */}
        <div className="loading-text">
          <span className="loading-letter">L</span>
          <span className="loading-letter">o</span>
          <span className="loading-letter">a</span>
          <span className="loading-letter">d</span>
          <span className="loading-letter">i</span>
          <span className="loading-letter">n</span>
          <span className="loading-letter">g</span>
          <span className="loading-dots">...</span>
        </div>
      </div>
    </div>
  );
};

export default CLoader;
