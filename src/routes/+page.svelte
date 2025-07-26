<script lang="ts">
  import Header from '$lib/components/header.svelte';

  // بيانات ثابتة للقصائد (بدل ما تجي من قاعدة بيانات)
  let poems = [
    {
      slug: 'poem-1',
      title: 'قصيدة 1',
      counts: 10,
      contents: 'هذا نص القصيدة الأولى',
      excerpt: 'هذا نص القصيدة الأولى',
      poet: { slug: 'poet-1', poet_name: 'الشاعر الأول' }
    },
    {
      slug: 'poem-2',
      title: 'قصيدة 2',
      counts: 12,
      contents: 'هذا نص القصيدة الثانية',
      excerpt: 'هذا نص القصيدة الثانية',
      poet: { slug: 'poet-2', poet_name: 'الشاعر الثاني' }
    },
    // أضف المزيد حسب الحاجة
  ];

  let query = '';
  let results = [];
  let loading = false;
  let error = '';

  let selectedMatchType = 'all';
  let searchTimeout;

  let currentPage = 1;
  const pageSize = 20;

  // Reset page and debounce on new input
  function handleInput() {
    clearTimeout(searchTimeout);

    if (query.trim().length === 0) {
      results = [];
      currentPage = 1;
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    currentPage = 1;

    searchTimeout = setTimeout(() => {
      search();
    }, 300);
  }

  // بحث محلي على مصفوفة poems
  function search() {
    loading = true;
    error = '';

    try {
      const lowerQuery = query.trim().toLowerCase();
      const words = lowerQuery.split(/\s+/);

      results = poems.filter((poem) => {
        const text = (poem.title + ' ' + (poem.contents || '')).toLowerCase();

        if (selectedMatchType === 'exact') {
          return text === lowerQuery;
        } else if (selectedMatchType === 'all') {
          return words.every(w => text.includes(w));
        } else if (selectedMatchType === 'any') {
          return words.some(w => text.includes(w));
        }
        return false;
      });
    } catch (e) {
      error = 'حدث خطأ أثناء البحث';
      results = [];
    } finally {
      loading = false;
    }
  }

  // Highlight matches
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

  // Format excerpt text
  function formatExcerpt(text: string, lineCount: number = 1): string {
    if (!text) return '';
    const replaced = text.trim().replace(/\*/g, ' — ');
    return `<span class="py-1">${replaced}</span>`;
  }

  // بيانات للعرض (نتائج البحث أو كل القصائد)
  $: displayedPoems = query.trim() ? results : poems;

  // Pagination count
  $: totalPages = query.trim()
    ? Math.ceil(displayedPoems.length / pageSize)
    : Math.ceil(poems.length / pageSize);

  function getCardsForPage(page: number) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return displayedPoems.slice(start, end);
  }

  $: paginatedPoems = getCardsForPage(currentPage);

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
</script>

<Header />

<div class="title">
  <title class="title-bar">aldiwan</title>
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

{#if loading}
  <div class="loading">جاري البحث...</div>
{/if}

{#if error}
  <div class="error">{error}</div>
{/if}

{#if query.trim() && results.length === 0 && !loading}
  <div class="no-results">لا توجد نتائج للبحث</div>
{/if}

<div class="card-grid">
  {#each paginatedPoems as poem}
    <a href={`/poets/${poem.poet?.slug}/${poem.slug}`} class="card">
      <h3 class="grid-one">
        <p class="card-count">عدد الأبيات {poem.counts}</p>
        <p class="card-name">{poem.title}</p>
        <p class="card-tag">{poem.poet?.poet_name}</p>
        {#if query.trim()}
          <p class="card-excerpt" dir="rtl">
            {@html highlight(formatExcerpt(poem.excerpt || poem.contents, 1), query)}
          </p>
        {/if}
      </h3>
    </a>
  {/each}
</div>

<nav class="pagination-buttons">
  <button on:click={goToPreviousPage} disabled={currentPage === 1}>السابق</button>
  <span class="pagename">صفحة {currentPage} من {totalPages}</span>
  <button on:click={goToNextPage} disabled={currentPage === totalPages}>التالي</button>
</nav>

<style>
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

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(250px,1fr));
    gap: 1rem;
  }

  .pagination-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;
    gap: 1rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
