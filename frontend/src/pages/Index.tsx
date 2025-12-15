import { FileUpload } from "@/components/FileUpload";
import { DataDashboard } from "@/components/DataDashboard";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";

const Index = () => {
  const { data, headers, setData, clearData } = useData();

  const handleDataLoaded = (loadedData: any[], loadedHeaders: string[]) => {
    setData(loadedData, loadedHeaders);
  };

  const handleReset = () => {
    clearData();
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
