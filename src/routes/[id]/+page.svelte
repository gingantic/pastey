<script lang="ts">
	import { getPasteById } from '$lib/pasteStore';
	import PasteViewer from '$lib/components/pastey/PasteViewer.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { Check } from '@lucide/svelte';

	let { data } = $props();
	let paste = $derived(getPasteById(data.id));

	// Toast state
	let showToast = $state(false);
	let toastMsg = $state('');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function toast(msg: string) {
		toastMsg = msg;
		showToast = true;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => (showToast = false), 3000);
	}
</script>

<svelte:head>
	{#if paste}
		<title>{paste.title} — Pastey</title>
		<meta name="description" content="View paste on Pastey." />
	{:else}
		<title>Paste Not Found — Pastey</title>
	{/if}
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
			href="/"
			class="px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white"
		>
			New Paste
		</a>
	</Header>

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 mt-10 pb-24 min-w-0 flex flex-col justify-center">
			{#if paste}
				<PasteViewer
					{paste}
					onNewPaste={() => (window.location.href = '/')}
					{toast}
				/>
			{:else}
				<div class="max-w-md mx-auto text-center py-16 space-y-6 animate-fade-in">
					<div class="text-6xl">🔍</div>
					<h2 class="text-2xl font-mono font-bold text-white">Paste Not Found</h2>
					<p class="text-xs text-text-muted leading-relaxed font-mono">
						The paste with ID <span class="text-white">"{data.id}"</span> does not exist or has expired.
					</p>
					<div class="pt-4">
						<a
							href="/"
							class="inline-flex items-center justify-center bg-white text-black font-mono text-xs font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
						>
							Create New Paste
						</a>
					</div>
				</div>
			{/if}
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
