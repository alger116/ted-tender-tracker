
import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from '../api/sparql';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  onExport: (type: 'page' | 'all') => void;
  loading: boolean;
  hasResults: boolean;
}

interface CPVCode {
  code: string;
  description: string;
}

interface Country {
  code: string;
  name: string;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, onExport, loading, hasResults }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    keywords: '',
    type: undefined,
    dateFrom: '',
    dateTo: '',
    cpvCode: '',
    country: '',
  });

  const [metadata, setMetadata] = useState<{
    cpvCodes: CPVCode[];
    countries: Country[];
  }>({
    cpvCodes: [],
    countries: [],
  });

  useEffect(() => {
    // Load metadata from config
    import('../config/config.json').then((config) => {
      setMetadata({
        cpvCodes: config.cpvCodes || [],
        countries: config.countries || [],
      });
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ ...filters, page: 1 });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      keywords: '',
      type: undefined,
      dateFrom: '',
      dateTo: '',
      cpvCode: '',
      country: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-lg border-0 bg-gradient-to-br from-slate-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Search className="h-6 w-6" />
          </div>
          TED Open Data Explorer
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Keywords and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Keywords
              </label>
              <Input
                type="text"
                placeholder="Search in notice titles..."
                value={filters.keywords || ''}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <Select value={filters.type || ''} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="notice">Contract Notice</SelectItem>
                  <SelectItem value="tender">Contract Award</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date From
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date To
              </label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CPV Code and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CPV Code
              </label>
              <Select value={filters.cpvCode || ''} onValueChange={(value) => handleFilterChange('cpvCode', value)}>
                <SelectTrigger className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All CPV codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All CPV codes</SelectItem>
                  {metadata.cpvCodes.map((cpv) => (
                    <SelectItem key={cpv.code} value={cpv.code}>
                      {cpv.code} - {cpv.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <Select value={filters.country || ''} onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All countries</SelectItem>
                  {metadata.countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search TED
                </>
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              onClick={clearFilters}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>

            {hasResults && (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onExport('page')}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Page
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onExport('all')}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
