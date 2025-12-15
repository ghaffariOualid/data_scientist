import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { DataVisualizations } from "@/components/DataVisualizations";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Trends() {
  const { data, headers } = useData();
  const navigate = useNavigate();

  if (!data) {
    return (
      <Layout>
        <div className="container px-4 py-12">
          <div className="space-y-8 text-center">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
                Tendances
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Aucune donnée chargée
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                Charger un fichier
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
              Tendances
            </h1>
            <p className="text-muted-foreground text-lg">
              Analysez les tendances de vos données
            </p>
          </div>

          <div>
            <DataVisualizations data={data} headers={headers} type="line" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
