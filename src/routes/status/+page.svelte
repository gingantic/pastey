<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';

	interface Props {
		data: {
			status: 'success' | 'error';
			data?: {
				status: string;
				message: string;
				timestamp: string;
				stats: {
					total_users: number;
					total_pastes: number;
				};
			};
			error?: string;
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Pastey | System Status</title>
	<meta name="description" content="Check the health, database statistics, and connectivity status of the Pastey API." />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none"
	></div>

	<Header tag="// system health" title="Pastey." subtitle="Status" />

	<!-- Content Row -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div
			class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>

		<!-- Main content area -->
		<main class="w-full max-w-6xl px-6 mt-12 pb-24 min-w-0 flex flex-col gap-8">
			
			<div class="max-w-3xl">
				<h2 class="text-2xl font-mono font-bold text-white mb-2">01 / Connection Status</h2>
				<p class="text-xs text-text-secondary leading-relaxed">
					Verify frontend-to-backend communication, active database connections, and real-time backend stats.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Health status card -->
				<Card class="flex flex-col justify-between min-h-[160px] p-6 border-border-light shadow-glass bg-brand-surface/40 backdrop-blur-md">
					<div class="space-y-2">
						<div class="font-mono text-xs text-text-muted">// api connection</div>
						<div class="flex items-center gap-3">
							{#if data.status === 'success'}
								<span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
								<span class="font-mono font-bold text-white text-lg">ONLINE</span>
							{:else}
								<span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
								<span class="font-mono font-bold text-red-500 text-lg">OFFLINE</span>
							{/if}
						</div>
					</div>
					<div class="mt-4">
						{#if data.status === 'success'}
							<p class="text-xs text-text-secondary">
								The API backend responds correctly at the configured environment endpoint.
							</p>
						{:else}
							<p class="text-xs text-red-400 font-mono">
								Error: {data.error}
							</p>
						{/if}
					</div>
				</Card>

				<!-- Total users card -->
				<Card class="flex flex-col justify-between min-h-[160px] p-6 border-border-light shadow-glass bg-brand-surface/40 backdrop-blur-md">
					<div class="space-y-1">
						<div class="font-mono text-xs text-text-muted">// registered users</div>
						<div class="font-mono text-4xl font-bold text-white tracking-tight">
							{data.status === 'success' ? data.data?.stats.total_users ?? 0 : '--'}
						</div>
					</div>
					<div class="mt-4">
						<p class="text-xs text-text-secondary">
							Total user accounts initialized in the primary database.
						</p>
					</div>
				</Card>

				<!-- Total pastes card -->
				<Card class="flex flex-col justify-between min-h-[160px] p-6 border-border-light shadow-glass bg-brand-surface/40 backdrop-blur-md">
					<div class="space-y-1">
						<div class="font-mono text-xs text-text-muted">// shared pastes</div>
						<div class="font-mono text-4xl font-bold text-white tracking-tight">
							{data.status === 'success' ? data.data?.stats.total_pastes ?? 0 : '--'}
						</div>
					</div>
					<div class="mt-4">
						<p class="text-xs text-text-secondary">
							Active code snippets hosted inside the sqlite database.
						</p>
					</div>
				</Card>
			</div>

			<!-- Backend Response payload details -->
			{#if data.status === 'success' && data.data}
				<div class="space-y-3">
					<h3 class="text-xs font-mono text-text-muted uppercase tracking-wider">// Raw JSON Response</h3>
					<div class="p-5 bg-brand-accent/50 border border-border-dim rounded-2xl font-mono text-[11px] text-text-secondary overflow-x-auto">
						<pre class="text-text-secondary">{JSON.stringify(data.data, null, 2)}</pre>
					</div>
				</div>
			{/if}

			<div>
				<Button href="/" variant="secondary" class="font-mono text-xs py-2 px-4 cursor-pointer">
					← Back to main dashboard
				</Button>
			</div>
		</main>

		<!-- Right Gutter -->
		<div
			class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"
		></div>
	</div>

	<Footer showBackToPastey={false} />
</div>
