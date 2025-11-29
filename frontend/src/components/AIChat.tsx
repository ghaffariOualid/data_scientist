import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { PlotlyVisualization } from "./PlotlyVisualization";

interface AIChatProps {
  data: any[];
  headers: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "visualization";
  plotData?: any;
}

export const AIChat = ({ data, headers }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "🤖 Bonjour ! Je suis votre assistant IA d'analyse de données.\n\n💡 **Pour commencer :**\n• Chargez un fichier CSV ci-dessus\n• Posez-moi des questions sur vos données\n• Demandez des visualisations\n\n📊 Je peux analyser, visualiser et répondre à toutes vos questions sur le dataset !",
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingVisualization, setIsCreatingVisualization] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [currentPlotData, setCurrentPlotData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, type: "text" }]);
    setIsLoading(true);

    try {
      // Call the local FastAPI backend analyze endpoint via ApiService
      const result = await ApiService.analyzeData(userMessage);

      if (result.error) {
        throw new Error(result.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.data?.analysis || "Désolé, je n'ai pas pu traiter votre demande.",
          type: "text",
        },
      ]);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur", {
        description: "Impossible de contacter l'agent IA",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVisualization = async () => {
    if (!input.trim() || isCreatingVisualization) return;

    const prompt = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { 
      role: "user", 
      content: `Créer une visualisation: ${prompt}`, 
      type: "text" 
    }]);
    setIsCreatingVisualization(true);

    try {
      // Créer la visualisation (les données sont déjà uploadées)
      const result = await ApiService.createVisualization(prompt);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data?.visualization) {
        setCurrentPlotData(result.data.visualization);
        setShowVisualization(true);
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `J'ai créé une visualisation basée sur votre demande: "${prompt}"`,
            type: "visualization",
            plotData: result.data.visualization,
          },
        ]);
      } else {
        throw new Error("Aucune visualisation générée");
      }
    } catch (error) {
      console.error("Erreur de visualisation:", error);
      toast.error("Erreur de visualisation", {
        description: error instanceof Error ? error.message : "Impossible de créer la visualisation",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, je n'ai pas pu créer la visualisation. Veuillez réessayer.",
          type: "text",
        },
      ]);
    } finally {
      setIsCreatingVisualization(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col shadow-xl sticky top-6 animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Assistant IA</h3>
            <p className="text-xs text-muted-foreground">Analyse conversationnelle</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.type === "visualization" && message.plotData && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPlotData(message.plotData);
                        setShowVisualization(true);
                      }}
                      className="gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Voir la visualisation
                    </Button>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          {(isLoading || isCreatingVisualization) && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {isCreatingVisualization ? "Création de la visualisation..." : "Analyse en cours..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Exemples: 'Quel est le revenu moyen ?', 'Montre-moi un graphique des ventes', 'Analyse les tendances'... 💭"
            className="min-h-[60px] resize-none"
            disabled={isLoading || isCreatingVisualization}
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isCreatingVisualization}
              size="icon"
              className="h-[29px] w-[60px]"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleCreateVisualization}
              disabled={!input.trim() || isLoading || isCreatingVisualization}
              size="icon"
              variant="outline"
              className="h-[29px] w-[60px]"
              title="Créer une visualisation"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <p>💬 <strong>Analyser :</strong> Posez des questions sur vos données</p>
          <p>📊 <strong>Visualiser :</strong> Cliquez sur le bouton graphique pour créer des graphiques</p>
          <p>⌨️ <strong>Raccourcis :</strong> Entrée pour envoyer • Maj+Entrée pour nouvelle ligne</p>
        </div>
      </div>

      {/* Plotly Visualization Modal */}
      <PlotlyVisualization
        plotData={currentPlotData}
        isOpen={showVisualization}
        onClose={() => setShowVisualization(false)}
        onRefresh={() => {
          if (input.trim()) {
            handleCreateVisualization();
          }
        }}
      />
    </Card>
  );
};
