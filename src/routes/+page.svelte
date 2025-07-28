<script lang="ts">
  import { onMount } from 'svelte';
  import { createClient } from '@supabase/supabase-js';
  import Header from '$lib/components/header.svelte';
  import FilterDropdown from '$lib/components/FilterDropdown.svelte';
  import '../app.css';

  // --- Supabase Client Setup ---
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (typeof window !== 'undefined') {
    window.supabase = supabase;
  }

  // --- Component Props ---
  export let data;

  // --- State Variables ---
  let poems = data.poems;
  let query = '';
  let results = [];
  let loading = false;
  let error = '';
  let selectedMatchType = 'all';
  let searchTimeout;

  // --- Pagination State ---
  let currentPage = 1;
  const pageSize = 20;
  
  // --- Reactive Logic ---
  $: if (data.poems !== poems) {
    poems = data.poems;
    query = '';
    results = [];
    currentPage = 1;
  }

  function handleInput() {
    clearTimeout(searchTimeout);
    currentPage = 1;
    
    if (query.trim().length === 0) {
      results = [];
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    searchTimeout = setTimeout(() => {
      search();
    }, 300);
  }

  // --- Core Search Function ---
  async function search() {
    if (!query.trim()) {
      results = [];
      return;
    }

    loading = true;
    error = '';

    try {
      const { data: searchData, error: err } = await supabase.rpc('search_poems_1', {
        query_text: query,
        match_type: selectedMatchType,
        page_number: currentPage,
      });

      if (err) {
        console.error('Supabase RPC error:', err);
        error = 'حدث خطأ في البحث';
        results = [];
      } else {
        results = searchData || [];
      }
    } catch (e) {
      console.error('Exception during search:', e);
      error = 'حدث خطأ في البحث';
      results = [];
    } finally {
      loading = false;
    }
  }

  // --- Helper Functions ---
  function highlight(text: string | null | undefined, keyword: string): string {
    if (!text) return '';
    if (!keyword.trim()) return text;
    try {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch (e) {
      console.error('Highlight error:', e);
      return text;
    }
  }

  function formatExcerpt(text: string): string {
    if (!text) return '';
    const replaced = text.trim().replace(/\*/g, ' — ');
    return `<span class="py-1">${replaced}</span>`;
  }

  // --- Reactive Computations ---
  $: if (query.trim() && currentPage) {
    search();
  }

  $: displayedPoems = query.trim() ? results : poems;

  $: totalPages = query.trim()
    ? 100 
    : Math.ceil((poems?.length || 0) / pageSize);

  $: paginatedPoems = query.trim() ? displayedPoems : displayedPoems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- Pagination Controls ---
  function goToNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  // --- Active Filter Title ---
  let activeFilterTitle = '';
	$: {
		if (data.activeTheme) {
			const theme = data.themes.find((t) => t.slug === data.activeTheme);
			activeFilterTitle = `المواضيع: ${theme?.name}`;
		} else if (data.activeTag) {
			const tag = data.tags.find((t) => t.slug === data.activeTag);
			activeFilterTitle = `الوسوم: ${tag?.name}`;
		} else {
			activeFilterTitle = '';
		}
	}
</script>

<Header />

<div class="title">
  <h1 class="main-title">الديـــوان الحسيني</h1>
</div>

<div class="search-grid">
  <input 
    class="searching"
    type="text"
    placeholder="اكتب كلمة للبحث..."
    bind:value={query}
    on:input={handleInput}
  />
  <select bind:value={selectedMatchType} class="match-type-select">
    <option value="exact">مطابقة تامة</option>
    <option value="all">جميع الكلمات</option>
    <option value="any">مطابقة تقريبية</option>
  </select>
</div>
<div class="filters-container">
    <FilterDropdown themes={data.themes} tags={data.tags} />
</div>

<!-- Filter Dropdown Container -->

<!-- Status Messages -->
{#if loading}
  <div class="loading">جاري البحث...</div>
{/if}
{#if error}
  <div class="error">{error}</div>
{/if}
{#if query.trim() && results.length === 0 && !loading}
  <div class="no-results">لا توجد نتائج للبحث</div>
{/if}
{#if !query.trim() && poems.length === 0 && !loading}
    <p class="no-results">لا توجد قصائد تطابق هذا الفلتر.</p>
{/if}




<!-- Poem Cards Grid -->
<div class="card-grid">
  {#each paginatedPoems as poem (poem.id)}
    <a href={`/poets/${poem.poet?.slug}/${poem.slug}`} class="card">
      <h3 class="grid-one">
        <p class="card-count">عدد الأبيات {poem.counts}</p>
        <p class="card-name">{poem.title}</p>
        <p class="card-tag">{poem.poet?.poet_name}</p>
        {#if query.trim() && (poem.excerpt || poem.contents)}
          <p class="card-excerpt" dir="rtl">
            {@html highlight(formatExcerpt(poem.excerpt || poem.contents), query)}
          </p>
        {/if}
      </h3>
    </a>
  {/each}
</div>

<!-- Pagination -->
<nav class="pagination-buttons">
    <a class="previous" href on:click|preventDefault={goToPreviousPage} class:disabled={currentPage === 1}>السابق</a>
  <span class="pagename">صفحة {currentPage} من {totalPages}</span>
  <a class="next" href on:click|preventDefault={goToNextPage} class:disabled={currentPage === totalPages}>التالي</a>
</nav>

<style>
  /* Styles from your first code snippet */
  .loading, .error, .no-results {
    text-align: center;
    padding: 20px;
    margin: 10px 0;
  }

  .error {
    color: rgb(189, 14, 14);
    background: var(--bg-color);
    border: 1px solid #908d8d5e;
    border-radius: 4px;
  }

  .no-results {
    color: #666;
    background: var(--bg-color);
    border-radius: 4px;
  }

  @media (min-width: 768px) {
    .card-excerpt {
      max-width: 301px;
    }
  }
  .filters-container {
        display: flex;
        justify-content: center; /* This centers the button */
        padding: 1rem;
    }
</style>
