<script lang="ts">
	import { auth } from '$lib/authStore.svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { Eye, EyeOff, Lock, Mail, ArrowRight, Check } from '@lucide/svelte';

	let emailOrUsername = $state('');
	let password = $state('');
	let showPassword = $state(false);
	
	let errorMsg = $state('');
	let isSubmitting = $state(false);

	let showToast = $state(false);
	let toastMsg = $state('');

	function triggerToast(msg: string) {
		toastMsg = msg;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMsg = '';

		if (!emailOrUsername.trim()) {
			errorMsg = 'Please enter your email or username.';
			return;
		}

		if (!password) {
			errorMsg = 'Please enter your password.';
			return;
		}

		isSubmitting = true;

		const res = await auth.login(emailOrUsername, password);
		isSubmitting = false;

		if (res.success) {
			triggerToast('Welcome back! Logging you in...');
			setTimeout(() => {
				goto('/');
			}, 1000);
		} else {
			errorMsg = res.message;
		}
	}
</script>

<svelte:head>
	<title>Login — Pastey</title>
	<meta name="description" content="Login to your Pastey account to manage code snippets." />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none"
	></div>

	<Header subtitle="Login" tag="// gettin bro">
		<a
			href="/"
			class="px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white"
		>
			New Paste
		</a>
		<a
			href="/signup"
			class="px-4 py-2 rounded-lg transition-colors border bg-brand-accent text-text-secondary border-border-dim hover:text-white"
		>
			Sign Up
		</a>
	</Header>

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 py-12 flex items-center justify-center min-w-0">
			<div class="w-full max-w-md animate-fade-in">
				<!-- Glassmorphic Login Card -->
				<div class="bg-brand-surface/60 backdrop-blur-xl border border-border-dim rounded-[2rem] p-8 md:p-10 shadow-glass relative overflow-hidden">
					<!-- Glow Accent Inside Card -->
					<div class="absolute -top-12 -right-12 w-24 h-24 bg-white/[0.03] rounded-full blur-2xl"></div>

					<div class="mb-8 text-center sm:text-left">
						<h2 class="text-2xl font-bold font-mono tracking-tight text-white mb-2">// Welcome Back</h2>
						<p class="text-xs text-text-muted font-mono">Sign in to manage and customize your code snippets.</p>
					</div>

					<form onsubmit={handleSubmit} class="space-y-6">
						{#if errorMsg}
							<div class="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
								<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
								<span>{errorMsg}</span>
							</div>
						{/if}

						<div class="space-y-4">
							<Input
								label="// Username or Email"
								placeholder="you@domain.com or username"
								type="text"
								bind:value={emailOrUsername}
								required
								disabled={isSubmitting}
							/>

							<Input
								label="// Password"
								placeholder="••••••••••••"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								required
								disabled={isSubmitting}
							>
								{#snippet iconRight()}
									<button
										type="button"
										class="text-text-muted hover:text-white transition-colors flex items-center justify-center"
										onclick={() => (showPassword = !showPassword)}
										aria-label="Toggle password visibility"
									>
										{#if showPassword}
											<EyeOff size={16} />
										{:else}
											<Eye size={16} />
										{/if}
									</button>
								{/snippet}
							</Input>
						</div>

						<div class="pt-2">
							<Button
								type="submit"
								variant="primary"
								class="w-full font-bold text-xs py-3.5 tracking-wider uppercase flex items-center justify-center gap-2"
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<span>Authenticating...</span>
								{:else}
									<span class="flex items-center gap-2">
										Sign In <ArrowRight size={14} />
									</span>
								{/if}
							</Button>
						</div>
					</form>

					<div class="mt-8 pt-6 border-t border-border-dim flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
						<span class="text-text-muted">New to Pastey?</span>
						<a href="/signup" class="text-white hover:underline flex items-center gap-1">
							Create account <ArrowRight size={12} />
						</a>
					</div>
				</div>
			</div>
		</main>

		<!-- Right Gutter -->
		<div class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>
	</div>

	<Footer />

	<!-- Toast Notification -->
	{#if showToast}
		<div
			class="fixed bottom-6 right-6 bg-white text-black font-mono text-xs font-bold px-6 py-4 rounded-xl shadow-glass flex items-center gap-3 border border-white/20 animate-fade-in z-50"
		>
			<Check size={14} />
			<span>{toastMsg}</span>
		</div>
	{/if}
</div>
