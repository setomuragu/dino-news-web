import type { APIRoute } from 'astro';

const mockArticles = [
    { id: 1, title_en: 'Mock: T-Rex Was a Gentle Giant', summary_en: 'A new study suggests T-Rex might have been a herbivore.', title_ko: '목업: 티렉스는 부드러운 거인이었다', summary_ko: '새로운 연구에 따르면 티렉스는 초식동물이었을 수도 있습니다.', source: 'Fake Science', source_url: '#', classify_method: 'test', confidence: 0.99, published_at: new Date().toISOString(), created_at: new Date().toISOString(), article_hash: 'dummy1' },
    { id: 2, title_en: 'Mock: Velociraptors Had Feathers', summary_en: 'Fossil evidence confirms that velociraptors were feathery creatures.', title_ko: '목업: 벨로시랩터는 깃털을 가지고 있었다', summary_ko: '화석 증거는 벨로시랩터가 깃털을 가진 생물이었음을 확인시켜줍니다.', source: 'Live Science', source_url: '#', classify_method: 'test', confidence: 0.95, published_at: new Date().toISOString(), created_at: new Date().toISOString(), article_hash: 'dummy2' },
];


export const GET: APIRoute = async ({ locals, request }) => {
    // @ts-ignore
    if (!locals?.runtime?.env?.DB) {
        console.warn("D1 binding not found. Returning mock data for local development.");
        return new Response(JSON.stringify({
            articles: mockArticles,
            total: mockArticles.length,
            page: 1,
            totalPages: 1
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // @ts-ignore
    const { env } = locals.runtime;
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const source = url.searchParams.get('source') || 'all';
    const searchQuery = url.searchParams.get('q') || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM articles';
    let countQuery = 'SELECT COUNT(*) as total FROM articles';
    
    const whereConditions = [];
    const baseParams: (string|number)[] = [];

    if (source !== 'all') {
        whereConditions.push('source = ?');
        baseParams.push(source);
    }

    if (searchQuery) {
        whereConditions.push('(title_ko LIKE ? OR title_en LIKE ? OR summary_ko LIKE ? OR summary_en LIKE ?)');
        const likeQuery = `%${searchQuery}%`;
        baseParams.push(likeQuery, likeQuery, likeQuery, likeQuery);
    }

    if (whereConditions.length > 0) {
        const whereClause = ' WHERE ' + whereConditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
    }

    query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    
    const queryParams = [...baseParams, limit, offset];
    const countParams = [...baseParams];

    try {
        const [articlesRes, countResult] = await Promise.all([
            env.DB.prepare(query).bind(...queryParams).all(),
            env.DB.prepare(countQuery).bind(...countParams).first()
        ]);

        return new Response(JSON.stringify({
            articles: articlesRes.results,
            total: countResult.total,
            page,
            totalPages: Math.ceil(countResult.total / limit)
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Database query failed" }), { status: 500 });
    }
}