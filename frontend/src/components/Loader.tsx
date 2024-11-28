import "./Loader.css";

import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="container">
      <div className="ball"></div>
      <div className="shadow"></div>
    </div>
  );
};

export default Loader;
