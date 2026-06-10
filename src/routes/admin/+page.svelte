<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { 
		Shield, 
		Users, 
		FileText, 
		Search, 
		UserMinus, 
		UserCheck, 
		Trash2, 
		ExternalLink, 
		ChevronLeft, 
		ChevronRight, 
		Check,
		AlertTriangle
	} from '@lucide/svelte';

	// ─── Tabs & Loading ───────────────────────────────────────────────────────
	let activeTab = $state<'users' | 'pastes'>('users');
	let isLoading = $state(false);

	// ─── User Management State ────────────────────────────────────────────────
	let userSearch = $state('');
	let userPage = $state(1);
	let userLimit = 10;
	let totalUsers = $state(0);
	let usersList = $state<any[]>([]);

	// ─── Paste Management State ───────────────────────────────────────────────
	let pasteSearch = $state('');
	let pastePage = $state(1);
	let pasteLimit = 10;
	let totalPastes = $state(0);
	let pastesList = $state<any[]>([]);

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
	async function loadUsers() {
		isLoading = true;
		try {
			const offset = (userPage - 1) * userLimit;
			const res = await fetch(`/api/admin/users?limit=${userLimit}&offset=${offset}&search=${encodeURIComponent(userSearch)}`);
			if (res.ok) {
				const data = await res.json();
				usersList = data.users || [];
				totalUsers = data.total || 0;
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to load users', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		} finally {
			isLoading = false;
		}
	}

	async function loadPastes() {
		isLoading = true;
		try {
			const offset = (pastePage - 1) * pasteLimit;
			const res = await fetch(`/api/admin/pastes?limit=${pasteLimit}&offset=${offset}&search=${encodeURIComponent(pasteSearch)}`);
			if (res.ok) {
				const data = await res.json();
				pastesList = data.pastes || [];
				totalPastes = data.total || 0;
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to load pastes', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Load users and pastes initially and reactive page triggers
	$effect(() => {
		if (activeTab === 'users') {
			loadUsers();
		} else {
			loadPastes();
		}
	});

	// Trigger reload on page changes
	$effect(() => {
		const _ = userPage;
		if (activeTab === 'users') {
			loadUsers();
		}
	});

	$effect(() => {
		const _ = pastePage;
		if (activeTab === 'pastes') {
			loadPastes();
		}
	});

	// ─── Admin Controller Actions ─────────────────────────────────────────────
	async function handleToggleAdmin(userId: string) {
		try {
			const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
				method: 'POST'
			});
			if (res.ok) {
				triggerToast('Admin status updated successfully!');
				loadUsers();
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to update admin status', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		}
	}

	async function handleDeleteUser(userId: string, username: string) {
		if (!confirm(`Are you sure you want to permanently delete user "${username}" and all of their associated pastes? This action cannot be undone.`)) {
			return;
		}
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				triggerToast('User and associated pastes deleted successfully!');
				if (usersList.length === 1 && userPage > 1) {
					userPage--;
				} else {
					loadUsers();
				}
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to delete user', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		}
	}

	async function handleDeletePaste(pasteId: string) {
		if (!confirm(`Are you sure you want to permanently delete paste "${pasteId}"? This action cannot be undone.`)) {
			return;
		}
		try {
			const res = await fetch(`/api/pastes/${pasteId}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				triggerToast('Paste deleted successfully!');
				if (pastesList.length === 1 && pastePage > 1) {
					pastePage--;
				} else {
					loadPastes();
				}
			} else {
				const err = await res.json().catch(() => ({}));
				triggerToast(err.error || 'Failed to delete paste', 'error');
			}
		} catch (e: any) {
			triggerToast(e.message || 'Connection error', 'error');
		}
	}

	function handleUserSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		userPage = 1;
		loadUsers();
	}

	function handlePasteSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		pastePage = 1;
		loadPastes();
	}
</script>

<svelte:head>
	<title>Admin Panel — Pastey</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none"
	></div>

	<Header subtitle="Admin" tag="// dashboard" />

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 mt-10 pb-24 min-w-0">
			
			<!-- Dashboard Header & Stats -->
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border-dim pb-6">
				<div>
					<h2 class="text-xl font-bold font-mono tracking-tight text-white mb-1.5 flex items-center gap-2">
						<Shield class="text-amber-400" size={18} /> // Admin Control Panel
					</h2>
					<p class="text-xs text-text-muted font-mono leading-relaxed">
						Manage registered users, control access permissions, and audit code snippets.
					</p>
				</div>
				
				<!-- Compact Stats Row -->
				<div class="flex gap-4">
					<div class="flex items-center gap-3 bg-brand-surface/60 border border-border-dim rounded-xl px-4 py-2.5 shadow-glass">
						<div class="p-1.5 bg-white/5 border border-border-dim rounded-lg text-text-secondary">
							<Users size={12} />
						</div>
						<div>
							<div class="text-[9px] text-text-muted font-mono uppercase tracking-wider">Users</div>
							<div class="text-base font-bold text-white font-mono leading-none mt-0.5">{totalUsers}</div>
						</div>
					</div>
					
					<div class="flex items-center gap-3 bg-brand-surface/60 border border-border-dim rounded-xl px-4 py-2.5 shadow-glass">
						<div class="p-1.5 bg-white/5 border border-border-dim rounded-lg text-text-secondary">
							<FileText size={12} />
						</div>
						<div>
							<div class="text-[9px] text-text-muted font-mono uppercase tracking-wider">Pastes</div>
							<div class="text-base font-bold text-white font-mono leading-none mt-0.5">{totalPastes}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Segmented Pill Tabs & Metadata Row -->
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
				<div class="inline-flex bg-brand-surface/60 border border-border-dim rounded-xl p-1">
					<button 
						class="px-4 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 {activeTab === 'users' ? 'bg-brand-accent text-white border border-border-light shadow-sm' : 'text-text-muted hover:text-white border border-transparent'}"
						onclick={() => { activeTab = 'users'; userPage = 1; }}
					>
						<Users size={12} class="opacity-70" /> Users List
					</button>
					<button 
						class="px-4 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 {activeTab === 'pastes' ? 'bg-brand-accent text-white border border-border-light shadow-sm' : 'text-text-muted hover:text-white border border-transparent'}"
						onclick={() => { activeTab = 'pastes'; pastePage = 1; }}
					>
						<FileText size={12} class="opacity-70" /> Pastes List
					</button>
				</div>
				
				{#if activeTab === 'users'}
					<div class="text-[9px] font-mono text-text-muted uppercase tracking-wider">
						// SHOWING {usersList.length} OF {totalUsers} USERS
					</div>
				{:else}
					<div class="text-[9px] font-mono text-text-muted uppercase tracking-wider">
						// SHOWING {pastesList.length} OF {totalPastes} PASTES
					</div>
				{/if}
			</div>

			<!-- Active Tab Content -->
			{#if activeTab === 'users'}
				<!-- Users Controls -->
				<div class="mb-6">
					<form onsubmit={handleUserSearchSubmit} class="w-full sm:max-w-md relative">
						<button type="submit" class="absolute left-3.5 top-2.5 text-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center">
							<Search size={14} />
						</button>
						<input 
							type="text" 
							placeholder="Search username or email..."
							class="w-full bg-brand-surface/80 border border-border-dim rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-border-light font-mono transition-all duration-200 focus:ring-1 focus:ring-white/10"
							bind:value={userSearch}
						/>
					</form>
				</div>

				<!-- Users Table -->
				<div class="bg-brand-surface/40 backdrop-blur-xl border border-border-dim rounded-[1.5rem] overflow-hidden shadow-glass relative">
					{#if isLoading}
						<div class="absolute inset-0 bg-brand-bg/60 backdrop-blur-md flex items-center justify-center z-10 font-mono text-xs text-text-muted">
							// Refreshing database records...
						</div>
					{/if}
					<div class="overflow-x-auto">
						<table class="w-full text-left font-mono text-xs">
							<thead>
								<tr class="border-b border-border-dim bg-brand-accent/20 text-text-muted uppercase text-[10px] tracking-wider">
									<th class="py-4 px-6">// Username</th>
									<th class="py-4 px-6">// Email</th>
									<th class="py-4 px-6">// Privilege</th>
									<th class="py-4 px-6">// Pastes</th>
									<th class="py-4 px-6">// Registered</th>
									<th class="py-4 px-6 text-right">// Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border-dim">
								{#each usersList as user (user.id)}
									<tr class="hover:bg-white/[0.01] transition-all duration-150">
										<td class="py-4 px-6">
											<div class="flex items-center gap-3">
												<div class="w-8 h-8 rounded-xl bg-white/5 border border-border-dim flex items-center justify-center text-[10px] font-bold text-text-secondary">
													{user.username.slice(0, 2).toUpperCase()}
												</div>
												<span class="font-bold text-white">{user.username}</span>
											</div>
										</td>
										<td class="py-4 px-6 text-text-secondary">{user.email}</td>
										<td class="py-4 px-6">
											{#if user.is_admin}
												<span class="px-3 py-1 bg-amber-400/5 text-amber-300 border border-amber-400/20 rounded-full text-[9px] font-bold tracking-wider uppercase">ADMIN</span>
											{:else}
												<span class="px-3 py-1 bg-white/[0.02] text-text-muted border border-border-dim rounded-full text-[9px] uppercase">USER</span>
											{/if}
										</td>
										<td class="py-4 px-6 text-text-secondary font-bold">{user.paste_count}</td>
										<td class="py-4 px-6 text-text-muted">{new Date(user.created_at).toLocaleDateString()}</td>
										<td class="py-4 px-6 text-right">
											<div class="flex justify-end gap-2.5 items-center">
												<button 
													onclick={() => handleToggleAdmin(user.id)}
													class="p-2 rounded-xl border border-border-dim bg-brand-accent text-text-secondary hover:text-white transition-all duration-200 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/30 cursor-pointer"
													title={user.is_admin ? "Demote to User" : "Promote to Admin"}
												>
													{#if user.is_admin}
														<UserMinus size={14} />
													{:else}
														<UserCheck size={14} />
													{/if}
												</button>
												<button 
													onclick={() => handleDeleteUser(user.id, user.username)}
													class="p-2 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer"
													title="Delete User and Pastes"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</td>
									</tr>
								{/each}
								{#if usersList.length === 0}
									<tr>
										<td colspan="6" class="py-14 px-6 text-center text-text-muted font-mono leading-relaxed">
											No database records match current search filters.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>

					<!-- Pagination -->
					{#if totalUsers > userLimit}
						<div class="p-4 border-t border-border-dim bg-brand-accent/5 flex justify-between items-center font-mono text-xs text-text-secondary">
							<button 
								disabled={userPage === 1}
								onclick={() => { userPage--; }}
								class="p-2 rounded-xl border border-border-dim bg-brand-surface disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors cursor-pointer"
							>
								<ChevronLeft size={14} />
							</button>
							<span class="text-text-muted">PAGE {userPage} OF {Math.ceil(totalUsers / userLimit)}</span>
							<button 
								disabled={userPage >= Math.ceil(totalUsers / userLimit)}
								onclick={() => { userPage++; }}
								class="p-2 rounded-xl border border-border-dim bg-brand-surface disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors cursor-pointer"
							>
								<ChevronRight size={14} />
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Pastes Controls -->
				<div class="mb-6">
					<form onsubmit={handlePasteSearchSubmit} class="w-full sm:max-w-md relative">
						<button type="submit" class="absolute left-3.5 top-2.5 text-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center">
							<Search size={14} />
						</button>
						<input 
							type="text" 
							placeholder="Search title, content, or author..."
							class="w-full bg-brand-surface/80 border border-border-dim rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-text-muted focus:outline-none focus:border-border-light font-mono transition-all duration-200 focus:ring-1 focus:ring-white/10"
							bind:value={pasteSearch}
						/>
					</form>
				</div>

				<!-- Pastes Table -->
				<div class="bg-brand-surface/40 backdrop-blur-xl border border-border-dim rounded-[1.5rem] overflow-hidden shadow-glass relative">
					{#if isLoading}
						<div class="absolute inset-0 bg-brand-bg/60 backdrop-blur-md flex items-center justify-center z-10 font-mono text-xs text-text-muted">
							// Refreshing database records...
						</div>
					{/if}
					<div class="overflow-x-auto">
						<table class="w-full text-left font-mono text-xs">
							<thead>
								<tr class="border-b border-border-dim bg-brand-accent/20 text-text-muted uppercase text-[10px] tracking-wider">
									<th class="py-4 px-6">// ID</th>
									<th class="py-4 px-6">// Title</th>
									<th class="py-4 px-6">// Author</th>
									<th class="py-4 px-6">// Visibility</th>
									<th class="py-4 px-6">// Views</th>
									<th class="py-4 px-6">// Created</th>
									<th class="py-4 px-6 text-right">// Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border-dim">
								{#each pastesList as paste (paste.id)}
									<tr class="hover:bg-white/[0.01] transition-all duration-150">
										<td class="py-4 px-6 font-bold text-white">{paste.id}</td>
										<td class="py-4 px-6 truncate max-w-[180px] text-white font-medium" title={paste.title}>{paste.title}</td>
										<td class="py-4 px-6 text-text-secondary">{paste.author_name}</td>
										<td class="py-4 px-6">
											{#if paste.visibility === 'public'}
												<span class="px-3 py-1 bg-green-500/5 text-green-400 border border-green-500/20 rounded-full text-[9px] font-bold tracking-wider uppercase">PUBLIC</span>
											{:else if paste.visibility === 'unlisted'}
												<span class="px-3 py-1 bg-blue-500/5 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-bold tracking-wider uppercase">UNLISTED</span>
											{:else}
												<span class="px-3 py-1 bg-red-500/5 text-red-400 border border-red-500/20 rounded-full text-[9px] font-bold tracking-wider uppercase">PRIVATE</span>
											{/if}
										</td>
										<td class="py-4 px-6 text-text-secondary font-semibold">{paste.views}</td>
										<td class="py-4 px-6 text-text-muted">{new Date(paste.created_at).toLocaleDateString()}</td>
										<td class="py-4 px-6 text-right">
											<div class="flex justify-end gap-2.5 items-center">
												<a 
													href="/{paste.id}"
													target="_blank"
													class="p-2 rounded-xl border border-border-dim bg-brand-accent text-text-secondary hover:text-white transition-all duration-200 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30 cursor-pointer flex items-center justify-center animate-fade-in"
													title="View Paste"
												>
													<ExternalLink size={14} />
												</a>
												<button 
													onclick={() => handleDeletePaste(paste.id)}
													class="p-2 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer"
													title="Delete Paste"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</td>
									</tr>
								{/each}
								{#if pastesList.length === 0}
									<tr>
										<td colspan="7" class="py-14 px-6 text-center text-text-muted font-mono leading-relaxed">
											No stored code snippets match search filters.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>

					<!-- Pagination -->
					{#if totalPastes > pasteLimit}
						<div class="p-4 border-t border-border-dim bg-brand-accent/5 flex justify-between items-center font-mono text-xs text-text-secondary">
							<button 
								disabled={pastePage === 1}
								onclick={() => { pastePage--; }}
								class="p-2 rounded-xl border border-border-dim bg-brand-surface disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors cursor-pointer"
							>
								<ChevronLeft size={14} />
							</button>
							<span class="text-text-muted">PAGE {pastePage} OF {Math.ceil(totalPastes / pasteLimit)}</span>
							<button 
								disabled={pastePage >= Math.ceil(totalPastes / pasteLimit)}
								onclick={() => { pastePage++; }}
								class="p-2 rounded-xl border border-border-dim bg-brand-surface disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition-colors cursor-pointer"
							>
								<ChevronRight size={14} />
							</button>
						</div>
					{/if}
				</div>
			{/if}
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
