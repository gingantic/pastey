<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import {
		BookOpen,
		KeyRound,
		Terminal,
		ShieldAlert,
		Copy,
		Check
	} from '@lucide/svelte';

	// ─── Types ────────────────────────────────────────────────────────────────
	interface Field {
		name: string;
		type: string;
		desc: string;
	}

	interface Endpoint {
		method: 'GET' | 'POST' | 'PUT' | 'DELETE';
		path: string;
		auth: 'user' | 'session';
		desc: string;
		params?: Field[];
		body?: Field[];
		example?: string;
	}

	interface Section {
		id: string;
		title: string;
		note?: string;
		endpoints: Endpoint[];
	}

	// ─── State ────────────────────────────────────────────────────────────────
	let origin = $state('https://pastey.example');
	$effect(() => {
		origin = window.location.origin;
	});

	let copied = $state(false);
	const quickStart = $derived(
		`curl -H "Authorization: Bearer pk_YOUR_KEY" \\\n  ${origin}/api/users/me`
	);

	async function copyQuickStart() {
		try {
			await navigator.clipboard.writeText(quickStart.replace(' \\\n  ', ' '));
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			/* clipboard unavailable */
		}
	}

	// ─── Badge styling ────────────────────────────────────────────────────────
	const methodColors: Record<string, string> = {
		GET: 'text-green-400 border-green-500/30 bg-green-500/10',
		POST: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
		PUT: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
		DELETE: 'text-red-400 border-red-500/30 bg-red-500/10'
	};

	const authBadges: Record<string, { label: string; class: string }> = {
		user: { label: 'API key', class: 'text-cyan-400 border-cyan-500/30' },
		session: { label: 'Session only', class: 'text-amber-400 border-amber-500/30' }
	};

	// ─── Endpoint Reference Data ──────────────────────────────────────────────
	const sections: Section[] = [
		{
			id: 'pastes',
			title: 'Pastes',
			endpoints: [
				{
					method: 'POST',
					path: '/api/pastes',
					auth: 'user',
					desc: 'Create a paste on your account.',
					body: [
						{ name: 'content', type: 'string (required)', desc: 'The paste content. Must not be empty.' },
						{ name: 'title', type: 'string', desc: 'Paste title. Defaults to "Untitled".' },
						{ name: 'lang', type: 'string', desc: 'Syntax highlighting language. Defaults to "plaintext".' },
						{ name: 'expiry', type: 'enum', desc: 'One of: 10m, 1h, 1d, 1w, 1mo, never. Defaults to never.' },
						{ name: 'visibility', type: 'enum', desc: 'One of: public, unlisted, private. Defaults to public.' },
						{ name: 'custom_slug', type: 'string', desc: 'Custom URL (3–50 chars, letters/numbers/-/_).' }
					],
					example: `{
  "id": "aB3d",
  "title": "hello.ts",
  "content": "console.log('hi')",
  "lang": "typescript",
  "expiry": "1d",
  "visibility": "public",
  "author_name": "alice",
  "views": 0,
  "created_at": "2026-07-27T10:00:00.000Z",
  "expires_at": "2026-07-28T10:00:00.000Z"
}`
				},
				{
					method: 'GET',
					path: '/api/pastes/:id',
					auth: 'user',
					desc: 'Fetch a paste by ID. Private pastes are only visible to their owner. Expired pastes return 404.'
				},
				{
					method: 'GET',
					path: '/api/pastes/:id/raw',
					auth: 'user',
					desc: 'Fetch the raw paste content as text/plain — ideal for piping into scripts.'
				},
				{
					method: 'PUT',
					path: '/api/pastes/:id',
					auth: 'user',
					desc: 'Update a paste you own. Accepts the same body fields as create.'
				},
				{
					method: 'DELETE',
					path: '/api/pastes/:id',
					auth: 'user',
					desc: 'Delete a paste you own (admins may delete any paste).',
					example: `{ "message": "paste deleted successfully" }`
				}
			]
		},
		{
			id: 'users',
			title: 'Users',
			endpoints: [
				{
					method: 'GET',
					path: '/api/users/me',
					auth: 'user',
					desc: 'List all of your pastes, including unlisted and private ones.',
					example: `{ "pastes": [ ... ], "total": 12 }`
				},
				{
					method: 'GET',
					path: '/api/users/:username',
					auth: 'user',
					desc: "List a user's public pastes. When requesting your own username, all pastes are included.",
					example: `{ "pastes": [ ... ], "total": 4 }`
				}
			]
		},
		{
			id: 'keys',
			title: 'API Keys',
			note: 'These endpoints require a browser session or JWT — API keys cannot manage other API keys.',
			endpoints: [
				{
					method: 'GET',
					path: '/api/keys',
					auth: 'session',
					desc: 'List your API keys. Only the prefix is returned; the full key is never stored.',
					example: `{
  "keys": [
    {
      "id": "6f1c...",
      "name": "ci-deploy",
      "prefix": "pk_a1b2c3d",
      "created_at": "2026-07-27T10:00:00.000Z",
      "last_used_at": null
    }
  ]
}`
				},
				{
					method: 'POST',
					path: '/api/keys',
					auth: 'session',
					desc: 'Create an API key (max 10 per user). The raw key is returned exactly once — store it securely.',
					body: [
						{ name: 'name', type: 'string (required)', desc: 'A label for the key, up to 50 characters.' }
					],
					example: `{
  "id": "6f1c...",
  "name": "ci-deploy",
  "prefix": "pk_a1b2c3d",
  "created_at": "2026-07-27T10:00:00.000Z",
  "last_used_at": null,
  "key": "pk_<64 hex chars — shown only once>"
}`
				},
				{
					method: 'DELETE',
					path: '/api/keys/:id',
					auth: 'session',
					desc: 'Revoke an API key immediately.',
					example: `{ "message": "API key revoked" }`
				}
			]
		}
	];

	// ─── Errors reference ─────────────────────────────────────────────────────
	const errorCodes = [
		{ code: '400', desc: 'Bad request — missing or invalid fields' },
		{ code: '401', desc: 'Authentication required or token/key invalid' },
		{ code: '403', desc: 'Forbidden — insufficient permissions, or API key used on a restricted endpoint' },
		{ code: '404', desc: 'Resource not found (or paste expired)' },
		{ code: '409', desc: 'Conflict — e.g. custom URL already taken' },
		{ code: '500', desc: 'Internal server error' }
	];
