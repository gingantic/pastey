<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	import TextArea from '$lib/components/TextArea.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import Timeline from '$lib/components/Timeline.svelte';

	// State for forms showcase
	let username = $state('');
	let email = $state('');
	let searchQuery = $state('');
	let password = $state('');
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

	// Slide dummy data
	const slides = [
		{
			image:
				'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
			title: 'The simplest example is kafka + golang',
			description:
				'This article presents a simple way to implement a micro-service architecture using Kafka, Golang and Docker.',
			link: '#',
			linkText: 'Read article'
		},
		{
			image:
				'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
			title: 'Understanding React Server Components',
			description:
				'A deep dive into the new paradigm of building React applications with server-first mental model.',
			link: '#',
			linkText: 'Read article'
		},
		{
			image:
				'https://images.unsplash.com/photo-1616469829941-c7200edec809?q=80&w=600&auto=format&fit=crop',
			title: 'Effective State Management',
			description:
				'Moving away from Redux boilerplate towards a more minimalistic approach to state.',
			link: '#',
			linkText: 'Read article'
		}
	];

	// Timeline dummy data
	const timelineItems = [
		{
			year: '2022',
			title: 'IT HUB',
			subtitle: '1 year 5 months',
			details: 'Frontend Developer | React & Vue'
		},
		{
			year: '2021',
			title: 'VK Development Lab',
			subtitle: '8 months',
			details: 'Frontend Developer | React'
		},
		{
			year: '2020',
			title: 'SH Inc.',
			subtitle: '9 months',
			details: 'Fullstack developer | JavaScript & Python'
		}
	];

	// Active tab
	let activeTab = $state('tokens');
</script>

