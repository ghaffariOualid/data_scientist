import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, RefreshCw } from 'lucide-react';

interface PlotlyVisualizationProps {
  plotData: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const PlotlyVisualization = ({ 
  plotData, 
  isOpen, 
  onClose, 
  onRefresh 
}: PlotlyVisualizationProps) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && plotData && plotRef.current) {
      // Charger Plotly dynamiquement
      const script = document.createElement('script');
      script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
      script.onload = () => {
        if (window.Plotly && plotRef.current) {
          window.Plotly.newPlot(plotRef.current, plotData.data, plotData.layout, {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
          });
        }
      };
      document.head.appendChild(script);

      return () => {
        // Nettoyer le script
        const existingScript = document.querySelector('script[src="https://cdn.plot.ly/plotly-latest.min.js"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [isOpen, plotData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Visualisation IA</h3>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Fermer
            </Button>
          </div>
        </div>

        {/* Plotly Container */}
        <div className="flex-1 p-4">
          <div 
            ref={plotRef} 
            className="w-full h-full min-h-[500px]"
            style={{ minHeight: '500px' }}
          />
        </div>
      </Card>
    </div>
  );
};

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    Plotly: any;
  }
}



