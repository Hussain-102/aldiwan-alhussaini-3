<!-- src/lib/components/FilterDropdown.svelte -->

<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let themes: { name: string; slug: string }[] = [];
	export let tags: { name: string; slug: string }[] = [];

	let isOpen = false;
	let dropdownElement: HTMLElement;

	// --- State for selected filters ---
	let selectedThemes: string[] = $page.url.searchParams.getAll('theme');
	let selectedTags: string[] = $page.url.searchParams.getAll('tag');
	// --- New state for the tag match type ---
	let tagMatchType = $page.url.searchParams.get('tag_match') || 'or'; // Default to 'or'

	const unsubscribe = page.subscribe(p => {
		selectedThemes = p.url.searchParams.getAll('theme');
		selectedTags = p.url.searchParams.getAll('tag');
		tagMatchType = p.url.searchParams.get('tag_match') || 'or';
	});

	function applyFilters() {
		const newParams = new URLSearchParams();
        newParams.set('page', '1');
		selectedThemes.forEach(slug => newParams.append('theme', slug));
		selectedTags.forEach(slug => newParams.append('tag', slug));
		// Add the match type to the URL
		if (selectedTags.length > 0) {
			newParams.set('tag_match', tagMatchType);
		}
		goto(`?${newParams.toString()}`, { keepFocus: true, noScroll: true });
		isOpen = false;
	}

	// --- Click Handling ---
	function togglePanel() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && dropdownElement && !dropdownElement.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside, true);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside, true);
		}
		unsubscribe();
	});
</script>

<div class="filter-wrapper" bind:this={dropdownElement}>
	<button type="button" class="filter-button" on:click|stopPropagation={togglePanel}>
		فلتر
	</button>

	{#if isOpen}
		<div class="filter-panel">
			<div class="filter-section">
				<h3 class="section-title">المواضيع</h3>
				<div class="items-container">
					{#each themes as theme}
						<button
							type="button"
							class="item-button"
							class:selected={selectedThemes.includes(theme.slug)}
							on:click={() => {const i = selectedThemes.indexOf(theme.slug); i > -1 ? selectedThemes.splice(i, 1) : selectedThemes.push(theme.slug); selectedThemes = selectedThemes;}}
						>
							{theme.name}
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-section">
				<div class="section-header">
					<h3 class="section-title">الوسوم</h3>
					<!-- This is the new AND/OR toggle -->
					<div class="toggle-container">
						<label class:active={tagMatchType === 'or'}>
							<input type="radio" bind:group={tagMatchType} value="or" />
							مطابقة أي وسم
						</label>
						<label class:active={tagMatchType === 'and'}>
							<input type="radio" bind:group={tagMatchType} value="and" />
							مطابقة كل الوسوم
						</label>
					</div>
				</div>
				<div class="items-container">
					{#each tags as tag}
						<button
							type="button"
							class="item-button"
							class:selected={selectedTags.includes(tag.slug)}
							on:click={() => {const i = selectedTags.indexOf(tag.slug); i > -1 ? selectedTags.splice(i, 1) : selectedTags.push(tag.slug); selectedTags = selectedTags;}}
						>
							{tag.name}
						</button>
					{/each}
				</div>
			</div>
			
			<div class="footer">
				<button class="apply-button" on:click={applyFilters}>تطبيق الفلتر</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		position: relative;
	}
	.filter-button {
		padding: 0.5rem 1.5rem;
		border: 1px solid var(--poem-color);
		border-radius: 8px;
		background-color: var(--card-color);
		color: var(--text-color);
		cursor: pointer;
		font-size: 1rem;
	}
	.filter-panel {
		position: flex;
		top: 100%;
		width: 90vw;
		max-width: 600px;
		box-sizing: border-box;
		z-index: 20;
		background-color: var(--card-color);
		border: 1px solid rgba(128, 128, 128, 0.2);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.filter-section {
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(128, 128, 128, 0.1);
		margin-bottom: 0.75rem;
	}
    .section-title {
        font-weight: bold;
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0.5rem;
    }
	.toggle-container {
		display: flex;
		border: 1px solid var(--poem-color);
		border-radius: 4px;
		overflow: hidden;
		font-size: 0.8rem;
	}
	.toggle-container label {
		padding: 0.3rem 0.6rem;
		cursor: pointer;
		color: #888;
		transition: background-color 0.2s;
	}
	.toggle-container label.active {
		background-color: var(--text2-color);
		color: #333;
	}
	.toggle-container input[type="radio"] {
		display: none;
	}
	.items-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	/* --- NEW STYLES for the button items --- */
	.item-button {
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		border: 1px solid var(--card-color);
		background-color: transparent;
		color: var(--text-color);
		font-size: 0.9rem;
		transition: all 0.2s ease-in-out;
		cursor: pointer;
	}
	.item-button:hover {
		background-color: rgba(128, 128, 128, 0.1);
	}
	.item-button.selected {
		background-color: var(--poem-color);
		color: var(--text-color);
		border-color: #2c2d2e;
		opacity: 1 !important; /* Ensure selected items are always fully visible */
	}
	/* --- END NEW STYLES --- */
	.footer {
		margin: 1rem -1rem -1rem;
		padding: 0.75rem;
		text-align: center;
		border-top: 1px solid rgba(128, 128, 128, 0.1);
	}
	.apply-button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 8px;
		background-color: var(--poem-color);
		color: white;
		font-size: 1rem;
		cursor: pointer;
	}
	.apply-button:hover {
		background-color: #2c2d2e;
	}
</style>
