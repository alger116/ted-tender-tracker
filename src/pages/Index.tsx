
import React, { useState } from 'react';
import { Database, Info, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import SearchForm from '../components/SearchForm';
import ResultsTable from '../components/ResultsTable';
import { searchTED, SearchFilters, SearchResponse } from '../api/sparql';
import { exportToCSV } from '../utils/csvExport';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  const { toast } = useToast();

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setCurrentFilters(filters);
    
    try {
      console.log('Searching with filters:', filters);
      const response = await searchTED(filters);
      setSearchResponse(response);
      
      toast({
        title: "Search completed",
        description: `Found ${response.total.toLocaleString()} results`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setSearchResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!currentFilters) return;
    
    const filters = { ...currentFilters, page };
    await handleSearch(filters);
  };

  const handleExport = async (type: 'page' | 'all') => {
    if (!searchResponse) return;
    
    try {
      let resultsToExport = searchResponse.results;
      
      if (type === 'all' && searchResponse.total > searchResponse.results.length) {
        // Fetch all results for export
        toast({
          title: "Preparing export",
          description: "Fetching all results for export...",
        });
        
        const allResultsResponse = await searchTED({
          ...currentFilters,
          page: 1,
          pageSize: searchResponse.total
        });
        resultsToExport = allResultsResponse.results;
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ted_search_${type}_${timestamp}.csv`;
      
      exportToCSV(resultsToExport, filename);
      
      toast({
        title: "Export successful",
        description: `Downloaded ${resultsToExport.length} results as ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export results. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">TED Open Data Explorer</h1>
                <p className="text-sm text-slate-600">Search EU Tenders Electronic Daily notices and tenders</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://data.europa.eu/data/datasets/ted-csv', '_blank')}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              About TED Data
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool searches the EU's Tenders Electronic Daily (TED) database using SPARQL queries. 
            Use the filters below to find specific notices and tenders, then export your results as CSV files.
          </AlertDescription>
        </Alert>

        {/* Search Form */}
        <SearchForm
          onSearch={handleSearch}
          onExport={handleExport}
          loading={loading}
          hasResults={searchResponse?.results.length > 0}
        />

        {/* Results Table */}
        {(searchResponse || loading) && (
          <ResultsTable
            results={searchResponse?.results || []}
            total={searchResponse?.total || 0}
            page={searchResponse?.page || 1}
            totalPages={searchResponse?.totalPages || 0}
            onPageChange={handlePageChange}
            loading={loading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              <p>Data sourced from the European Union's TED (Tenders Electronic Daily) database</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://data.europa.eu/sparql', '_blank')}
                className="text-slate-600 hover:text-slate-800"
              >
                SPARQL Endpoint
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://data.europa.eu/data/datasets/ted-csv', '_blank')}
                className="text-slate-600 hover:text-slate-800"
              >
                Data Documentation
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
