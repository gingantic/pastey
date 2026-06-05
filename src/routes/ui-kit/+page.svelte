<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	// State for forms showcase
	let username = $state('');
	let email = $state('');
	let message = $state('');
	let formError = $state('');
	let hasError = $state(false);
	let buttonsDisabled = $state(false);

	// Toast state for clipboard copies
	let toastMessage = $state('');
	let showToast = $state(false);
	let toastTimeout: any = null;

	function copyToClipboard(text: string, label: string) {
		navigator.clipboard.writeText(text);
		toastMessage = `Copied ${label}: ${text}`;
		showToast = true;
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	$effect(() => {
		if (hasError) {
			formError = 'Invalid email or message field cannot be empty.';
		} else {
			formError = '';
		}
	});

	// Active tab
	let activeTab = $state('tokens');
</script>

<svelte:head>
	<title>Pastey UI Kit | Design System Showcase</title>
	<meta name="description" content="Explore the design system and custom Svelte 5 components used in Pastey." />
	<link rel="canonical" href="https://reihan.dev/ui-kit" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://reihan.dev/ui-kit" />
	<meta property="og:title" content="Pastey UI Kit" />
	<meta property="og:description" content="Explore the design system and custom Svelte 5 components used in Pastey." />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://reihan.dev/ui-kit" />
	<meta name="twitter:title" content="Pastey UI Kit" />
	<meta name="twitter:description" content="Explore the design system and custom Svelte 5 components used in Pastey." />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none"
	></div>

	<Header tag="// Design System & Showcase" title="Pastey." subtitle="UI Kit">
		<button
			id="uikit-tab-tokens"
			class="px-4 py-2 rounded-lg transition-colors border {activeTab === 'tokens'
				? 'bg-white text-black border-white'
				: 'bg-brand-accent text-text-secondary border-border-dim hover:text-white'}"
			onclick={() => (activeTab = 'tokens')}
		>
			Design Tokens
		</button>
		<button
			id="uikit-tab-components"
			class="px-4 py-2 rounded-lg transition-colors border {activeTab === 'components'
				? 'bg-white text-black border-white'
				: 'bg-brand-accent text-text-secondary border-border-dim hover:text-white'}"
			onclick={() => (activeTab = 'components')}
		>
			UI Elements
		</button>
	</Header>

	<!-- Content Row -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div
			class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>

		<!-- Main content area -->
		<main class="w-full max-w-6xl px-6 mt-12 pb-24 min-w-0">
			<!-- TOKENS TAB -->
			{#if activeTab === 'tokens'}
				<section class="space-y-16 animate-fade-in">
					<!-- Color Palette -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-2 text-white">01 / Brand Colors</h2>
						<p class="text-xs text-text-muted font-mono mb-6">
							Click a swatch to copy its Tailwind utility class
						</p>

						<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
							<!-- Brand BG -->
							<button
								id="uikit-color-brand-bg"
								class="bg-brand-bg border border-border-light rounded-2xl p-4 text-left group hover:border-white/40 transition-colors"
								onclick={() => copyToClipboard('bg-brand-bg', 'Color')}
							>
								<div class="h-20 rounded-xl bg-brand-bg border border-white/5 mb-3"></div>
								<div class="font-mono text-xs font-bold text-white">brand-bg</div>
								<div class="font-mono text-[10px] text-text-muted mt-1">#050505</div>
							</button>

							<!-- Brand Surface -->
							<button
								id="uikit-color-brand-surface"
								class="bg-brand-surface border border-border-dim rounded-2xl p-4 text-left group hover:border-white/40 transition-colors"
								onclick={() => copyToClipboard('bg-brand-surface', 'Color')}
							>
								<div class="h-20 rounded-xl bg-brand-surface border border-white/5 mb-3"></div>
								<div class="font-mono text-xs font-bold text-white">brand-surface</div>
								<div class="font-mono text-[10px] text-text-muted mt-1">#0f0f0f</div>
							</button>

							<!-- Brand Card -->
							<button
								id="uikit-color-brand-card"
								class="bg-brand-card border border-border-dim rounded-2xl p-4 text-left group hover:border-white/40 transition-colors"
								onclick={() => copyToClipboard('bg-brand-card', 'Color')}
							>
								<div class="h-20 rounded-xl bg-brand-card border border-white/5 mb-3"></div>
								<div class="font-mono text-xs font-bold text-white">brand-card</div>
								<div class="font-mono text-[10px] text-text-muted mt-1">#111111</div>
							</button>

							<!-- Brand Accent -->
							<button
								id="uikit-color-brand-accent"
								class="bg-brand-accent border border-border-dim rounded-2xl p-4 text-left group hover:border-white/40 transition-colors"
								onclick={() => copyToClipboard('bg-brand-accent', 'Color')}
							>
								<div class="h-20 rounded-xl bg-brand-accent border border-white/5 mb-3"></div>
								<div class="font-mono text-xs font-bold text-white">brand-accent</div>
								<div class="font-mono text-[10px] text-text-muted mt-1">#1a1a1a</div>
							</button>

							<!-- Border Light -->
							<button
								id="uikit-color-border-light"
								class="bg-[#111] border border-border-dim rounded-2xl p-4 text-left group hover:border-white/40 transition-colors"
								onclick={() => copyToClipboard('border-border-light', 'Color')}
							>
								<div
									class="h-20 rounded-xl bg-[#111] border border-border-light mb-3 flex items-center justify-center text-[10px] text-text-muted font-mono"
								>
									10% White
								</div>
								<div class="font-mono text-xs font-bold text-white">border-light</div>
								<div class="font-mono text-[10px] text-text-muted mt-1">rgba(255,255,255,0.1)</div>
							</button>
						</div>
					</div>

					<!-- Typography -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">02 / Typography & Fonts</h2>

						<div class="space-y-8 bg-brand-surface border border-border-dim rounded-3xl p-8">
							<!-- Sans -->
							<div
								class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pb-6 border-b border-border-dim"
							>
								<div class="font-mono text-xs text-text-muted">
									<span class="block font-bold text-white">Sans-Serif Font</span>
									<span>font-sans (Inter)</span>
								</div>
								<div class="md:col-span-3 font-sans space-y-2">
									<p class="text-3xl font-bold">Inter Display Extra Bold</p>
									<p class="text-sm text-text-secondary leading-relaxed max-w-xl">
										Inter is a highly versatile, clean font designed for UI readability. Used for
										standard body text, layout captions, and secondary structural information.
									</p>
								</div>
							</div>

							<!-- Mono -->
							<div
								class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pb-6 border-b border-border-dim"
							>
								<div class="font-mono text-xs text-text-muted">
									<span class="block font-bold text-white">Monospace Font</span>
									<span>font-mono (JetBrains Mono)</span>
								</div>
								<div class="md:col-span-3 font-mono space-y-2">
									<p class="text-2xl font-bold text-white">JetBrains Mono Regular & Bold</p>
									<p class="text-xs text-text-secondary leading-relaxed max-w-xl">
										Designed for developers, JetBrains Mono provides high legibility for code
										blocks, labels, headers, and navigation items.
									</p>
								</div>
							</div>

							<!-- Serif -->
							<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
								<div class="font-mono text-xs text-text-muted">
									<span class="block font-bold text-white">Serif Font</span>
									<span>font-serif (Merriweather)</span>
								</div>
								<div class="md:col-span-3 font-serif space-y-2">
									<p class="text-2xl italic text-white">Merriweather Italic Light & Bold</p>
									<p class="text-sm text-text-secondary leading-relaxed max-w-xl">
										Merriweather provides editorial elegance. Used strategically as accents for
										select highlights in headings or paragraphs, creating a sleek design contrast.
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Shadows and Layout Borders -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">03 / Borders & Shadows</h2>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div
								class="border border-border-dim bg-brand-surface rounded-3xl p-6 flex flex-col justify-between min-h-[150px]"
							>
								<span class="font-mono text-xs text-text-muted"
									>Dim Layout Border (`border-border-dim`)</span
								>
								<p class="text-xs text-text-secondary mt-4 leading-relaxed">
									Used for default borders between columns, grids, and list items. Extremely faint
									white (`rgba(255,255,255,0.05)`) to keep layouts minimalistic.
								</p>
							</div>

							<div
								class="shadow-glass bg-brand-surface border border-border-light rounded-3xl p-6 flex flex-col justify-between min-h-[150px]"
							>
								<span class="font-mono text-xs text-text-muted"
									>Glass Shadow Blur (`shadow-glass`)</span
								>
								<p class="text-xs text-text-secondary mt-4 leading-relaxed">
									Provides a premium deep drop shadow with black blur opacity (`0 0 50px
									rgba(0,0,0,0.5)`) to separate containers from the backdrop.
								</p>
							</div>
						</div>
					</div>
				</section>
			{/if}

			<!-- COMPONENTS TAB -->
			{#if activeTab === 'components'}
				<section class="space-y-16 animate-fade-in">
					<!-- Control Panel -->
					<div
						class="bg-brand-surface border border-border-dim rounded-3xl p-6 flex flex-wrap gap-6 items-center justify-between"
					>
						<div class="font-mono">
							<div class="text-xs text-text-muted font-bold">Interactive Component Controls</div>
							<div class="text-[10px] text-text-secondary">
								Toggle component states live across the showcase
							</div>
						</div>
						<div class="flex flex-wrap gap-4">
							<label
								class="inline-flex items-center gap-2 cursor-pointer font-mono text-xs select-none"
							>
								<input
									id="uikit-checkbox-disable-buttons"
									type="checkbox"
									bind:checked={buttonsDisabled}
									class="rounded bg-brand-accent border-border-dim focus:ring-0 text-white"
								/>
								<span>Disable Buttons</span>
							</label>
							<label
								class="inline-flex items-center gap-2 cursor-pointer font-mono text-xs select-none"
							>
								<input
									id="uikit-checkbox-show-errors"
									type="checkbox"
									bind:checked={hasError}
									class="rounded bg-brand-accent border-border-dim focus:ring-0 text-white"
								/>
								<span>Show Form Errors</span>
							</label>
						</div>
					</div>

					<!-- Buttons Showcase -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">01 / Buttons</h2>

						<div class="bg-brand-surface border border-border-dim rounded-3xl p-8 space-y-8">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
								<!-- Primary Buttons -->
								<div class="space-y-4">
									<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">
										// Primary (White / Dark)
									</h3>
									<div class="flex flex-wrap gap-3 items-center">
										<Button variant="primary" disabled={buttonsDisabled}>Primary Action</Button>
										<Button variant="primary" disabled={buttonsDisabled} class="px-5 py-2 text-xs">
											Small Primary
										</Button>
									</div>
									<div
										class="text-[10px] text-text-muted font-mono bg-brand-bg p-3 rounded-lg border border-border-dim"
									>
										&lt;Button variant="primary"&gt;Primary Action&lt;/Button&gt;
									</div>
								</div>

								<!-- Secondary Buttons -->
								<div class="space-y-4">
									<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">
										// Secondary (Accent / Gray)
									</h3>
									<div class="flex flex-wrap gap-3 items-center">
										<Button variant="secondary" disabled={buttonsDisabled}>Secondary Action</Button>
										<Button
											variant="secondary"
											disabled={buttonsDisabled}
											class="px-3 py-1.5 text-[10px]"
										>
											Small Secondary
										</Button>
									</div>
									<div
										class="text-[10px] text-text-muted font-mono bg-brand-bg p-3 rounded-lg border border-border-dim"
									>
										&lt;Button variant="secondary"&gt;Secondary Action&lt;/Button&gt;
									</div>
								</div>

								<!-- Outline Buttons -->
								<div class="space-y-4">
									<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">
										// Outline / Page Controls
									</h3>
									<div class="flex flex-wrap gap-3 items-center">
										<Button variant="outline" class="w-10 h-10" disabled={buttonsDisabled}>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="m15 18-6-6 6-6"></path>
											</svg>
										</Button>
										<Button
											variant="outline"
											class="w-8 h-8 text-xs font-bold bg-white text-black border-white"
											disabled={buttonsDisabled}
										>
											1
										</Button>
										<Button
											variant="outline"
											class="w-8 h-8 text-xs bg-brand-accent text-text-secondary hover:text-white"
											disabled={buttonsDisabled}
										>
											2
										</Button>
										<Button variant="outline" class="px-5 py-2 text-xs" disabled={buttonsDisabled}>
											Simple Outline
										</Button>
									</div>
									<div
										class="text-[10px] text-text-muted font-mono bg-brand-bg p-3 rounded-lg border border-border-dim"
									>
										&lt;Button variant="outline" class="w-10 h-10"&gt;...&lt;/Button&gt;
									</div>
								</div>

								<!-- Circular Icon Buttons -->
								<div class="space-y-4">
									<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">
										// Circular Accent / Hover Scale
									</h3>
									<div class="flex flex-wrap gap-4 items-center">
										<Button variant="circle" disabled={buttonsDisabled}>
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<line x1="5" x2="19" y1="12" y2="12"></line>
												<polyline points="12 5 19 12 12 19"></polyline>
											</svg>
										</Button>

										<Button variant="icon" disabled={buttonsDisabled}>
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path
													d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
												></path>
												<path d="M9 18c-4.51 2-5-2-7-2"></path>
											</svg>
										</Button>
									</div>
									<div
										class="text-[10px] text-text-muted font-mono bg-brand-bg p-3 rounded-lg border border-border-dim"
									>
										&lt;Button variant="circle"&gt;...&lt;/Button&gt;
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Badges Showcase -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">02 / Badges & Social Links</h2>

						<div class="bg-brand-surface border border-border-dim rounded-3xl p-8 space-y-8">
							<!-- Skill Pills -->
							<div class="space-y-4">
								<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">
									// Skill Tags
								</h3>
								<div class="flex flex-wrap gap-2">
									<Badge variant="skill">TypeScript</Badge>
									<Badge variant="skill">Svelte 5</Badge>
									<Badge variant="skill">Tailwind CSS</Badge>
									<Badge variant="skill">PrismJS</Badge>
								</div>
								<div
									class="text-[10px] text-text-muted font-mono bg-brand-bg p-3 rounded-lg border border-border-dim"
								>
									&lt;Badge variant="skill"&gt;TypeScript&lt;/Badge&gt;
								</div>
							</div>

							<!-- Social Badges -->
							<div class="space-y-4">
								<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">
									// Social Icon Links
								</h3>
								<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
									<Badge variant="social" href="#">
										{#snippet icon()}
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path
													d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
												></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg
											>
										{/snippet}
										Github
									</Badge>

									<Badge variant="social" href="#">
										{#snippet icon()}
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path
													d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
												></path><rect width="4" height="12" x="2" y="9"></rect><circle
													cx="4"
													cy="4"
													r="2"
												></circle></svg
											>
										{/snippet}
										Linkedin
									</Badge>

									<Badge variant="social" href="#">
										{#snippet icon()}
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><rect width="20" height="16" x="2" y="4" rx="2"></rect><path
													d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
												></path></svg
											>
										{/snippet}
										Email
									</Badge>
								</div>
								<div
									class="text-[10px] text-text-muted font-mono bg-brand-bg p-3 rounded-lg border border-border-dim"
								>
									&lt;Badge variant="social" href="..."&gt;&lt;svg slot="icon" ...&gt;
									Github&lt;/Badge&gt;
								</div>
							</div>
						</div>
					</div>

					<!-- Form Inputs Showcase -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">03 / Inputs & Text Area</h2>

						<div class="bg-brand-surface border border-border-dim rounded-3xl p-8 space-y-6">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									id="uikit-input-username"
									label="Username"
									placeholder="Enter username..."
									bind:value={username}
									error={formError}
									required
								/>

								<Input
									id="uikit-input-email"
									label="Email Address"
									type="email"
									placeholder="user@pastey.net"
									bind:value={email}
									error={formError}
									required
								/>
							</div>

							<TextArea
								id="uikit-input-message"
								label="Snippet Description"
								placeholder="Describe your paste here..."
								bind:value={message}
								error={formError}
								rows={4}
								required
							/>

							<!-- Live State Feedback -->
							<div
								class="p-4 bg-brand-bg border border-border-dim rounded-2xl font-mono text-xs text-text-secondary space-y-1"
							>
								<div class="font-bold text-white uppercase tracking-wider text-[10px] mb-2">
									// Live Binding Feedback
								</div>
								<div><span class="text-text-muted">Username:</span> {username || 'No value'}</div>
								<div><span class="text-text-muted">Email:</span> {email || 'No value'}</div>
								<div>
									<span class="text-text-muted">Description Length:</span>
									{message.length} characters
								</div>
							</div>
						</div>
					</div>
				</section>
			{/if}
		</main>

		<!-- Right Gutter -->
		<div
			class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>
	</div>

	<Footer showBackToPastey={true} />

	<!-- Toast Message Notification -->
	{#if showToast}
		<div
			class="fixed bottom-6 right-6 bg-white text-black font-mono text-xs font-bold px-6 py-4 rounded-xl shadow-glass flex items-center gap-3 border border-white/20 animate-fade-in z-50"
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="20 6 9 17 4 12"></polyline>
			</svg>
			<span>{toastMessage}</span>
		</div>
	{/if}
</div>
