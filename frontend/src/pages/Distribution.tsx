import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { DataVisualizations } from "@/components/DataVisualizations";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Distribution() {
  const { data, headers } = useData();
  const navigate = useNavigate();

  if (!data) {
    return (
      <Layout>
        <div className="container px-4 py-12">
          <div className="space-y-8 text-center">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-2">
                Distribution
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
              Distribution
            </h1>
            <p className="text-muted-foreground text-lg">
              Explorez la distribution de vos données
            </p>
          </div>

          <div>
            <DataVisualizations data={data} headers={headers} type="pie" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
