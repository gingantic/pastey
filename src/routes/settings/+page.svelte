<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		KeyRound,
		Plus,
		Trash2,
		Copy,
		Check,
		AlertTriangle,
		Loader2,
		Eye,
		EyeOff
	} from '@lucide/svelte';
	import { auth } from '$lib/authStore.svelte';

	interface ApiKeyItem {
		id: string;
		name: string;
		prefix: string;
		created_at: string;
		last_used_at: string | null;
	}

	// ─── State ────────────────────────────────────────────────────────────────
	let keys = $state<ApiKeyItem[]>([]);
	let isLoading = $state(true);
	let isCreating = $state(false);
	let newKeyName = $state('');

	// The freshly created raw key (shown exactly once)
	let createdKey = $state<string | null>(null);
	let createdKeyVisible = $state(false);
	let copied = $state(false);

	// ─── Toast Notifications ──────────────────────────────────────────────────
	let toastMsg = $state('');
	let showToast = $state(false);
	let toastType = $state<'success' | 'error'>('success');
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function triggerToast(msg: string, type: 'success' | 'error' = 'success') {
		toastMsg = msg;
		toastType = type;
		showToast = true;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	// ─── Data Loaders ─────────────────────────────────────────────────────────
	async function loadKeys() {
		isLoading = true;
		try {
			const res = await auth.fetchWithAuth('/api/keys');
			if (res.ok) {
				const data = await res.json();
				keys = data.keys || [];
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to load API keys', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		loadKeys();
	});

	// ─── Actions ──────────────────────────────────────────────────────────────
	async function handleCreateKey(e: SubmitEvent) {
		e.preventDefault();
		const name = newKeyName.trim();
		if (!name) {
			triggerToast('Key name is required', 'error');
			return;
		}

		isCreating = true;
		try {
			const res = await auth.fetchWithAuth('/api/keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			if (res.ok) {
				const data = await res.json();
				createdKey = data.key;
				createdKeyVisible = false;
				copied = false;
				newKeyName = '';
				triggerToast('API key created successfully!');
				loadKeys();
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to create API key', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		} finally {
			isCreating = false;
		}
	}

	async function handleRevokeKey(id: string, name: string) {
		if (!confirm(`Are you sure you want to revoke the API key "${name}"? Any application using it will stop working immediately.`)) {
			return;
		}
		try {
			const res = await auth.fetchWithAuth(`/api/keys/${id}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				triggerToast('API key revoked');
				loadKeys();
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to revoke API key', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		}
	}

	async function handleCopyKey() {
		if (!createdKey) return;
		try {
			await navigator.clipboard.writeText(createdKey);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			triggerToast('Failed to copy to clipboard', 'error');
		}
	}

	function formatDate(iso: string | null) {
		if (!iso) return 'Never';
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Settings — Pastey</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none"
	></div>

	<Header subtitle="Settings" tag="// account" />

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 mt-10 pb-24 min-w-0">

			<!-- Page Header -->
			<div class="mb-8 border-b border-border-dim pb-6">
				<h2 class="text-xl font-bold font-mono tracking-tight text-white mb-1.5 flex items-center gap-2">
					<KeyRound class="text-cyan-400" size={18} /> // API Keys
				</h2>
				<p class="text-xs text-text-muted font-mono leading-relaxed">
					Create private keys to access the REST API without a browser session.
					Send them via the <span class="text-text-secondary">Authorization: Bearer pk_...</span> or
					<span class="text-text-secondary">X-API-Key</span> header.
				</p>
			</div>

			<!-- Newly Created Key Banner (shown once) -->
			{#if createdKey}
				<div class="mb-8 bg-brand-surface/60 border border-amber-500/30 rounded-xl p-5 shadow-glass">
					<div class="flex items-center gap-2 mb-3">
						<div class="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
							<AlertTriangle size={13} />
						</div>
						<span class="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
							Copy your key now — it will not be shown again
						</span>
					</div>
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
						<code
							class="flex-1 bg-brand-bg border border-border-dim rounded-lg px-4 py-2.5 font-mono text-xs text-text-primary overflow-x-auto whitespace-nowrap"
						>
							{createdKeyVisible ? createdKey : `${createdKey.slice(0, 10)}${'•'.repeat(20)}`}
						</code>
						<div class="flex gap-2">
							<button
								onclick={() => (createdKeyVisible = !createdKeyVisible)}
								class="px-3 py-2.5 rounded-lg border bg-brand-accent text-text-secondary border-border-dim hover:text-white transition-colors cursor-pointer"
								title={createdKeyVisible ? 'Hide key' : 'Show key'}
							>
								{#if createdKeyVisible}
									<EyeOff size={13} />
								{:else}
									<Eye size={13} />
								{/if}
							</button>
							<button
								onclick={handleCopyKey}
								class="flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-brand-accent font-mono text-[11px] transition-colors cursor-pointer {copied ? 'text-green-400 border-green-500/30' : 'text-text-secondary border-border-dim hover:text-white'}"
							>
								{#if copied}
									<Check size={13} /> Copied
								{:else}
									<Copy size={13} /> Copy
								{/if}
							</button>
							<button
								onclick={() => (createdKey = null)}
								class="px-4 py-2.5 rounded-lg border bg-brand-accent text-text-secondary border-border-dim hover:text-white font-mono text-[11px] transition-colors cursor-pointer"
							>
								Done
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Create Key Form -->
			<div class="mb-8 bg-brand-surface/60 border border-border-dim rounded-xl p-5 shadow-glass">
				<div class="text-[10px] text-text-muted font-mono uppercase tracking-wider mb-3">// Generate new key</div>
				<form onsubmit={handleCreateKey} class="flex flex-col sm:flex-row gap-2">
					<input
						type="text"
						bind:value={newKeyName}
						placeholder="Key name (e.g. my-script, ci-deploy)"
						maxlength="50"
						class="flex-1 bg-brand-bg border border-border-dim rounded-lg px-4 py-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-light transition-colors"
					/>
					<button
						type="submit"
						disabled={isCreating || !newKeyName.trim()}
						class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border bg-brand-accent text-text-secondary border-border-dim hover:text-white font-mono text-[11px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{#if isCreating}
							<Loader2 size={13} class="animate-spin" /> Creating...
						{:else}
							<Plus size={13} /> Create Key
						{/if}
					</button>
				</form>
			</div>

			<!-- Keys Table -->
			<div class="bg-brand-surface/60 border border-border-dim rounded-xl shadow-glass overflow-hidden">
				<div class="px-5 py-3.5 border-b border-border-dim flex items-center justify-between">
					<span class="text-[10px] text-text-muted font-mono uppercase tracking-wider">// Your keys</span>
					<span class="text-[10px] text-text-muted font-mono">{keys.length} / 10</span>
				</div>

				{#if isLoading}
					<div class="flex items-center justify-center gap-2 py-12 text-text-muted font-mono text-xs">
						<Loader2 size={14} class="animate-spin" /> Loading keys...
					</div>
				{:else if keys.length === 0}
					<div class="py-12 text-center text-text-muted font-mono text-xs">
						No API keys yet. Create one above to get started.
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full font-mono text-xs">
							<thead>
								<tr class="border-b border-border-dim text-[9px] text-text-muted uppercase tracking-wider">
									<th class="text-left px-5 py-3 font-medium">Name</th>
									<th class="text-left px-5 py-3 font-medium">Key</th>
									<th class="text-left px-5 py-3 font-medium hidden md:table-cell">Created</th>
									<th class="text-left px-5 py-3 font-medium hidden md:table-cell">Last Used</th>
									<th class="text-right px-5 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each keys as key (key.id)}
									<tr class="border-b border-border-dim/50 last:border-b-0 hover:bg-white/[0.02] transition-colors">
										<td class="px-5 py-3.5 text-text-primary font-medium">{key.name}</td>
										<td class="px-5 py-3.5 text-text-muted">{key.prefix}••••••••</td>
										<td class="px-5 py-3.5 text-text-muted hidden md:table-cell">{formatDate(key.created_at)}</td>
										<td class="px-5 py-3.5 text-text-muted hidden md:table-cell">{formatDate(key.last_used_at)}</td>
										<td class="px-5 py-3.5 text-right">
											<button
												onclick={() => handleRevokeKey(key.id, key.name)}
												class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-dim text-red-400 hover:text-red-300 hover:border-red-500/30 transition-colors cursor-pointer text-[10px]"
												title="Revoke key"
											>
												<Trash2 size={11} /> Revoke
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Usage hint -->
			<div class="mt-6 text-[10px] text-text-muted font-mono leading-relaxed">
				<span class="text-text-secondary">$</span> curl -H "Authorization: Bearer pk_..." {typeof window !== 'undefined' ? window.location.origin : ''}/api/users/me
			</div>
		</main>

		<!-- Right Gutter -->
		<div class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>
	</div>

	<Footer />

	<!-- Toast Notifications -->
	{#if showToast}
		<div
			class="fixed bottom-6 right-6 bg-brand-surface border border-border-light text-white font-mono text-[11px] px-5 py-3.5 rounded-xl shadow-glass flex items-center gap-3 animate-fade-in z-50"
		>
			{#if toastType === 'success'}
				<div class="p-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
					<Check size={13} />
				</div>
			{:else}
				<div class="p-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
					<AlertTriangle size={13} />
				</div>
			{/if}
			<span>{toastMsg}</span>
		</div>
	{/if}
</div>
