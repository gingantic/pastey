<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import CodeEditor from '$lib/components/pastey/CodeEditor.svelte';
	import Dropdown from '$lib/components/pastey/Dropdown.svelte';
	import { auth } from '$lib/authStore.svelte';
	import { Globe, Link, Link2, Lock } from '@lucide/svelte';

	interface Props {
		onCreatePaste: (data: {
			title: string;
			content: string;
			lang: string;
			expiry: string;
			visibility: 'public' | 'unlisted' | 'private';
			custom_slug?: string;
		}) => void;
		toast: (msg: string) => void;
		editPaste?: any;
		isSubmitting?: boolean;
	}

	let {
		onCreatePaste,
		toast,
		editPaste,
		isSubmitting = false
	}: Props = $props();

	// ─── State ───────────────────────────────────────────────────────────────
	let pasteContent = $state('');
	let pasteTitle = $state('');
	let selectedLang = $state('plaintext');
	let selectedExpiry = $state('never');
	let selectedVisibility = $state<'public' | 'unlisted' | 'private'>('public');
	let customSlug = $state('');

	let langDropdownOpen = $state(false);
	let expiryDropdownOpen = $state(false);
	let visibilityDropdownOpen = $state(false);

	// Live validation for the slug input
	const slugError = $derived(() => {
		if (!customSlug.trim()) return null;
		if (!/^[a-zA-Z0-9_-]{3,50}$/.test(customSlug.trim())) {
			return '3-50 chars, letters/numbers/hyphens/underscores only';
		}
		const reserved = new Set(['api','login','signup','logout','admin','raw','u','status','auth','users','pastes','ui-kit']);
		if (reserved.has(customSlug.trim().toLowerCase())) {
			return `"${customSlug.trim()}" is reserved`;
		}
		return null;
	});

	const slugPreviewUrl = $derived(() => {
		if (typeof window === 'undefined') return '';
		const origin = window.location.origin;
		const slug = customSlug.trim();
		return slug ? `${origin}/${slug}` : '';
	});

	const languages = [
		'plaintext',
		'go',
		'typescript',
		'javascript',
		'python',
		'rust',
		'svelte',
		'html',
		'css',
		'sql',
		'yaml',
		'json',
		'bash',
		'nginx',
		'dockerfile'
	];

	const expiryOptions = [
		{ value: 'never', label: 'Never' },
		{ value: '10m', label: '10 minutes' },
		{ value: '1h', label: '1 hour' },
		{ value: '1d', label: '1 day' },
		{ value: '1w', label: '1 week' }
	];

	const visibilityOptions = [
		{ value: 'public', label: 'Public', icon: Globe },
		{ value: 'unlisted', label: 'Unlisted', icon: Link },
		{ value: 'private', label: 'Private', icon: Lock }
	];

	function handleCreate() {
		if (!pasteContent.trim()) {
			toast('Paste content cannot be empty.');
			return;
		}
		if (customSlug.trim() && slugError()) {
			toast('Please fix the custom URL before saving.');
			return;
		}
		onCreatePaste({
			title: pasteTitle || 'untitled paste',
			content: pasteContent,
			lang: selectedLang,
			expiry: selectedExpiry,
			visibility: selectedVisibility,
			...(customSlug.trim() ? { custom_slug: customSlug.trim() } : {})
		});
	}

	function handleClear() {
		pasteContent = '';
		pasteTitle = '';
		customSlug = '';
	}

	$effect(() => {
		if (editPaste) {
			pasteContent = editPaste.content;
			pasteTitle = editPaste.title;
			selectedLang = editPaste.lang;
			selectedExpiry = editPaste.expiry;
			selectedVisibility = editPaste.visibility;
			customSlug = ''; // don't pre-fill slug on edit — ID is immutable
		}
	});
</script>

