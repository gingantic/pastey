<script lang="ts">
	import PasteEditor from '$lib/components/pastey/PasteEditor.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Check } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ─── State ───────────────────────────────────────────────────────────────
	let showToast = $state(false);
	let toastMsg = $state('');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;
	let isSubmitting = $state(false);

	// ─── Helpers ─────────────────────────────────────────────────────────────
	function toast(msg: string) {
		toastMsg = msg;
		showToast = true;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => (showToast = false), 3000);
	}

	let editId = $derived($page.url.searchParams.get('edit'));
	// Edit target is resolved server-side (owner-only) — no API round-trip needed
	let editPaste = $derived(data.editPaste);

	async function handleCreatePaste(pasteData: {
		title: string;
		content: string;
		lang: string;
		expiry: string;
		visibility: 'public' | 'unlisted' | 'private';
		custom_slug?: string;
	}) {
		isSubmitting = true;
		try {
			// Submit through SvelteKit form actions — server-side logic, no REST API
			const form = new FormData();
			form.set('title', pasteData.title);
			form.set('content', pasteData.content);
			form.set('lang', pasteData.lang);
			form.set('expiry', pasteData.expiry);
			form.set('visibility', pasteData.visibility);
			if (pasteData.custom_slug) form.set('custom_slug', pasteData.custom_slug);
			if (editId) form.set('id', editId);

			const response = await fetch(editId ? '?/update' : '?/create', {
				method: 'POST',
				body: form,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const result: ActionResult = deserialize(await response.text());

			if (result.type === 'success' && result.data?.paste) {
				toast(editId ? 'Paste updated!' : 'Paste created!');
				const target = result.data.paste.id;
				setTimeout(() => {
					goto(`/${target}`);
				}, 500);
			} else if (result.type === 'failure') {
				toast((result.data as any)?.error || 'Failed to save paste.');
				isSubmitting = false;
			} else {
				toast('Failed to save paste.');
				isSubmitting = false;
			}
		} catch (err: any) {
			toast(err.message || 'Failed to save paste.');
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Pastey — Minimal Code Sharing · rhnx.my.id</title>
	<meta
		name="description"
		content="Pastey is a minimal, elegant code paste tool. Share code snippets instantly with syntax highlighting and expiry options."
	/>
	<link rel="canonical" href="https://rhnx.my.id/" />
	<meta name="robots" content="index, follow" />

	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://rhnx.my.id/" />
	<meta property="og:title" content="Pastey — Minimal Code Sharing" />
	<meta
		property="og:description"
		content="Minimal, elegant code paste tool built with the Rhnx. design system."
	/>

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://rhnx.my.id/" />
	<meta name="twitter:title" content="Pastey — Minimal Code Sharing" />
	<meta
		name="twitter:description"
		content="Minimal, elegant code paste tool built with the Rhnx. design system."
	/>
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none"
	></div>

	<Header>
		<a
			href="/login"
			class="px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white"
		>
			Login
		</a>
	</Header>

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 mt-10 pb-24 min-w-0">
			<PasteEditor
				onCreatePaste={handleCreatePaste}
				{toast}
				{editPaste}
				{isSubmitting}
			/>
		</main>

		<!-- Right Gutter -->
		<div class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>
	</div>

	<Footer />

	<!-- ── TOAST ───────────────────────────────────────────────────────────── -->
	{#if showToast}
		<div
			class="fixed bottom-6 right-6 bg-white text-black font-mono text-xs font-bold px-6 py-4 rounded-xl shadow-glass flex items-center gap-3 border border-white/20 animate-fade-in z-50"
		>
			<Check size={14} />
			<span>{toastMsg}</span>
		</div>
	{/if}
</div>