</script>

<svelte:head>
	<title>API Documentation — Pastey</title>
	<meta name="description" content="REST API reference for Pastey: authenticate with your personal API key to manage pastes programmatically." />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Top Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[220px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none"
	></div>

	<Header subtitle="Docs" tag="// api reference" />

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 mt-10 pb-24 min-w-0">

			<!-- Page Header -->
			<div class="mb-8 border-b border-border-dim pb-6">
				<h2 class="text-xl font-bold font-mono tracking-tight text-white mb-1.5 flex items-center gap-2">
					<BookOpen class="text-cyan-400" size={18} /> // REST API Reference
				</h2>
				<p class="text-xs text-text-muted font-mono leading-relaxed">
					Manage your pastes programmatically over a JSON REST API at
					<span class="text-text-secondary">{origin}/api</span>.
					Every endpoint requires authentication.
				</p>
			</div>

			<!-- Authentication -->
			<section class="mb-10">
				<h3 class="text-sm font-bold font-mono text-white mb-3 flex items-center gap-2">
					<KeyRound size={14} class="text-cyan-400" /> Authentication
				</h3>
				<div class="bg-brand-surface/60 border border-border-dim rounded-xl p-5 shadow-glass space-y-4">
					<p class="text-xs text-text-secondary font-mono leading-relaxed">
						The API is authenticated with personal API keys. Generate one from
						<a href="/settings" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Settings → API Keys</a>
						and send it with every request. Two headers are supported:
					</p>
					<div class="space-y-2">
						<code class="block bg-brand-bg border border-border-dim rounded-lg px-4 py-2.5 font-mono text-xs text-text-primary overflow-x-auto whitespace-nowrap">
							Authorization: Bearer pk_&lt;your key&gt; <span class="text-text-muted">// primary</span>
						</code>
						<code class="block bg-brand-bg border border-border-dim rounded-lg px-4 py-2.5 font-mono text-xs text-text-primary overflow-x-auto whitespace-nowrap">
							X-API-Key: pk_&lt;your key&gt; <span class="text-text-muted">// fallback</span>
						</code>
					</div>
					<div class="flex items-start gap-2 pt-2 border-t border-border-dim/50">
						<ShieldAlert size={13} class="text-amber-400 mt-0.5 shrink-0" />
						<p class="text-[11px] text-text-muted font-mono leading-relaxed">
							API keys are scoped for safety: they are rejected with <span class="text-amber-400">403</span> on
							<span class="text-text-secondary">/api/keys</span> and <span class="text-text-secondary">/api/admin/*</span>,
							so a leaked key can neither mint new keys nor reach admin functionality. Keys can be revoked at any time from Settings.
						</p>
					</div>
				</div>
			</section>

			<!-- Quick Start -->
			<section class="mb-10">
				<h3 class="text-sm font-bold font-mono text-white mb-3 flex items-center gap-2">
					<Terminal size={14} class="text-green-400" /> Quick Start
				</h3>
				<div class="bg-brand-surface/60 border border-border-dim rounded-xl shadow-glass overflow-hidden">
					<div class="px-5 py-3 border-b border-border-dim flex items-center justify-between">
						<span class="text-[10px] text-text-muted font-mono uppercase tracking-wider">// list your pastes</span>
						<button
							onclick={copyQuickStart}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-colors cursor-pointer {copied ? 'text-green-400 border-green-500/30' : 'text-text-secondary border-border-dim hover:text-white'}"
						>
							{#if copied}
								<Check size={11} /> Copied
							{:else}
								<Copy size={11} /> Copy
							{/if}
						</button>
					</div>
					<pre class="px-5 py-4 font-mono text-xs text-text-primary overflow-x-auto"><span class="text-text-muted">$</span> {quickStart}</pre>
				</div>
			</section>

			<!-- Endpoint Reference -->
			{#each sections as section (section.id)}
				<section class="mb-10" id={section.id}>
					<h3 class="text-sm font-bold font-mono text-white mb-1.5">// {section.title}</h3>
					{#if section.note}
						<p class="text-[11px] text-text-muted font-mono mb-3 leading-relaxed">{section.note}</p>
					{:else}
						<div class="mb-3"></div>
					{/if}

					<div class="space-y-3">
						{#each section.endpoints as ep (ep.method + ep.path)}
							<div class="bg-brand-surface/60 border border-border-dim rounded-xl shadow-glass overflow-hidden">
								<!-- Endpoint header -->
								<div class="px-5 py-3.5 flex flex-wrap items-center gap-3 border-b border-border-dim/50">
									<span class="px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold {methodColors[ep.method]}">
										{ep.method}
									</span>
									<code class="font-mono text-xs text-text-primary">{ep.path}</code>
									<span class="ml-auto px-2 py-0.5 rounded-md border font-mono text-[9px] uppercase tracking-wider {authBadges[ep.auth].class}">
										{authBadges[ep.auth].label}
									</span>
								</div>

								<div class="px-5 py-4 space-y-4">
									<p class="text-xs text-text-secondary font-mono leading-relaxed">{ep.desc}</p>

									{#if ep.params}
										<div>
											<div class="text-[9px] text-text-muted font-mono uppercase tracking-wider mb-2">Query parameters</div>
											<div class="border border-border-dim rounded-lg overflow-hidden">
												{#each ep.params as f (f.name)}
													<div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 py-2.5 border-b border-border-dim/50 last:border-b-0 font-mono">
														<code class="text-xs text-cyan-400 w-32 shrink-0">{f.name}</code>
														<span class="text-[10px] text-text-muted w-32 shrink-0">{f.type}</span>
														<span class="text-[11px] text-text-secondary">{f.desc}</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}

									{#if ep.body}
										<div>
											<div class="text-[9px] text-text-muted font-mono uppercase tracking-wider mb-2">JSON body</div>
											<div class="border border-border-dim rounded-lg overflow-hidden">
												{#each ep.body as f (f.name)}
													<div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 py-2.5 border-b border-border-dim/50 last:border-b-0 font-mono">
														<code class="text-xs text-cyan-400 w-32 shrink-0">{f.name}</code>
														<span class="text-[10px] text-text-muted w-32 shrink-0">{f.type}</span>
														<span class="text-[11px] text-text-secondary">{f.desc}</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}

									{#if ep.example}
										<div>
											<div class="text-[9px] text-text-muted font-mono uppercase tracking-wider mb-2">Example response</div>
											<pre class="bg-brand-bg border border-border-dim rounded-lg px-4 py-3 font-mono text-[11px] text-text-primary overflow-x-auto leading-relaxed">{ep.example}</pre>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}

			<!-- Errors -->
			<section class="mb-10" id="errors">
				<h3 class="text-sm font-bold font-mono text-white mb-3">// Errors</h3>
				<div class="bg-brand-surface/60 border border-border-dim rounded-xl shadow-glass overflow-hidden">
					<div class="px-5 py-4 border-b border-border-dim/50">
						<p class="text-xs text-text-secondary font-mono leading-relaxed mb-2">
							All errors share a single JSON shape:
						</p>
						<pre class="bg-brand-bg border border-border-dim rounded-lg px-4 py-3 font-mono text-[11px] text-text-primary overflow-x-auto">{'{ "error": "human readable message" }'}</pre>
					</div>
					{#each errorCodes as e (e.code)}
						<div class="flex items-baseline gap-4 px-5 py-2.5 border-b border-border-dim/50 last:border-b-0 font-mono">
							<code class="text-xs font-bold {e.code.startsWith('5') ? 'text-red-400' : 'text-amber-400'} w-10 shrink-0">{e.code}</code>
							<span class="text-[11px] text-text-secondary">{e.desc}</span>
						</div>
					{/each}
				</div>
			</section>
		</main>

		<!-- Right Gutter -->
		<div class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>
	</div>

	<Footer />
</div>
