import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Calendar, MapPin, Tag, Save, DollarSign } from 'lucide-react';
import { SearchResult } from '../api/sparql';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResultsTableProps {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const ResultsTable = ({ results, total, page, totalPages, onPageChange, loading }: ResultsTableProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [tenderValue, setTenderValue] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [selectedTender, setSelectedTender] = React.useState<SearchResult | null>(null);

  const saveTender = async (tender: SearchResult) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save tenders.",
        variant: "destructive",
      });
      return;
    }

    setSavingId(tender.id);

    try {
      const { error } = await supabase
        .from('saved_tenders')
        .insert({
          user_id: user.id,
          ted_id: tender.id,
          title: tender.title,
          date: tender.date,
          cpv_code: tender.cpvCode,
          cpv_description: tender.cpvDescription,
          country: tender.country,
          country_name: tender.countryName,
          type: tender.type,
          uri: tender.uri,
          tender_value: tenderValue ? parseFloat(tenderValue) : null,
          notes: notes || null,
        });

      if (error) {
        // Check if it's a duplicate
        if (error.code === '23505') {
          toast({
            title: "Already Saved",
            description: "This tender is already in your saved list.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Tender Saved",
          description: "Successfully saved to your tender list.",
        });
        setSelectedTender(null);
        setTenderValue('');
        setNotes('');
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
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
    <Card className="shadow-lg">
      <CardHeader>
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
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">CPV Code</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={result.id} className="hover:bg-slate-50">
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-slate-900 line-clamp-2">
                      {result.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-slate-600 text-sm">
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
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-slate-500" />
                      <span className="text-slate-700">{result.countryName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={result.type === 'notice' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {result.type === 'notice' ? 'Notice' : 'Award'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(result.uri, '_blank')}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                      
                      {user && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTender(result)}
                              disabled={savingId === result.id}
                              className="flex items-center gap-1"
                            >
                              <Save className="h-3 w-3" />
                              {savingId === result.id ? 'Saving...' : 'Save'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Save Tender</DialogTitle>
                              <DialogDescription>
                                Add this tender to your saved list for market analysis
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="tender-value">Tender Value (EUR)</Label>
                                <Input
                                  id="tender-value"
                                  type="number"
                                  placeholder="e.g., 50000"
                                  value={tenderValue}
                                  onChange={(e) => setTenderValue(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add any notes about this tender..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => selectedTender && saveTender(selectedTender)}
                                  disabled={savingId === result.id}
                                  className="flex-1"
                                >
                                  {savingId === result.id ? 'Saving...' : 'Save Tender'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
            <div className="text-sm text-slate-600">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total.toLocaleString()} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
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
                      className={page === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
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
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsTable;