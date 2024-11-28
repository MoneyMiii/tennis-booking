import React, { ReactNode, createContext, useContext, useState } from "react";

interface LoaderContextType {
  loading: boolean;
  setLoading: (value: boolean) => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoaderContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = (): LoaderContextType => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
};
