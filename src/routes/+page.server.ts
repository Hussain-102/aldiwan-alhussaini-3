// +page.server.ts
import { createClient } from '@supabase/supabase-js';
import type { PageServerLoad } from './$types.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pageSize = 200;

export const load: PageServerLoad = async ({ url }) => {
  const currentPage = Number(url.searchParams.get('page')) || 1;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data: poems, error, count } = await supabase
      .from('poems')
      .select('id, title, slug, contents, counts, poet:poet_id (slug, poet_name)', { count: 'exact' })
      .range(from, to);

    if (error) {
      console.error('Error loading poems:', error);
      return { poems: [], currentPage, totalPages: 0 };
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 1;

    return {
      poems: poems || [],
      currentPage,
      totalPages
    };
  } catch (e) {
    console.error('Exception loading poems:', e);
    return { poems: [], currentPage: 1, totalPages: 0 };
  }
};
