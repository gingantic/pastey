<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import CodeViewer from '$lib/components/pastey/CodeViewer.svelte';
	import { Check, Copy, Globe, Link, Lock } from '@lucide/svelte';

	interface Paste {
		id: string;
		title: string;
		lang: string;
		author: string;
		date: string;
		views: number;
		visibility: 'public' | 'unlisted' | 'private';
		content: string;
	}

	interface Props {
		paste: Paste;
		onNewPaste: () => void;
		toast: (msg: string) => void;
	}

	let { paste, onNewPaste, toast }: Props = $props();

	let showCopied = $state(false);

	function copyLink() {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reihan.dev';
		navigator.clipboard.writeText(`${origin}/${paste.id}`);
		toast('Link copied to clipboard!');
	}

	function copyContent() {
		navigator.clipboard.writeText(paste.content);
		toast('Paste content copied!');
		showCopied = true;
		setTimeout(() => (showCopied = false), 2000);
	}
</script>

<div class="animate-fade-in space-y-6">
	<!-- Paste Header Info -->
	<div
		class="bg-brand-surface border border-border-dim rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
	>
		<div class="space-y-2">
			<div class="font-mono text-[10px] text-text-muted uppercase tracking-widest">
				// {paste.id}
			</div>
			<h2 class="text-2xl font-bold text-white font-mono">{paste.title}</h2>
			<div class="flex flex-wrap items-center gap-4 font-mono text-[10px] text-text-muted">
				<span>by <span class="text-text-secondary">{paste.author}</span></span>
				<span class="text-border-light">·</span>
				<span>{paste.date}</span>
				<span class="text-border-light">·</span>
				<span>{paste.views} views</span>
				<span class="text-border-light">·</span>
				<span class="flex items-center gap-1 text-text-secondary">
					{#if paste.visibility === 'public'}
						<Globe size={11} />
						<span>Public</span>
					{:else if paste.visibility === 'unlisted'}
						<Link size={11} />
						<span>Unlisted</span>
					{:else}
						<Lock size={11} />
						<span>Private</span>
					{/if}
				</span>
			</div>
		</div>

		<div class="flex flex-wrap gap-3">
			<Badge variant="skill">{paste.lang}</Badge>
			<button
				id="pastey-copy-link-btn"
				class="inline-flex items-center gap-2 font-mono text-[10px] px-3 py-2 bg-brand-accent border border-border-dim rounded-lg text-text-secondary hover:text-white transition-colors"
				onclick={copyLink}
			>
				<Link size={12} />
				Copy Link
			</button>
			<button
				id="pastey-copy-content-btn"
				class="inline-flex items-center gap-2 font-mono text-[10px] px-3 py-2 border border-border-dim rounded-lg transition-all duration-300
					{showCopied
						? 'bg-white text-black border-white'
						: 'bg-brand-accent text-text-secondary hover:text-white'}"
				onclick={copyContent}
			>
				{#if showCopied}
					<Check size={12} />
					Copied!
				{:else}
					<Copy size={12} />
					Copy Code
				{/if}
			</button>
			<button
				id="pastey-new-btn"
				class="inline-flex items-center gap-2 font-mono text-[10px] px-3 py-2 bg-white text-black border border-white rounded-lg hover:bg-white/90 transition-colors"
				onclick={onNewPaste}
			>
				New Paste
			</button>
		</div>
	</div>

	<!-- Code Viewer Component -->
	<CodeViewer content={paste.content} lang={paste.lang} title={paste.title} />
</div>
