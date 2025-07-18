import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, TrendingUp, Target, DollarSign, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SavedTender {
  id: string;
  ted_id: string;
  title: string;
  tender_value: number | null;
  currency: string;
  is_our_sector: boolean;
  cpv_code: string | null;
  country: string | null;
  date: string;
}

interface MarketAnalysis {
  id: string;
  analysis_name: string;
  description: string | null;
  total_market_value: number | null;
  our_sector_value: number | null;
  market_share_percentage: number | null;
  created_at: string;
}

const MarketShareCalculator = () => {
  const [savedTenders, setSavedTenders] = useState<SavedTender[]>([]);
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
  const [analysisName, setAnalysisName] = useState('');
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedTenders();
      fetchAnalyses();
    }
  }, [user]);

  const fetchSavedTenders = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedTenders(data || []);
    } catch (error) {
      console.error('Error fetching saved tenders:', error);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('market_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const calculateMarketShare = () => {
    const tendersWithValue = savedTenders.filter(t => t.tender_value && t.tender_value > 0);
    const ourSectorTenders = tendersWithValue.filter(t => t.is_our_sector);

    const totalMarketValue = tendersWithValue.reduce((sum, t) => sum + (t.tender_value || 0), 0);
    const ourSectorValue = ourSectorTenders.reduce((sum, t) => sum + (t.tender_value || 0), 0);
    
    const marketSharePercentage = totalMarketValue > 0 ? (ourSectorValue / totalMarketValue) * 100 : 0;

    return {
      totalMarketValue,
      ourSectorValue,
      marketSharePercentage,
      totalTenders: tendersWithValue.length,
      ourSectorTenders: ourSectorTenders.length,
    };
  };

  const saveAnalysis = async () => {
    if (!analysisName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an analysis name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const calculation = calculateMarketShare();
      
      const { error } = await supabase
        .from('market_analysis')
        .insert({
          analysis_name: analysisName,
          description: analysisDescription || null,
          total_market_value: calculation.totalMarketValue,
          our_sector_value: calculation.ourSectorValue,
          market_share_percentage: calculation.marketSharePercentage,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Analysis Saved",
        description: "Market share analysis has been saved successfully.",
      });

      setAnalysisName('');
      setAnalysisDescription('');
      fetchAnalyses();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOurSector = async (tenderId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_tenders')
        .update({ is_our_sector: !currentValue })
        .eq('id', tenderId);

      if (error) throw error;

      setSavedTenders(prev =>
        prev.map(t => t.id === tenderId ? { ...t, is_our_sector: !currentValue } : t)
      );

      toast({
        title: "Updated",
        description: !currentValue ? "Added to our sector" : "Removed from our sector",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculation = calculateMarketShare();

  if (!user) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access the market share calculator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Market Share Analysis
          </CardTitle>
          <CardDescription>
            Calculate your market share based on saved tenders marked as "our sector"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-slate-800">
                €{calculation.totalMarketValue.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Total Market Value</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-700">
                €{calculation.ourSectorValue.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Our Sector Value</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-700">
                {calculation.marketSharePercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-purple-600">Market Share</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {calculation.ourSectorTenders}/{calculation.totalTenders}
              </div>
              <div className="text-sm text-orange-600">Our/Total Tenders</div>
            </div>
          </div>

          {/* Save Analysis */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold">Save This Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="analysis-name">Analysis Name</Label>
                <Input
                  id="analysis-name"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder="e.g., Q4 2024 IT Services"
                />
              </div>
              <div>
                <Label htmlFor="analysis-description">Description (Optional)</Label>
                <Textarea
                  id="analysis-description"
                  value={analysisDescription}
                  onChange={(e) => setAnalysisDescription(e.target.value)}
                  placeholder="Additional notes about this analysis"
                  className="h-10"
                />
              </div>
            </div>
            <Button onClick={saveAnalysis} disabled={loading}>
              {loading ? "Saving..." : "Save Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Tenders */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Tenders ({savedTenders.length})</CardTitle>
          <CardDescription>
            Mark tenders as "our sector" to include them in market share calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedTenders.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No saved tenders yet. Search for tenders and save them to start calculating market share.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {savedTenders.map((tender) => (
                <div
                  key={tender.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{tender.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-slate-600">
                        {tender.tender_value 
                          ? `€${tender.tender_value.toLocaleString()}`
                          : 'No value set'
                        }
                      </span>
                      <span className="text-sm text-slate-500">•</span>
                      <span className="text-sm text-slate-600">{tender.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tender.is_our_sector && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Our Sector
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleOurSector(tender.id, tender.is_our_sector)}
                    >
                      {tender.is_our_sector ? "Remove" : "Add to Our Sector"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Analyses */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Analyses</CardTitle>
            <CardDescription>Your saved market share calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{analysis.analysis_name}</h4>
                    <Badge variant="outline">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  {analysis.description && (
                    <p className="text-sm text-slate-600 mb-2">{analysis.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Market Value:</span>
                      <div className="font-medium">
                        €{(analysis.total_market_value || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Our Value:</span>
                      <div className="font-medium">
                        €{(analysis.our_sector_value || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Market Share:</span>
                      <div className="font-medium text-purple-600">
                        {(analysis.market_share_percentage || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketShareCalculator;