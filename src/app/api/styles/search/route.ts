import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { type StyleSearchResponse, type Style, type StyleSuggestion } from '@/types/contract';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const isExact = searchParams.get('exact') === 'true';

  if (!searchQuery) {
    return NextResponse.json({
      success: false,
      message: 'Search query is required',
      styles: [],
      total: 0,
      query: ''
    } satisfies StyleSearchResponse, { status: 400 });
  }

  try {
    let searchResults: any[] = [];
    
    if (isExact) {
      // Exact match search for style number
      const result = await query(`
        SELECT 
          style_number,
          item_number,
          item_desc,
          season,
          business_line,
          created_at,
          updated_at
        FROM styles 
        WHERE UPPER(style_number) = UPPER($1)
        LIMIT 1
      `, [searchQuery]);
      
      searchResults = result.rows;
    } else {
      // Fuzzy search across multiple fields
      const searchPattern = `%${searchQuery.toLowerCase()}%`;
      
      const result = await query(`
        SELECT 
          style_number,
          item_number,
          item_desc,
          season,
          business_line,
          created_at,
          updated_at,
          CASE 
            WHEN UPPER(style_number) = UPPER($1) THEN 1.0
            WHEN UPPER(style_number) LIKE UPPER($2) THEN 0.9
            WHEN UPPER(item_number) = UPPER($1) THEN 0.8
            WHEN UPPER(item_number) LIKE UPPER($2) THEN 0.7
            WHEN UPPER(item_desc) LIKE UPPER($2) THEN 0.6
            ELSE 0.5
          END as confidence_score
        FROM styles 
        WHERE 
          UPPER(style_number) LIKE UPPER($2) OR
          UPPER(item_number) LIKE UPPER($2) OR
          UPPER(item_desc) LIKE UPPER($2) OR
          UPPER(season) LIKE UPPER($2) OR
          UPPER(business_line) LIKE UPPER($2)
        ORDER BY confidence_score DESC, style_number ASC
        LIMIT $3
      `, [searchQuery, searchPattern, limit]);
      
      searchResults = result.rows;
    }

    // Transform results into StyleSuggestion format
    const suggestions: StyleSuggestion[] = searchResults.map((row: any) => ({
      style: {
        style_number: row.style_number,
        item_number: row.item_number,
        item_desc: row.item_desc,
        season: row.season,
        business_line: row.business_line,
        created_at: row.created_at,
        updated_at: row.updated_at
      } satisfies Style,
      confidence: row.confidence_score || 1.0,
      match_reason: getMatchReason(searchQuery, row)
    }));

    return NextResponse.json({
      success: true,
      styles: suggestions,
      total: suggestions.length,
      query: searchQuery
    } satisfies StyleSearchResponse);

  } catch (error) {
    console.error('Style search error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to search styles',
      styles: [],
      total: 0,
      query: searchQuery
    } satisfies StyleSearchResponse, { status: 500 });
  }
}

/**
 * Determine the reason for the match to help users understand search results
 */
function getMatchReason(searchQuery: string, row: any): string {
  const query = searchQuery.toLowerCase();
  
  if (row.style_number.toLowerCase().includes(query)) {
    return 'Style number match';
  }
  
  if (row.item_number.toLowerCase().includes(query)) {
    return 'Item number match';
  }
  
  if (row.item_desc.toLowerCase().includes(query)) {
    return 'Description match';
  }
  
  if (row.season.toLowerCase().includes(query)) {
    return 'Season match';
  }
  
  if (row.business_line.toLowerCase().includes(query)) {
    return 'Business line match';
  }
  
  return 'General match';
}