<script lang="ts">
	import PasteEditor from '$lib/components/pastey/PasteEditor.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Check } from '@lucide/svelte';
	import { getPastes, savePaste } from '$lib/pasteStore';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/authStore.svelte';

	// ─── State ───────────────────────────────────────────────────────────────
	let recentPastes = $state<any[]>([]);
	let showToast = $state(false);
	let toastMsg = $state('');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		recentPastes = getPastes()
			.filter((p) => {
				// Public pastes are visible to everyone
				if (p.visibility === 'public') return true;
				// Private pastes are visible only to their logged-in author
				if (p.visibility === 'private') {
					return auth.currentUser && p.author.toLowerCase() === auth.currentUser.username.toLowerCase();
				}
				// Unlisted pastes are hidden from recent pastes lists (accessible via link sharing only)
				return false;
			})
			.map((p) => ({
				id: p.id,
				title: p.title,
				lang: p.lang,
				lines: p.content ? p.content.split('\n').length : 0,
				date: p.date,
				private: p.visibility === 'private'
			}));
	});

	// ─── Helpers ─────────────────────────────────────────────────────────────
	function toast(msg: string) {
		toastMsg = msg;
		showToast = true;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => (showToast = false), 3000);
	}

	function handleCreatePaste(data: {
		title: string;
		content: string;
		lang: string;
		expiry: string;
		visibility: 'public' | 'unlisted' | 'private';
	}) {
		const newId = Math.random().toString(36).substring(2, 8);
		const formattedDate = new Date().toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}) + ' · ' + new Date().toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		const newPaste = {
			id: newId,
			title: data.title,
			content: data.content,
			lang: data.lang,
			expiry: data.expiry,
			visibility: data.visibility,
			author: auth.currentUser ? auth.currentUser.username : 'Anonymous',
			date: formattedDate,
			views: 0
		};

		savePaste(newPaste);
		toast('Paste created!');
		setTimeout(() => {
			goto(`/${newId}`);
		}, 500);
	}

	function handleSelectRecentPaste(paste: { id: string }) {
		goto(`/${paste.id}`);
	}
</script>

<svelte:head>
	<title>Pastey — Minimal Code Sharing · reihan.dev</title>
	<meta
		name="description"
		content="Pastey is a minimal, elegant code paste tool. Share code snippets instantly with syntax highlighting and expiry options."
	/>
	<link rel="canonical" href="https://reihan.dev/" />
	<meta name="robots" content="index, follow" />

	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://reihan.dev/" />
	<meta property="og:title" content="Pastey — Minimal Code Sharing" />
	<meta
		property="og:description"
		content="Minimal, elegant code paste tool built with the Rhnx. design system."
	/>

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://reihan.dev/" />
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
				{recentPastes}
				onCreatePaste={handleCreatePaste}
				onSelectRecentPaste={handleSelectRecentPaste}
				{toast}
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
