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

  useEffect(() => {
    // Check backend connectivity
    ApiService.getDataInfo().then((result) => {
      setBackendStatus(result.error ? 'disconnected' : 'connected');
    });
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent tracking-tight">
              Tableau de Bord
            </h1>
            <p className="text-muted-foreground mt-2">
              Vue d'ensemble de votre dataset
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
              {backendStatus === 'checking' && (
                <>
                  <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-sm font-medium text-blue-600">Connexion IA...</span>
                </>
              )}
              {backendStatus === 'connected' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">IA Connectée</span>
                </>
              )}
              {backendStatus === 'disconnected' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">IA Déconnectée</span>
                </>
              )}
            </div>

            <Button
              onClick={onReset}
              variant="outline"
              className="bg-background/40 backdrop-blur-md border-white/10 hover:bg-background/60"
            >
              Charger un autre fichier
            </Button>
          </div>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-background/40 backdrop-blur-xl border-white/10 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Table className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Lignes</p>
                <h3 className="text-2xl font-bold">{data.length.toLocaleString()}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-background/40 backdrop-blur-xl border-white/10 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Colonnes</p>
                <h3 className="text-2xl font-bold">{headers.length}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-background/40 backdrop-blur-xl border-white/10 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Qualité</p>
                <h3 className="text-2xl font-bold">100%</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Data Display */}
          <div className="space-y-6">
            <Card className="p-1 shadow-elegant border-white/10 bg-background/40 backdrop-blur-xl overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-5 mb-8 bg-background/50 p-1.5 backdrop-blur-md border border-white/10 rounded-xl h-auto">
                    <TabsTrigger value="table" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg" title="Voir les données brutes">
                      <Table className="w-4 h-4" />
                      📊 Données
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg" title="Graphiques en barres">
                      <BarChart3 className="w-4 h-4" />
                      📈 Barres
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg" title="Évolution dans le temps">
                      <LineChart className="w-4 h-4" />
                      📉 Tendances
                    </TabsTrigger>
                    <TabsTrigger value="distribution" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg" title="Répartition des valeurs">
                      <PieChart className="w-4 h-4" />
                      🥧 Distribution
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg" title="Générer des rapports IA">
                      <FileText className="w-4 h-4" />
                      📋 Rapports
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 bg-background/20">

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
                </div>
              </Tabs>
            </Card>
          </div>

        </div>
      </div>

      {/* AI Chat Overlay */}
      <AIChat data={data} headers={headers} />
    </div>
  );
};
