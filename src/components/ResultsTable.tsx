
import React from 'react';
import { ExternalLink, Calendar, MapPin, Tag } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchResult } from '../api/sparql';

interface ResultsTableProps {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  total,
  page,
  totalPages,
  onPageChange,
  loading
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-EU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg text-slate-600">Searching TED database...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-slate-500">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p>Try adjusting your search criteria or removing some filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-800">
            Search Results ({total.toLocaleString()} total)
          </span>
          <Badge variant="secondary" className="text-sm">
            Page {page} of {totalPages}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-700">Title</TableHead>
                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                <TableHead className="font-semibold text-slate-700">CPV Code</TableHead>
                <TableHead className="font-semibold text-slate-700">Country</TableHead>
                <TableHead className="font-semibold text-slate-700">Type</TableHead>
                <TableHead className="font-semibold text-slate-700 w-16">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow 
                  key={result.id} 
                  className={`hover:bg-slate-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                  }`}
                >
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-slate-900 line-clamp-2">
                      {result.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-slate-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(result.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {result.cpvCode}
                      </Badge>
                      <div className="text-xs text-slate-500 max-w-xs truncate">
                        {result.cpvDescription}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-slate-500" />
                      <span className="text-slate-700">{result.countryName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={result.type === 'notice' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {result.type === 'notice' ? 'Contract Notice' : 'Contract Award'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(result.uri, '_blank')}
                      className="h-8 w-8 p-0 hover:bg-blue-50"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total.toLocaleString()} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="text-slate-600 border-slate-300"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className={page === pageNum ? "bg-blue-600 hover:bg-blue-700" : "text-slate-600"}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="text-slate-600 border-slate-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsTable;
