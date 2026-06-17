<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { auth } from '$lib/authStore.svelte';
	import { navigating } from '$app/stores';
	import LoadingBar from '$lib/components/LoadingBar.svelte';

	let { data, children } = $props();

	$effect(() => {
		auth.setUser(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<LoadingBar />

<div
	class="transition-all duration-300 ease-in-out"
	class:opacity-40={!!$navigating}
	class:pointer-events-none={!!$navigating}
>
	{@render children()}
</div>
