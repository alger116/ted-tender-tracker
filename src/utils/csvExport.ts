
import Papa from 'papaparse';
import { SearchResult } from '../api/sparql';

export function exportToCSV(results: SearchResult[], filename: string = 'ted_search_results.csv') {
  const csvData = results.map(result => ({
    'ID': result.id,
    'Title': result.title,
    'Date': result.date,
    'CPV Code': result.cpvCode,
    'CPV Description': result.cpvDescription,
    'Country Code': result.country,
    'Country Name': result.countryName,
    'Type': result.type === 'notice' ? 'Contract Notice' : 'Contract Award',
    'URI': result.uri,
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
