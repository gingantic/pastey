<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { auth } from '$lib/authStore.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { Check, Globe, Lock, Link, ArrowRight, User, Trash2, Pencil, Copy } from '@lucide/svelte';
	import { deletePaste } from '$lib/pasteStore';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ─── Types ───────────────────────────────────────────────────────────────
	interface Paste {
		id: string;
		title: string;
		content: string;
		lang: string;
		expiry: string;
		visibility: 'public' | 'unlisted' | 'private';
		author_name: string;
		views: number;
		created_at: string;
		expires_at: string | null;
	}

	// ─── State ───────────────────────────────────────────────────────────────
	let pastes = $state<Paste[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showToast = $state(false);
	let toastMsg = $state('');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	const isOwnProfile = $derived(
		auth.currentUser !== null &&
			auth.currentUser.username.toLowerCase() === data.username.toLowerCase()
	);

	$effect(() => {
		pastes = data.pastes ?? [];
		total = data.total ?? 0;
		error = data.error ?? null;
	});

	// ─── Helpers ─────────────────────────────────────────────────────────────
	function toast(msg: string) {
		toastMsg = msg;
		showToast = true;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => (showToast = false), 3000);
	}

	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		const options: Intl.DateTimeFormatOptions = {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		};
		const formatted = d.toLocaleString('en-US', options);
		return formatted
			.replace(' at ', ', ')
			.replace(' AM', ' a.m.')
			.replace(' PM', ' p.m.');
	}

	function formatExpiry(expiry: string) {
		switch (expiry) {
			case '10m': return '10 minutes';
			case '1h': return '1 hour';
			case '1d': return '1 day';
			case '1w': return '1 week';
			case '1mo': return '1 month';
			case 'never':
			default:
				return 'Never';
		}
	}

	function copyLink(pasteId: string) {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
		navigator.clipboard.writeText(`${origin}/${pasteId}`);
		toast('Link copied to clipboard!');
	}

	function handleEdit(pasteId: string) {
		goto(`/?edit=${pasteId}`);
	}

	async function handleDelete(pasteId: string) {
		if (!confirm('Are you sure you want to delete this paste?')) return;
		try {
			await deletePaste(pasteId);
			toast('Paste deleted successfully!');
			pastes = pastes.filter(p => p.id !== pasteId);
			total -= 1;
		} catch (e: any) {
			toast(e.message || 'Failed to delete paste.');
		}
	}
</script>

<svelte:head>
	<title>{data.username}'s Pastes — Pastey</title>
	<meta name="description" content="View all pastes by {data.username} on Pastey." />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none"
	></div>

	<Header />

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 mt-10 pb-24 min-w-0">
			<!-- Profile Header -->
			<div class="animate-fade-in mb-8">
				<div
					class="bg-brand-surface border border-border-dim rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
				>
					<div class="flex items-center gap-4">
						<div
							class="w-12 h-12 rounded-2xl bg-brand-accent border border-border-dim flex items-center justify-center shrink-0"
						>
							<User size={20} class="text-text-secondary" />
						</div>
						<div>
							<div class="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1">
								// user profile
							</div>
							<h1 class="text-xl font-bold font-mono text-white">{data.username}</h1>
							<p class="text-xs text-text-muted font-mono mt-0.5">
								{#if isOwnProfile}
									Showing all your pastes (public, unlisted & private)
								{:else}
									Showing public pastes
								{/if}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-3">
						{#if isOwnProfile}
							<span
								class="inline-flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400"
							>
								<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
								Your Profile
							</span>
						{/if}
						<span
							class="font-mono text-[10px] px-3 py-1.5 bg-brand-accent border border-border-dim rounded-lg text-text-muted"
						>
							{total} paste{total !== 1 ? 's' : ''}
						</span>
					</div>
				</div>
			</div>

			<!-- Paste List -->
			{#if loading}
				<div class="animate-fade-in flex flex-col gap-3">
					{#each { length: 5 } as _, i}
						<div class="bg-brand-surface border border-border-dim rounded-2xl p-4 animate-pulse">
							<div class="flex items-center gap-4">
								<div class="w-16 h-4 bg-brand-accent rounded"></div>
								<div class="flex-1 h-4 bg-brand-accent rounded max-w-xs"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if error}
				<div class="animate-fade-in text-center py-16 space-y-4">
					<div class="text-5xl">⚠️</div>
					<h2 class="text-lg font-mono font-bold text-white">Failed to load pastes</h2>
					<p class="text-xs text-text-muted font-mono">{error}</p>
					<button
						onclick={() => invalidateAll()}
						class="mt-4 inline-flex items-center gap-2 font-mono text-xs px-4 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-colors"
					>
						Try Again
					</button>
				</div>
			{:else if pastes.length === 0}
				<div class="animate-fade-in text-center py-16 space-y-4">
					<div class="text-5xl">📭</div>
					<h2 class="text-lg font-mono font-bold text-white">No pastes yet</h2>
					<p class="text-xs text-text-muted font-mono">
						{isOwnProfile
							? "You haven't created any pastes yet."
							: `${data.username} hasn't shared any public pastes yet.`}
					</p>
					{#if isOwnProfile}
						<a
							href="/"
							class="mt-4 inline-flex items-center gap-2 font-mono text-xs px-6 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors"
						>
							Create Your First Paste
						</a>
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto w-full bg-brand-surface border border-border-dim rounded-3xl">
					<table class="w-full border-collapse text-left font-mono text-xs">
						<thead>
							<tr class="border-b border-border-dim bg-brand-bg/40 text-text-muted select-none">
								<th class="px-6 py-4 font-bold tracking-wider">Title</th>
								<th class="px-6 py-4 font-bold tracking-wider">Created</th>
								<th class="px-6 py-4 font-bold tracking-wider">Expire</th>
								<th class="px-6 py-4 font-bold tracking-wider">Hits / Views</th>
								<th class="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each pastes as paste, i}
								<tr class="border-b border-border-dim last:border-0 hover:bg-brand-accent/30 transition-colors">
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											<span class="text-text-muted">
												{#if paste.visibility === 'public'}
													<Globe size={12} />
												{:else if paste.visibility === 'unlisted'}
													<Link size={12} />
												{:else}
													<Lock size={12} />
												{/if}
											</span>
											<a href="/{paste.id}" class="text-text-primary hover:text-white font-bold transition-colors truncate max-w-[150px] sm:max-w-[240px]">
												{paste.title}
											</a>
										</div>
									</td>
									<td class="px-6 py-4 text-text-muted">
										{formatDate(paste.created_at)}
									</td>
									<td class="px-6 py-4 text-text-muted capitalize">
										{formatExpiry(paste.expiry)}
									</td>
									<td class="px-6 py-4 text-text-muted">
										{paste.views}
									</td>
									<td class="px-6 py-4 text-right">
										<div class="flex items-center justify-end gap-2">
											<button
												onclick={() => copyLink(paste.id)}
												class="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-border-dim"
												title="Copy Link"
											>
												<Copy size={12} />
											</button>
											{#if isOwnProfile}
												<button
													onclick={() => handleEdit(paste.id)}
													class="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors border border-blue-500/20"
													title="Edit Paste"
												>
													<Pencil size={12} />
												</button>
												<button
													onclick={() => handleDelete(paste.id)}
													class="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors border border-red-500/20"
													title="Delete Paste"
												>
													<Trash2 size={12} />
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
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
