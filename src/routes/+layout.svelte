<script lang="ts">
  import '../app.css';
  import { ModeWatcher, toggleMode } from "mode-watcher";

	let { children } = $props();
  
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic&display=swap" rel="stylesheet">
</svelte:head>
<ModeWatcher />
<div class="h-screen w-screen bg-primary" dir="rtl">
  {@render children()}
</div>
<style global>
	/* This targets all elements and removes the blue tap highlight on mobile */
	* {
		-webkit-tap-highlight-color: transparent;
	}
</style>