<svelte:head>
	<title>Rhnx. UI Kit - Design System</title>
	<meta name="description" content="Rhnx. UI Kit: A modern design system and UI elements showcase build with Svelte 5 and Tailwind CSS v4." />
	<link rel="canonical" href="https://reihan.dev/ui-kit" />
	<meta name="robots" content="index, follow" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://reihan.dev/ui-kit" />
	<meta property="og:title" content="Rhnx. UI Kit - Design System" />
	<meta property="og:description" content="Rhnx. UI Kit: A modern design system and UI elements showcase build with Svelte 5 and Tailwind CSS v4." />
	<meta
		property="og:image"
		content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
	/>

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://reihan.dev/ui-kit" />
	<meta name="twitter:title" content="Rhnx. UI Kit - Design System" />
	<meta name="twitter:description" content="Rhnx. UI Kit: A modern design system and UI elements showcase build with Svelte 5 and Tailwind CSS v4." />
	<meta
		name="twitter:image"
		content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
	/>
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none"
	></div>

	<!-- Header Row -->
	<div class="w-full flex border-b border-border-dim relative z-10">
		<!-- Left Gutter -->
		<div
			class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>

		<!-- Header Area -->
		<header
			class="w-full max-w-6xl px-6 py-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
		>
			<div>
				<div class="font-mono text-xs text-text-muted uppercase tracking-widest mb-2">
					// Design System & Showcase
				</div>
				<h1
					class="text-4xl md:text-5xl font-bold tracking-tight text-white"
					style="font-family: 'Inter', sans-serif;"
				>
					Rhnx. <span class="font-serif italic font-light text-text-secondary">UI Kit</span>
				</h1>
			</div>

			<!-- Nav tabs -->
			<nav class="flex flex-wrap gap-2 font-mono text-xs">
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
				<button
					id="uikit-tab-sections"
					class="px-4 py-2 rounded-lg transition-colors border {activeTab === 'sections'
						? 'bg-white text-black border-white'
						: 'bg-brand-accent text-text-secondary border-border-dim hover:text-white'}"
					onclick={() => (activeTab = 'sections')}
				>
					Interactive Layouts
				</button>
				<button
					id="uikit-tab-fullpage"
					class="px-4 py-2 rounded-lg transition-colors border {activeTab === 'fullpage'
						? 'bg-white text-black border-white'
						: 'bg-brand-accent text-text-secondary border-border-dim hover:text-white'}"
					onclick={() => (activeTab = 'fullpage')}
				>
					Live Portfolio
				</button>
			</nav>
		</header>

		<!-- Right Gutter -->
		<div
			class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>
	</div>

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
									<Badge variant="skill">React Native</Badge>
									<Badge variant="skill">Golang</Badge>
									<Badge variant="skill">Docker</Badge>
									<Badge variant="skill">PostgreSQL</Badge>
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
								<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
												><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg
											>
										{/snippet}
										Telegram
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
							<!-- Standard Inputs -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									id="uikit-input-username"
									label="Full Name"
									placeholder="Enter your name..."
									bind:value={username}
									error={formError}
									required
								/>

								<Input
									id="uikit-input-email"
									label="Email Address"
									type="email"
									placeholder="alex@domain.com"
									bind:value={email}
									error={formError}
									required
								/>
							</div>

							<!-- Inputs with Icons -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Input
									id="uikit-input-search"
									label="Search Projects (With Icon)"
									placeholder="Search by keywords..."
									bind:value={searchQuery}
								>
									{#snippet icon()}
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
											<circle cx="11" cy="11" r="8"></circle>
											<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
										</svg>
									{/snippet}
								</Input>

								<Input
									id="uikit-input-password"
									label="Secure Password (With Icon)"
									type="password"
									placeholder="••••••••••••"
									bind:value={password}
								>
									{#snippet icon()}
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
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
											<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
										</svg>
									{/snippet}
								</Input>
							</div>

							<TextArea
								id="uikit-input-message"
								label="Message / Cover Letter"
								placeholder="Tell us about your project..."
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
									<span class="text-text-muted">Search Query:</span>
									{searchQuery || 'No value'}
								</div>
								<div>
									<span class="text-text-muted">Password Length:</span>
									{password.length} characters
								</div>
								<div>
									<span class="text-text-muted">Message Length:</span>
									{message.length} characters
								</div>
							</div>
						</div>
					</div>
				</section>
			{/if}

			<!-- INTERACTIVE LAYOUTS TAB -->
			{#if activeTab === 'sections'}
				<section class="space-y-16 animate-fade-in">
					<!-- Carousel Slider -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">
							01 / Featured Article Carousel
						</h2>
						<Slider {slides} autoplay={false} />
					</div>

					<!-- Timeline -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">02 / Work History Timeline</h2>
						<div class="bg-brand-surface border border-border-dim rounded-3xl p-8">
							<Timeline items={timelineItems} />
						</div>
					</div>

					<!-- Cards Showcase -->
					<div>
						<h2 class="text-xl font-mono font-bold mb-6 text-white">
							03 / Grid Cards (Static & Interactive)
						</h2>

						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<!-- Skill Card style -->
							<Card>
								{#snippet header()}
									<div class="flex justify-between items-center">
										<h3 class="text-lg font-mono text-white">Front-end</h3>
										<div
											class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white"
										>
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line
													x1="3"
													x2="21"
													y1="9"
													y2="9"
												></line><line x1="9" x2="9" y1="21" y2="9"></line></svg
											>
										</div>
									</div>
								{/snippet}
								<div class="flex flex-wrap gap-2 mt-2">
									<Badge variant="skill">TypeScript</Badge>
									<Badge variant="skill">Svelte 5</Badge>
									<Badge variant="skill">React</Badge>
									<Badge variant="skill">Tailwind CSS</Badge>
								</div>
							</Card>

							<!-- Project Card style (Interactive) -->
							<Card variant="interactive" class="flex flex-col h-full">
								<h3 class="text-xl font-mono text-white mb-2">Gostat Auth</h3>

								<div class="flex flex-wrap gap-2 mb-4">
									<Badge variant="skill">Golang</Badge>
									<Badge variant="skill">TypeScript</Badge>
								</div>

								<p class="text-xs text-text-secondary leading-relaxed mb-6 font-sans">
									A cutting-edge microservice-based application designed to handle authentication
									with elegance and speed.
								</p>

								{#snippet footer()}
									<div
										class="rounded-2xl overflow-hidden aspect-[16/9] w-full border border-border-dim relative"
									>
										<img
											src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop"
											alt="Gostat"
											class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										/>
									</div>
								{/snippet}
							</Card>

							<!-- Article Card Style -->
							<Card variant="interactive" padding="p-8" class="flex flex-col justify-between">
								<div>
									<h3
										class="text-white font-mono text-lg mb-3 group-hover:underline underline-offset-4 decoration-1 leading-snug"
									>
										Rust for Web Developers
									</h3>
									<p class="text-text-secondary text-xs font-light leading-relaxed mb-6 font-sans">
										Why learning Rust can make you a better frontend developer and how to start
										compiled code integrations.
									</p>
								</div>

								{#snippet footer()}
									<div class="flex items-center gap-3">
										<Button variant="primary" class="px-5 py-2 text-xs">Read article</Button>
										<div
											class="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center border border-border-dim"
										>
											<svg
												width="14"
												height="14"
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
										</div>
									</div>
								{/snippet}
							</Card>
						</div>
					</div>
				</section>
			{/if}

			<!-- LIVE PORTFOLIO TAB -->
			{#if activeTab === 'fullpage'}
				<section class="animate-fade-in space-y-4">
					<div
						class="p-4 bg-brand-surface border border-border-dim rounded-2xl flex items-center justify-between"
					>
						<span class="font-mono text-xs text-text-secondary"
							>Previewing full page built with reusable UI Kit components</span
						>
						<div class="flex gap-2">
							<span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
							<span class="font-mono text-[10px] text-text-muted uppercase">Ready</span>
						</div>
					</div>

					<!-- Embedded Portfolio Mockup container -->
					<div
						class="max-w-6xl mx-auto bg-brand-bg border border-border-dim rounded-[2rem] overflow-hidden shadow-glass relative"
					>
						<!-- Header Component Mock -->
						<header
							class="flex justify-between items-center px-6 py-6 border-b border-border-dim/40 sticky top-0 bg-brand-bg/90 backdrop-blur-md z-40"
						>
							<div class="font-mono text-sm font-bold tracking-widest text-text-secondary">
								alex.dev
							</div>
							<nav class="flex gap-8 text-xs font-mono text-text-muted items-center">
								<a href="#about" class="hover:text-white transition-colors">About</a>
								<a href="#projects" class="hover:text-white transition-colors">Projects</a>
								<a href="#articles" class="hover:text-white transition-colors">Articles</a>
								<Button variant="primary" class="px-5 py-2 text-xs">Contact</Button>
							</nav>
						</header>

						<!-- Hero Area -->
						<main class="px-6 md:px-12 py-16 space-y-24">
							<!-- Hero Section -->
							<section class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
								<div>
									<h2
										class="text-4xl lg:text-6xl font-mono font-bold leading-[1.1] mb-6 tracking-tighter"
									>
										Full-stack<br />
										<span class="text-white">Developer</span>
									</h2>
									<p
										class="text-text-secondary text-sm font-light leading-relaxed mb-8 max-w-lg font-sans"
									>
										My goal is to <span class="text-gray-200 italic font-medium font-serif"
											>write maintainable, clean</span
										>
										and
										<span class="text-gray-200 italic font-medium font-serif"
											>understandable code</span
										> so developer experience is enjoyable.
									</p>

									<div class="flex items-center gap-3 mb-10">
										<Button variant="primary" class="px-8 py-3 text-sm">Projects</Button>
										<Button variant="circle">
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
									</div>

									<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
													><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg
												>
											{/snippet}
											Telegram
										</Badge>
									</div>
								</div>
								<div class="hidden md:block">
									<!-- Empty Right Column for balance -->
								</div>
							</section>

							<!-- Slider section -->
							<Slider {slides} />

							<!-- About Me section -->
							<section class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" id="about">
								<div>
									<h4 class="text-text-muted text-xs font-mono mb-6">... /About me ...</h4>
									<p class="text-2xl leading-relaxed mb-8 font-light text-text-primary">
										Hello! I'm Alex. I'm a <span class="font-serif italic text-white"
											>full-stack developer</span
										>. More than <span class="font-serif italic text-white">5 years</span> experience.
									</p>
									<p class="text-text-secondary text-sm leading-relaxed font-sans">
										I specialize in building complex web applications with a focus on scalar
										architecture and developer experience.
									</p>
								</div>

								<div
									class="aspect-square w-full md:w-4/5 mx-auto rounded-[2rem] overflow-hidden border border-border-dim relative grayscale hover:grayscale-0 transition-all duration-[800ms] cursor-pointer"
								>
									<img
										src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=800&auto=format&fit=crop&grayscale"
										alt="Portrait"
										class="w-full h-full object-cover"
									/>
									<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
								</div>
							</section>

							<!-- Skills Grid -->
							<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								<!-- Card Frontend -->
								<Card>
									{#snippet header()}
										<div class="flex justify-between items-start mb-4">
											<h3 class="text-lg font-mono">Front-end</h3>
											<div
												class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line
														x1="3"
														x2="21"
														y1="9"
														y2="9"
													></line><line x1="9" x2="9" y1="21" y2="9"></line></svg
												>
											</div>
										</div>
									{/snippet}
									<div class="flex flex-wrap gap-1.5">
										<span class="text-[10px] text-text-secondary font-mono">TypeScript /</span>
										<span class="text-[10px] text-text-secondary font-mono">React /</span>
										<span class="text-[10px] text-text-secondary font-mono">Vue /</span>
										<span class="text-[10px] text-text-secondary font-mono">Nextjs /</span>
										<span class="text-[10px] text-text-secondary font-mono">Svelte 5</span>
									</div>
								</Card>

								<!-- Card Styles -->
								<Card>
									{#snippet header()}
										<div class="flex justify-between items-start mb-4">
											<h3 class="text-lg font-mono">Styles</h3>
											<div
												class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><polyline points="16 18 22 12 16 6"></polyline><polyline
														points="8 6 2 12 8 18"
													></polyline></svg
												>
											</div>
										</div>
									{/snippet}
									<div class="flex flex-wrap gap-1.5">
										<span class="text-[10px] text-text-secondary font-mono">SCSS / SASS /</span>
										<span class="text-[10px] text-text-secondary font-mono">Tailwind CSS /</span>
										<span class="text-[10px] text-text-secondary font-mono">MUI</span>
									</div>
								</Card>

								<!-- Card Backend -->
								<Card>
									{#snippet header()}
										<div class="flex justify-between items-start mb-4">
											<h3 class="text-lg font-mono">Back-end</h3>
											<div
												class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path
														d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"
													></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg
												>
											</div>
										</div>
									{/snippet}
									<div class="flex flex-wrap gap-1.5">
										<span class="text-[10px] text-text-secondary font-mono">Golang /</span>
										<span class="text-[10px] text-text-secondary font-mono">PostgreSQL /</span>
										<span class="text-[10px] text-text-secondary font-mono">Redis /</span>
										<span class="text-[10px] text-text-secondary font-mono">Node.js</span>
									</div>
								</Card>

								<!-- Card DevOps -->
								<Card>
									{#snippet header()}
										<div class="flex justify-between items-start mb-4">
											<h3 class="text-lg font-mono">DevOps</h3>
											<div
												class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white"
											>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect
														x="2"
														y="14"
														width="20"
														height="8"
														rx="2"
														ry="2"
													></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line
														x1="6"
														y1="18"
														x2="6.01"
														y2="18"
													></line></svg
												>
											</div>
										</div>
									{/snippet}
									<div class="flex flex-wrap gap-1.5">
										<span class="text-[10px] text-text-secondary font-mono">Docker /</span>
										<span class="text-[10px] text-text-secondary font-mono">Kubernetes /</span>
										<span class="text-[10px] text-text-secondary font-mono">GitHub Actions</span>
									</div>
								</Card>
							</section>

							<!-- Timeline Work Experience -->
							<section class="py-12 border-t border-border-dim/30">
								<h3 class="font-mono text-xl mb-12 text-white">Work History</h3>
								<Timeline items={timelineItems} />
							</section>
						</main>

						<!-- Footer Component Mock -->
						<footer class="p-12 border-t border-border-dim bg-brand-surface/50">
							<div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 font-sans">
								<div>
									<nav class="flex flex-col gap-3 text-xs font-mono text-text-secondary">
										<a href="#" class="hover:text-white transition-colors">Main</a>
										<a href="#" class="hover:text-white transition-colors">About</a>
										<a href="#" class="hover:text-white transition-colors">Projects</a>
										<a href="#" class="hover:text-white transition-colors">Articles</a>
									</nav>
								</div>
								<div class="md:col-span-2">
									<h5 class="font-mono text-text-muted text-xs mb-3">Site Architecture</h5>
									<p class="text-xs text-text-muted leading-relaxed font-mono">
										Handcrafted by Alex Morgan /<br />
										Designed by TaiZiLa /<br />
										Ported to Svelte 5 & Tailwind v4
									</p>
								</div>
								<div class="text-right">
									<h2 class="text-3xl font-serif font-bold text-white mb-1">Alex</h2>
									<h2 class="text-2xl font-mono text-text-secondary">Morgan</h2>
									<span
										class="text-[10px] font-mono text-text-muted uppercase tracking-wider block mt-2"
										>Full-stack Developer</span
									>
								</div>
							</div>
						</footer>
					</div>
				</section>
			{/if}
		</main>

		<!-- Right Gutter -->
		<div
			class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>
	</div>

	<!-- Footer Row -->
	<div class="w-full flex border-t border-border-dim bg-brand-surface/20 relative z-10">
		<!-- Left Gutter -->
		<div
			class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>

		<!-- Footer Content Area -->
		<footer
			class="w-full max-w-6xl px-6 py-12 flex flex-col md:flex-row justify-between gap-12 text-sm"
		>
			<!-- Left column: Brand & Description -->
			<div class="space-y-4 max-w-sm">
				<div class="flex items-center gap-2">
					<span class="font-mono font-bold text-white text-base tracking-tight">
						Alex.dev <span class="font-serif italic font-light text-text-secondary text-sm"
							>UI Kit</span
						>
					</span>
				</div>
				<p class="text-xs text-text-secondary leading-relaxed">
					A modern developer portfolio template and design system built with Svelte 5 and Tailwind
					CSS v4. Designed for premium aesthetics and maximum code clarity.
				</p>
				<p class="text-[10px] text-text-muted font-mono">
					&copy; {new Date().getFullYear()} Alex.dev. All rights reserved.
				</p>
			</div>

			<!-- Center Column: Quick Navigation -->
			<div class="flex flex-wrap gap-x-16 gap-y-8">
				<div class="space-y-3">
					<h4 class="font-mono text-xs font-bold text-white uppercase tracking-wider">
						// Navigation
					</h4>
					<ul class="space-y-2 text-xs font-mono text-text-secondary">
						<li>
							<button
								onclick={() => (activeTab = 'tokens')}
								class="hover:text-white transition-colors text-left cursor-pointer"
							>
								Design Tokens
							</button>
						</li>
						<li>
							<button
								onclick={() => (activeTab = 'components')}
								class="hover:text-white transition-colors text-left cursor-pointer"
							>
								UI Elements
							</button>
						</li>
						<li>
							<button
								onclick={() => (activeTab = 'sections')}
								class="hover:text-white transition-colors text-left cursor-pointer"
							>
								Interactive Layouts
							</button>
						</li>
						<li>
							<button
								onclick={() => (activeTab = 'fullpage')}
								class="hover:text-white transition-colors text-left cursor-pointer"
							>
								Live Portfolio
							</button>
						</li>
					</ul>
				</div>

				<div class="space-y-3">
					<h4 class="font-mono text-xs font-bold text-white uppercase tracking-wider">
						// Socials
					</h4>
					<ul class="space-y-2 text-xs font-mono text-text-secondary">
						<li><a href="#" class="hover:text-white transition-colors">GitHub</a></li>
						<li><a href="#" class="hover:text-white transition-colors">LinkedIn</a></li>
						<li><a href="#" class="hover:text-white transition-colors">Telegram</a></li>
						<li>
							<a href="mailto:alex@dev.com" class="hover:text-white transition-colors">Email</a>
						</li>
					</ul>
				</div>

				<div class="space-y-3">
					<h4 class="font-mono text-xs font-bold text-white uppercase tracking-wider">
						// Tech Stack
					</h4>
					<div class="flex flex-col gap-1 text-[10px] text-text-muted font-mono">
						<span>Svelte 5 (Runes)</span>
						<span>Tailwind CSS v4</span>
						<span>Vite & TypeScript</span>
						<span>JetBrains Mono & Inter</span>
					</div>
				</div>
			</div>
		</footer>

		<!-- Right Gutter -->
		<div
			class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>
	</div>

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
