import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { DataDashboard } from "@/components/DataDashboard";
import { Layout } from "@/components/Layout";

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
    <Layout>
      <div className="min-h-[calc(100vh-4rem)]">
        {!data ? (
          <FileUpload onDataLoaded={handleDataLoaded} />
        ) : (
          <DataDashboard data={data} headers={headers} onReset={handleReset} />
        )}
      </div>
    </Layout>
  );
};

export default Index;
