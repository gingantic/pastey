<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { auth } from '$lib/authStore.svelte';
	import { navigating } from '$app/stores';
	import LoadingBar from '$lib/components/LoadingBar.svelte';

	let { data, children } = $props();

	$effect(() => {
		const wasLoggedIn = auth.initialized && auth.currentUser !== null;
		auth.setUser(data.user);

		// If SSR detected the session is gone (both tokens expired/invalid),
		// data.user will be null. If the user was previously logged in,
		// redirect to /login with the current path so they can come back.
		if (wasLoggedIn && data.user === null && typeof window !== 'undefined') {
			auth.redirectToLogin();
		}
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
