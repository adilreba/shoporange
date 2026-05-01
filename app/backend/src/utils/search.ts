import { Client } from '@opensearch-project/opensearch';

const OPENSEARCH_URL = process.env.OPENSEARCH_URL;
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'atushome-products';

let client: Client | null = null;

function getClient(): Client | null {
  if (!OPENSEARCH_URL) {
    return null;
  }
  if (!client) {
    client = new Client({ node: OPENSEARCH_URL });
  }
  return client;
}

/**
 * Initialize product index with mapping
 */
export async function initProductIndex(): Promise<void> {
  const os = getClient();
  if (!os) return;

  try {
    const exists = await os.indices.exists({ index: OPENSEARCH_INDEX });
    if (!exists.body) {
      await os.indices.create({
        index: OPENSEARCH_INDEX,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              description: { type: 'text', analyzer: 'standard' },
              brand: { type: 'keyword' },
              category: { type: 'keyword' },
              price: { type: 'float' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      console.log(`[OpenSearch] Index '${OPENSEARCH_INDEX}' created`);
    }
  } catch (error) {
    console.error('[OpenSearch] initProductIndex error:', error);
  }
}

/**
 * Index a single product document
 */
export async function indexProduct(product: Record<string, any>): Promise<void> {
  const os = getClient();
  if (!os) return;

  try {
    await os.index({
      index: OPENSEARCH_INDEX,
      id: product.id,
      body: {
        id: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        category: product.category,
        price: product.price,
        status: product.status || 'active',
        createdAt: product.createdAt || new Date().toISOString(),
      },
      refresh: true,
    });
  } catch (error) {
    console.error('[OpenSearch] indexProduct error:', error);
  }
}

/**
 * Bulk index multiple products
 */
export async function bulkIndexProducts(
  products: Array<Record<string, any>>
): Promise<void> {
  const os = getClient();
  if (!os || products.length === 0) return;

  try {
    const body = products.flatMap((product) => [
      { index: { _index: OPENSEARCH_INDEX, _id: product.id } },
      {
        id: product.id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        category: product.category,
        price: product.price,
        status: product.status || 'active',
        createdAt: product.createdAt || new Date().toISOString(),
      },
    ]);

    await os.bulk({ body, refresh: true });
  } catch (error) {
    console.error('[OpenSearch] bulkIndexProducts error:', error);
  }
}

/**
 * Delete a product from the index
 */
export async function deleteProductIndex(productId: string): Promise<void> {
  const os = getClient();
  if (!os) return;

  try {
    await os.delete({
      index: OPENSEARCH_INDEX,
      id: productId,
    });
  } catch (error) {
    console.error('[OpenSearch] deleteProductIndex error:', error);
  }
}

interface SearchOptions {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  from?: number;
  size?: number;
}

interface SearchResult {
  products: Array<Record<string, any>>;
  total: number;
  took: number;
}

/**
 * Full-text search products
 */
export async function searchProducts(
  options: SearchOptions
): Promise<SearchResult> {
  const os = getClient();
  if (!os) {
    // OpenSearch yoksa boş sonuç döndür (fallback)
    return { products: [], total: 0, took: 0 };
  }

  const { query, category, minPrice, maxPrice, sortBy = 'relevance', from = 0, size = 20 } = options;

  const must: any[] = [
    {
      multi_match: {
        query,
        fields: ['name^3', 'description^2', 'brand'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    },
    { term: { status: 'active' } },
  ];

  if (category) {
    must.push({ term: { category } });
  }

  const filter: any[] = [];
  if (minPrice !== undefined || maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (minPrice !== undefined) range.gte = minPrice;
    if (maxPrice !== undefined) range.lte = maxPrice;
    filter.push({ range: { price: range } });
  }

  let sort: any[] = [];
  switch (sortBy) {
    case 'price_asc':
      sort = [{ price: 'asc' }];
      break;
    case 'price_desc':
      sort = [{ price: 'desc' }];
      break;
    case 'newest':
      sort = [{ createdAt: 'desc' }];
      break;
    default:
      sort = [{ _score: 'desc' }];
  }

  try {
    const result = await os.search({
      index: OPENSEARCH_INDEX,
      body: {
        from,
        size,
        query: { bool: { must, filter } },
        sort,
      },
    });

    const hits = result.body.hits.hits;
    const total = typeof result.body.hits.total === 'number'
      ? result.body.hits.total
      : result.body.hits.total?.value || 0;

    return {
      products: hits.map((hit: any) => ({ ...hit._source, score: hit._score })),
      total,
      took: result.body.took,
    };
  } catch (error) {
    console.error('[OpenSearch] searchProducts error:', error);
    return { products: [], total: 0, took: 0 };
  }
}

/**
 * Suggest product names (autocomplete)
 */
export async function suggestProducts(
  prefix: string,
  size = 5
): Promise<string[]> {
  const os = getClient();
  if (!os) return [];

  try {
    const result = await os.search({
      index: OPENSEARCH_INDEX,
      body: {
        size: 0,
        query: {
          prefix: { 'name.keyword': prefix },
        },
        aggs: {
          suggestions: {
            terms: {
              field: 'name.keyword',
              size,
            },
          },
        },
      },
    });

    const agg = result.body.aggregations?.suggestions as any;
    const buckets = agg?.buckets || [];
    return buckets.map((b: any) => b.key);
  } catch (error) {
    console.error('[OpenSearch] suggestProducts error:', error);
    return [];
  }
}
