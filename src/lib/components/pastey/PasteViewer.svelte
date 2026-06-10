<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import CodeViewer from '$lib/components/pastey/CodeViewer.svelte';
	import { Check, Copy, Globe, Link, Lock, FileText } from '@lucide/svelte';

	interface Paste {
		id: string;
		title: string;
		lang: string;
		author: string;
		date: string;
		views: number;
		visibility: 'public' | 'unlisted' | 'private';
		content: string;
		expires_at?: string | null;
	}

	interface Props {
		paste: Paste;
		onNewPaste: () => void;
		toast: (msg: string) => void;
	}

	let { paste, onNewPaste, toast }: Props = $props();

	let showCopied = $state(false);

	function copyLink() {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rhnx.my.id';
		navigator.clipboard.writeText(`${origin}/${paste.id}`);
		toast('Link copied to clipboard!');
	}

	function copyContent() {
		navigator.clipboard.writeText(paste.content);
		toast('Paste content copied!');
		showCopied = true;
		setTimeout(() => (showCopied = false), 2000);
	}
	let timeLeft = $state('');
	let interval: ReturnType<typeof setInterval> | null = null;

	function updateCountdown() {
		if (!paste.expires_at) {
			timeLeft = '';
			return;
		}

		const now = new Date().getTime();
		const expiry = new Date(paste.expires_at).getTime();
		const diff = expiry - now;

		if (diff <= 0) {
			timeLeft = 'expired';
			if (interval) clearInterval(interval);
			return;
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		const parts = [];
		if (days > 0) parts.push(`${days}d`);
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0) parts.push(`${minutes}m`);
		parts.push(`${seconds}s`);

		timeLeft = parts.join(' ');
	}

	$effect(() => {
		updateCountdown();
		interval = setInterval(updateCountdown, 1000);
		return () => {
			if (interval) clearInterval(interval);
		};
	});
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
				{#if timeLeft}
					<span class="text-border-light">·</span>
					<span class="text-red-400">expires in {timeLeft}</span>
				{/if}
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
			<a
				id="pastey-raw-btn"
				href="/raw/{paste.id}"
				target="_blank"
				class="inline-flex items-center gap-2 font-mono text-[10px] px-3 py-2 bg-brand-accent border border-border-dim rounded-lg text-text-secondary hover:text-white transition-colors"
			>
				<FileText size={12} />
				Raw
			</a>
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
