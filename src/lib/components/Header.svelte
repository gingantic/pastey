<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { auth } from '$lib/authStore.svelte';
	import { LogOut, Plus, ChevronDown, User, Shield } from '@lucide/svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		tag?: string;
		children?: Snippet;
	}

	let { title = 'Pastey.', subtitle = 'code sharing', tag = '// tool', children }: Props = $props();

	let dropdownOpen = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function handleLogout() {
		auth.logout();
		dropdownOpen = false;
		window.location.href = '/';
	}

	function handleOutsideClick(event: MouseEvent) {
		if (dropdownOpen) {
			const target = event.target as HTMLElement;
			if (!target.closest('#user-menu-button') && !target.closest('#user-menu-dropdown')) {
				dropdownOpen = false;
			}
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="w-full flex border-b border-border-dim relative z-30">
	<!-- Left Gutter -->
	<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

	<!-- Header Area -->
	<header
		class="w-full max-w-6xl px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
	>
		<!-- Brand -->
		<div class="flex items-center gap-4">
			<a href="/" class="flex items-center gap-2 group">
				<div>
					<div class="font-mono text-[10px] text-text-muted uppercase tracking-widest">
						{tag}
					</div>
					<h1 class="text-xl font-bold tracking-tight text-white" style="font-family: 'Inter', sans-serif;">
						{title} <span class="font-serif italic font-light text-text-secondary text-lg">{subtitle}</span>
					</h1>
				</div>
			</a>
		</div>

		<!-- Nav Actions -->
		<nav class="flex items-center gap-3 font-mono text-xs relative">
			{#if auth.currentUser}
				<div class="relative">
					<button
						id="user-menu-button"
						onclick={toggleDropdown}
						class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white cursor-pointer"
					>
						<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
						<span>{auth.currentUser.username}</span>
						<ChevronDown size={14} class="opacity-60" />
					</button>

					{#if dropdownOpen}
						<div
							id="user-menu-dropdown"
							transition:slide={{ duration: 200 }}
							class="absolute right-0 mt-2 w-48 bg-brand-surface border border-border-light rounded-xl shadow-glass overflow-hidden z-50 font-mono text-[11px]"
						>
							<div class="px-4 py-3 border-b border-border-dim text-[10px] text-text-muted">
								// logged in as<br/>
								<span class="text-text-primary font-bold truncate block">{auth.currentUser.email}</span>
							</div>
							<a
								href="/"
								class="flex items-center gap-2 px-4 py-3 hover:bg-brand-accent text-text-secondary hover:text-white transition-colors"
								onclick={() => dropdownOpen = false}
							>
								<Plus size={12} />
								Create Paste
							</a>
							<a
								href="/u/{auth.currentUser?.username}"
								class="flex items-center gap-2 px-4 py-3 hover:bg-brand-accent text-text-secondary hover:text-white transition-colors border-t border-border-dim"
								onclick={() => dropdownOpen = false}
							>
								<User size={12} />
								My Pastes
							</a>
							{#if auth.currentUser?.is_admin}
								<a
									href="/admin"
									class="flex items-center gap-2 px-4 py-3 hover:bg-brand-accent text-amber-400 hover:text-amber-300 transition-colors border-t border-border-dim"
									onclick={() => dropdownOpen = false}
								>
									<Shield size={12} />
									Admin Panel
								</a>
							{/if}
							<button
								onclick={handleLogout}
								class="w-full flex items-center gap-2 px-4 py-3 hover:bg-brand-accent text-red-400 hover:text-red-300 transition-colors border-t border-border-dim text-left cursor-pointer font-mono text-[11px]"
							>
								<LogOut size={12} />
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else if children}
				{@render children()}
			{:else}
				<a
					href="/"
					class="px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white"
				>
					New Paste
				</a>
				<a
					href="/login"
					class="px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white"
				>
					Login
				</a>
			{/if}
		</nav>
	</header>

	<!-- Right Gutter -->
	<div class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>
</div>