<div class="animate-fade-in space-y-8">
	<!-- Editor + Sidebar layout -->
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

		<!-- Left: Editor Panel -->
		<div class="flex flex-col gap-4">

			<!-- Title input -->
			<div class="bg-brand-surface border border-border-dim rounded-3xl p-5">
				<label for="pastey-title" class="font-mono text-[10px] text-text-muted uppercase tracking-widest block mb-3">
					// Paste Title
				</label>
				<input
					id="pastey-title"
					type="text"
					bind:value={pasteTitle}
					placeholder="untitled paste..."
					disabled={isSubmitting}
					class="w-full bg-brand-bg border border-border-dim text-text-primary placeholder:text-text-muted rounded-xl px-4 py-3 text-sm font-mono transition-all duration-300 outline-none focus:border-white focus:ring-1 focus:ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
				/>
			</div>

			<!-- Code editor component area -->
			<div class="bg-brand-surface border border-border-dim rounded-3xl overflow-hidden">
				<!-- Editor Topbar -->
				<div class="flex items-center justify-between px-5 py-3 border-b border-border-dim bg-brand-bg/40">
					<div class="flex items-center gap-2">
						<!-- Traffic light dots -->
						<span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
						<span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
						<span class="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
					</div>
					<div class="font-mono text-[10px] text-text-muted flex items-center gap-2">
						<span>{selectedLang}</span>
						<span class="text-border-light">·</span>
						<span>{pasteContent.split('\n').length} lines</span>
						<span class="text-border-light">·</span>
						<span>{pasteContent.length} chars</span>
					</div>
					<button
						id="pastey-clear-btn"
						class="font-mono text-[10px] text-text-muted hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
						disabled={isSubmitting}
						onclick={handleClear}
					>
						clear
					</button>
				</div>

				<!-- Live Highlighting CodeEditor component -->
				<CodeEditor bind:value={pasteContent} lang={selectedLang} disabled={isSubmitting} />
			</div>

			<!-- Create button row -->
			<div class="flex items-center justify-between gap-4">
				<div class="font-mono text-[10px] text-text-muted flex items-center gap-1.5">
					{#if selectedVisibility === 'public'}
						<Globe size={12} class="text-text-muted" />
						<span>Public - listed in list</span>
					{:else if selectedVisibility === 'unlisted'}
						<Link size={12} class="text-text-muted" />
						<span>Unlisted - hidden from list, link sharing only</span>
					{:else}
						<Lock size={12} class="text-text-muted" />
						<span>Private - only the owner can see</span>
					{/if}
				</div>
				<div class="flex gap-3">
					<Button
						id="pastey-cancel-btn"
						variant="secondary"
						onclick={handleClear}
						disabled={isSubmitting}
					>
						Clear
					</Button>
					<Button
						id="pastey-create-btn"
						variant="primary"
						onclick={handleCreate}
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							{editPaste ? 'Updating...' : 'Creating...'}
						{:else}
							{editPaste ? 'Update Paste →' : 'Create Paste →'}
						{/if}
					</Button>
				</div>
			</div>
		</div>

		<!-- Right: Settings Sidebar -->
		<div class="flex flex-col gap-4">

			<!-- Language selector Dropdown -->
			<Dropdown
				label="// Language"
				options={languages}
				bind:value={selectedLang}
				bind:open={langDropdownOpen}
				disabled={isSubmitting}
				onSelect={() => {
					expiryDropdownOpen = false;
					visibilityDropdownOpen = false;
				}}
			/>

			<!-- Expiry selector Dropdown -->
			<Dropdown
				label="// Expiry"
				options={expiryOptions}
				bind:value={selectedExpiry}
				bind:open={expiryDropdownOpen}
				disabled={isSubmitting}
				onSelect={() => {
					langDropdownOpen = false;
					visibilityDropdownOpen = false;
				}}
			/>

			<!-- Visibility selector Dropdown -->
			<Dropdown
				label="// Visibility"
				options={visibilityOptions}
				bind:value={selectedVisibility}
				bind:open={visibilityDropdownOpen}
				disabled={isSubmitting}
				onSelect={() => {
					langDropdownOpen = false;
					expiryDropdownOpen = false;
				}}
			/>

			<!-- Custom URL (logged-in users only, not shown when editing) -->
			{#if auth.currentUser && !editPaste}
				<div class="bg-brand-surface border border-border-dim rounded-3xl p-5 space-y-3">
					<div class="flex items-center gap-2 font-mono text-[10px] text-text-muted uppercase tracking-widest">
						<Link2 size={11} />
						<span>// Custom URL <span class="text-text-muted/50 normal-case tracking-normal ml-1">(optional)</span></span>
					</div>
					<div class="relative">
						<input
							id="pastey-custom-slug"
							type="text"
							bind:value={customSlug}
							placeholder="my-snippet"
							maxlength="50"
							disabled={isSubmitting}
							class="w-full bg-brand-bg border text-text-primary placeholder:text-text-muted rounded-xl px-4 py-3 text-sm font-mono transition-all duration-300 outline-none focus:ring-1 focus:ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed
								{customSlug.trim() && slugError()
									? 'border-red-500/50 focus:border-red-500'
									: customSlug.trim() && !slugError()
										? 'border-emerald-500/50 focus:border-emerald-400'
										: 'border-border-dim focus:border-white'}"
						/>
					</div>

					{#if customSlug.trim() && slugError()}
						<p class="text-[10px] font-mono text-red-400 flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
							{slugError()}
						</p>
					{:else if customSlug.trim() && !slugError()}
						<div class="space-y-1">
							<p class="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
								Looks good!
							</p>
							<p class="text-[10px] font-mono text-text-muted truncate" title={slugPreviewUrl()}>
								{slugPreviewUrl()}
							</p>
						</div>
					{:else}
						<p class="text-[10px] font-mono text-text-muted">
							Leave blank for a random short URL.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Quick info card -->
			<div
				class="bg-brand-surface border border-border-dim rounded-3xl p-5 space-y-3 font-mono text-[10px] text-text-muted"
			>
				<div class="text-text-secondary font-bold uppercase tracking-wider text-[10px] mb-2">
					// How it works
				</div>
				<div class="flex items-start gap-2">
					<span class="text-white mt-0.5">01.</span>
					<span>Paste or type your code in the editor.</span>
				</div>
				<div class="flex items-start gap-2">
					<span class="text-white mt-0.5">02.</span>
					<span>Choose language, expiry & visibility.</span>
				</div>
				<div class="flex items-start gap-2">
					<span class="text-white mt-0.5">03.</span>
					<span>Hit <em class="text-white not-italic">Create Paste</em> — get a shareable link instantly.</span>
				</div>
			</div>
		</div>
	</div>
</div>
