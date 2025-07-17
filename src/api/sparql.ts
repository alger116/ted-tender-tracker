
import config from '../config/config.json';

export interface SearchFilters {
  keywords?: string;
  type?: 'notice' | 'tender';
  dateFrom?: string;
  dateTo?: string;
  cpvCode?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  date: string;
  cpvCode: string;
  cpvDescription: string;
  country: string;
  countryName: string;
  type: string;
  uri: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildSparqlQuery(filters: SearchFilters, countOnly: boolean = false): string {
  const { keywords, type, dateFrom, dateTo, cpvCode, country } = filters;
  
  const selectClause = countOnly 
    ? 'SELECT (COUNT(DISTINCT ?notice) AS ?total)'
    : `SELECT DISTINCT ?notice ?title ?date ?cpvCode ?cpvDescription ?country ?countryName ?type ?uri`;
    
  let whereClause = `
    WHERE {
      ?notice a <http://data.europa.eu/a4g/ontology#Notice> ;
              <http://data.europa.eu/a4g/ontology#hasTitle> ?title ;
              <http://data.europa.eu/a4g/ontology#hasPublicationDate> ?date ;
              <http://data.europa.eu/a4g/ontology#refersToTender> ?tender .
      
      ?tender <http://data.europa.eu/a4g/ontology#hasCPVCode> ?cpvCode ;
              <http://data.europa.eu/a4g/ontology#hasCountry> ?country .
      
      ?cpvCode <http://www.w3.org/2000/01/rdf-schema#label> ?cpvDescription .
      ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryName .
      
      BIND(IF(EXISTS { ?notice a <http://data.europa.eu/a4g/ontology#ContractNotice> }, "notice", "tender") AS ?type)
      BIND(?notice AS ?uri)
  `;

  // Add filters
  const filters_array = [];
  
  if (keywords) {
    filters_array.push(`FILTER(CONTAINS(LCASE(?title), LCASE("${keywords}")))`);
  }
  
  if (type) {
    const typeFilter = type === 'notice' 
      ? '?notice a <http://data.europa.eu/a4g/ontology#ContractNotice>'
      : '?notice a <http://data.europa.eu/a4g/ontology#ContractAwardNotice>';
    filters_array.push(`FILTER(EXISTS { ${typeFilter} })`);
  }
  
  if (dateFrom) {
    filters_array.push(`FILTER(?date >= "${dateFrom}"^^xsd:date)`);
  }
  
  if (dateTo) {
    filters_array.push(`FILTER(?date <= "${dateTo}"^^xsd:date)`);
  }
  
  if (cpvCode) {
    filters_array.push(`FILTER(STRSTARTS(STR(?cpvCode), "${cpvCode}"))`);
  }
  
  if (country) {
    filters_array.push(`FILTER(?country = <http://publications.europa.eu/resource/authority/country/${country}>)`);
  }

  whereClause += filters_array.join('\n      ') + '\n    }';
  
  const orderClause = countOnly ? '' : '\n    ORDER BY DESC(?date)';
  
  return `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    ${selectClause}
    ${whereClause}${orderClause}`;
}

export async function searchTED(filters: SearchFilters): Promise<SearchResponse> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || config.defaultPageSize;
  
  try {
    // First, get total count
    const countQuery = buildSparqlQuery(filters, true);
    console.log('Count Query:', countQuery);
    
    const countResponse = await fetch(config.sparqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
      },
      body: countQuery,
    });
    
    if (!countResponse.ok) {
      throw new Error(`SPARQL query failed: ${countResponse.statusText}`);
    }
    
    const countData = await countResponse.json();
    const total = parseInt(countData.results.bindings[0]?.total?.value || '0');
    
    // Then get paginated results
    const dataQuery = buildSparqlQuery(filters, false) + 
      ` LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;
    console.log('Data Query:', dataQuery);
    
    const dataResponse = await fetch(config.sparqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
      },
      body: dataQuery,
    });
    
    if (!dataResponse.ok) {
      throw new Error(`SPARQL query failed: ${dataResponse.statusText}`);
    }
    
    const data = await dataResponse.json();
    
    const results: SearchResult[] = data.results.bindings.map((binding: any) => ({
      id: binding.notice?.value.split('/').pop() || '',
      title: binding.title?.value || '',
      date: binding.date?.value || '',
      cpvCode: binding.cpvCode?.value.split('/').pop() || '',
      cpvDescription: binding.cpvDescription?.value || '',
      country: binding.country?.value.split('/').pop() || '',
      countryName: binding.countryName?.value || '',
      type: binding.type?.value || '',
      uri: binding.uri?.value || '',
    }));
    
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      results,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error('SPARQL query error:', error);
    throw new Error(`Failed to query TED data: ${error}`);
  }
}

export function getMetadata() {
  return {
    cpvCodes: config.cpvCodes,
    countries: config.countries,
  };
}
