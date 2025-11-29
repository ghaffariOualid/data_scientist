import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, PieChart, Table, Cloud, CheckCircle2, AlertCircle, FileText, TrendingUp, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./DataTable";
import { DataVisualizations } from "./DataVisualizations";
import { AIChat } from "./AIChat";
import { ReportGenerator } from "./ReportGenerator";
import { ApiService } from "@/services/api";

interface DataDashboardProps {
  data: any[];
  headers: string[];
  onReset: () => void;
}

export const DataDashboard = ({ data, headers, onReset }: DataDashboardProps) => {
  const [activeTab, setActiveTab] = useState("table");
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showAIChat, setShowAIChat] = useState(true);

  useEffect(() => {
    // Check backend connectivity
    ApiService.getDataInfo().then((result) => {
      setBackendStatus(result.error ? 'disconnected' : 'connected');
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tableau de Bord Analytique
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                {data.length.toLocaleString()} lignes • {headers.length} colonnes
              </p>
              <div className="flex items-center gap-2">
                {backendStatus === 'checking' && (
                  <>
                    <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-blue-600">Vérification IA...</span>
                  </>
                )}
                {backendStatus === 'connected' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">IA connectée</span>
                  </>
                )}
                {backendStatus === 'disconnected' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">IA déconnectée</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAIChat(!showAIChat)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {showAIChat ? (
                <>
                  <X className="w-4 h-4" />
                  Masquer IA
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Afficher IA
                </>
              )}
            </Button>
            <button
              onClick={onReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-md hover:bg-muted"
            >
              🔄 Charger un autre dataset
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`grid grid-cols-1 gap-6 ${showAIChat ? 'xl:grid-cols-4' : 'xl:grid-cols-1'}`}>
          {/* Data Display */}
          <div className={`${showAIChat ? 'xl:col-span-2' : 'xl:col-span-1'} space-y-6`}>
            <Card className="p-6 shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="table" className="gap-2" title="Voir les données brutes">
                    <Table className="w-4 h-4" />
                    📊 Données
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-2" title="Graphiques en barres">
                    <BarChart3 className="w-4 h-4" />
                    📈 Barres
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="gap-2" title="Évolution dans le temps">
                    <LineChart className="w-4 h-4" />
                    📉 Tendances
                  </TabsTrigger>
                  <TabsTrigger value="distribution" className="gap-2" title="Répartition des valeurs">
                    <PieChart className="w-4 h-4" />
                    🥧 Distribution
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="gap-2" title="Générer des rapports IA">
                    <FileText className="w-4 h-4" />
                    📋 Rapports
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="mt-0">
                  <DataTable data={data} headers={headers} />
                </TabsContent>

                <TabsContent value="charts" className="mt-0">
                  <DataVisualizations data={data} headers={headers} type="bar" />
                </TabsContent>

                <TabsContent value="trends" className="mt-0">
                  <DataVisualizations data={data} headers={headers} type="line" />
                </TabsContent>

                <TabsContent value="distribution" className="mt-0">
                  <DataVisualizations data={data} headers={headers} type="pie" />
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  <ReportGenerator data={data} headers={headers} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* AI Chat Sidebar */}
          {showAIChat && (
            <div className="xl:col-span-2 space-y-6 animate-slide-in-right">
              <AIChat data={data} headers={headers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
