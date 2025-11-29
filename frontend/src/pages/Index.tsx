import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataDashboard } from "@/components/DataDashboard";

const Index = () => {
  const [data, setData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleDataLoaded = (loadedData: any[], loadedHeaders: string[]) => {
    setData(loadedData);
    setHeaders(loadedHeaders);
  };

  const handleReset = () => {
    setData(null);
    setHeaders([]);
  };

  return (
    <div className="min-h-screen">
      {!data ? (
        <FileUpload onDataLoaded={handleDataLoaded} />
      ) : (
        <DataDashboard data={data} headers={headers} onReset={handleReset} />
      )}
    </div>
  );
};

export default Index;
