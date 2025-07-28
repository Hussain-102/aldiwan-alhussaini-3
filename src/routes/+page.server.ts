
// src/routes/+page.server.ts (COMBINED FILTER LOGIC)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pageSize = 200;

export async function load({ url }) {
    console.log('\n--- Server: Page load started ---');
    try {
        const currentPage = Number(url.searchParams.get('page')) || 1;
        const selectedThemeSlugs = url.searchParams.getAll('theme');
        const selectedTagSlugs = url.searchParams.getAll('tag');
        // --- Get the new match type parameter ---
        const tagMatchType = url.searchParams.get('tag_match') || 'or';
        
        console.log(`Server: Filters - page: ${currentPage}, themes: [${selectedThemeSlugs}], tags: [${selectedTagSlugs}], match: ${tagMatchType}`);

        const themesPromise = supabase.from('themes').select('id, name, slug');
        const tagsPromise = supabase.from('tags').select('id, name, slug');

        let query = supabase.from('poems').select('*, poet:poet_id(slug, poet_name)', { count: 'exact' });

        let finalPoemIds: number[] | null = null;

        // --- Handle Theme Filtering (Always "OR") ---
        if (selectedThemeSlugs.length > 0) {
            console.log('Server: Applying theme filter...');
            const { data: themeData } = await supabase.from('themes').select('id').in('slug', selectedThemeSlugs);
            const themeIds = themeData?.map(t => t.id) ?? [];
            
            const { data: poemIdsData } = await supabase.from('poem_themes').select('poem_id').in('theme_id', themeIds);
            finalPoemIds = poemIdsData?.map(p => p.poem_id) ?? [];
        }

        // --- Handle Tag Filtering (Now with AND/OR logic) ---
        if (selectedTagSlugs.length > 0) {
            let tagPoemIds: number[] = [];
            const { data: tagData } = await supabase.from('tags').select('id').in('slug', selectedTagSlugs);
            const tagIds = tagData?.map(t => t.id) ?? [];

            if (tagMatchType === 'and') {
                // --- AND LOGIC ---
                console.log('Server: Applying tag filter (AND logic)...');
                const { data: rpcData } = await supabase.rpc('get_poems_with_all_tags', { tag_ids_array: tagIds });
                tagPoemIds = rpcData?.map(p => p.poem_id) ?? [];
            } else {
                // --- OR LOGIC ---
                console.log('Server: Applying tag filter (OR logic)...');
                const { data: poemIdsData } = await supabase.from('poem_tags').select('poem_id').in('tag_id', tagIds);
                tagPoemIds = poemIdsData?.map(p => p.poem_id) ?? [];
            }

            if (finalPoemIds !== null) {
                console.log('Server: Intersecting theme and tag results...');
                finalPoemIds = finalPoemIds.filter(id => tagPoemIds.includes(id));
            } else {
                finalPoemIds = tagPoemIds;
            }
        }

        if (finalPoemIds !== null) {
            query = query.in('id', finalPoemIds.length > 0 ? finalPoemIds : [-1]);
        }

        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        console.log('Server: Executing all database queries...');
        const [poemsResult, themesResult, tagsResult] = await Promise.all([query, themesPromise, tagsPromise]);

        if (poemsResult.error) throw poemsResult.error;
        if (themesResult.error) throw themesResult.error;
        if (tagsResult.error) throw tagsResult.error;

        const totalCount = poemsResult.count ?? 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        console.log(`Server: Found ${poemsResult.data?.length} poems, ${themesResult.data?.length} themes, ${tagsResult.data?.length} tags.`);
        console.log('--- Server: Page load successful ---\n');

        return {
            poems: poemsResult.data || [],
            themes: themesResult.data || [],
            tags: tagsResult.data || [],
            currentPage,
            totalPages,
        };

    } catch (error) {
        console.error('--- SERVER CRASHED ---', error);
        return {
            poems: [],
            themes: [],
            tags: [],
            currentPage: 1,
            totalPages: 0,
            error: 'Server error. Please check terminal logs for details.'
        };
    }
}
