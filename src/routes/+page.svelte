<script lang="ts">
  import Header from '$lib/components/header.svelte';

  export let data;

  let poems = data.poems || [];

  let currentPage = 1;
  const pageSize = 20;

  // حساب عدد الصفحات بناءً على عدد القصائد
  $: totalPages = Math.ceil(poems.length / pageSize);

  function getCardsForPage(page: number) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return poems.slice(start, end);
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

<div class="card-grid">
  {#each paginatedPoems as poem}
    <a href={`/poets/${poem.poet?.slug}/${poem.slug}`} class="card">
      <h3 class="grid-one">
        <p class="card-count">عدد الأبيات {poem.counts}</p>
        <p class="card-name">{poem.title}</p>
        <p class="card-tag">{poem.poet?.poet_name}</p>
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
