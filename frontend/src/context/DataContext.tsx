import React, { createContext, useContext, useState } from "react";

interface DataContextType {
  data: any[] | null;
  headers: string[];
  setData: (data: any[], headers: string[]) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setDataState] = useState<any[] | null>(null);
  const [headers, setHeadersState] = useState<string[]>([]);

  const setData = (newData: any[], newHeaders: string[]) => {
    setDataState(newData);
    setHeadersState(newHeaders);
  };

  const clearData = () => {
    setDataState(null);
    setHeadersState([]);
  };

  return (
    <DataContext.Provider value={{ data, headers, setData, clearData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};
