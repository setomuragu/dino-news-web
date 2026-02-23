import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    // @ts-ignore
    if (!locals?.runtime?.env?.DB) {
        console.warn("D1 binding not found. Returning mock success for local development.");
        const body = await request.json();
        return new Response(JSON.stringify({ success: true, id: Math.floor(Math.random() * 1000), duplicate: false, mock: true }), { status: 200 });
    }

    // @ts-ignore
    const { env } = locals.runtime;

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.PUBLISH_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate body
        if (!body.article_hash) {
            return new Response(JSON.stringify({ error: 'Missing article_hash' }), { status: 400 });
        }

        // Check for duplicates
        const existing = await env.DB.prepare(
            'SELECT id FROM articles WHERE article_hash = ?'
        ).bind(body.article_hash).first();

        if (existing) {
            return new Response(JSON.stringify({ success: true, id: existing.id, duplicate: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert into D1
        const result = await env.DB.prepare(`
            INSERT INTO articles (title_en, summary_en, title_ko, summary_ko,
                                  source, source_url, classify_method, confidence, article_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            body.title_en || '',
            body.summary_en || '',
            body.title_ko || '',
            body.summary_ko || '',
            body.source || '',
            body.source_url || '',
            body.classify_method || '',
            body.confidence || 0,
            body.article_hash
        ).run();

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error(e);
        return new Response(JSON.stringify({ error: "Failed to process request" }), { status: 500 });
    }
}