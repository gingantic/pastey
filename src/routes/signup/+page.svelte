<script lang="ts">
	import { auth } from '$lib/authStore.svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Check } from '@lucide/svelte';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

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

	function validateEmail(e: string) {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(e);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMsg = '';

		// Validation
		if (username.trim().length < 3) {
			errorMsg = 'Username must be at least 3 characters.';
			return;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
			errorMsg = 'Username can only contain letters, numbers, and underscores.';
			return;
		}

		if (!validateEmail(email.trim())) {
			errorMsg = 'Please enter a valid email address.';
			return;
		}

		if (password.length < 6) {
			errorMsg = 'Password must be at least 6 characters.';
			return;
		}

		if (password !== confirmPassword) {
			errorMsg = 'Passwords do not match.';
			return;
		}

		isSubmitting = true;

		// Small delay to simulate signup logic
		setTimeout(() => {
			const res = auth.signup(username.trim(), email.trim(), password);
			isSubmitting = false;

			if (res.success) {
				triggerToast('Account created successfully! Logging you in...');
				setTimeout(() => {
					goto('/');
				}, 1000);
			} else {
				errorMsg = res.message;
			}
		}, 600);
	}
</script>

<svelte:head>
	<title>Sign Up — Pastey</title>
	<meta name="description" content="Create an account on Pastey to manage your private and unlisted pastes." />
</svelte:head>

<div
	class="min-h-screen bg-brand-bg text-text-primary selection:bg-white/20 selection:text-white relative overflow-hidden font-sans flex flex-col"
>
	<!-- Neon Glow Decor -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none"
	></div>

	<Header subtitle="signup" tag="// making an account" />

	<!-- ── CONTENT ROW ─────────────────────────────────────────────────────── -->
	<div class="w-full flex flex-1 relative z-10">
		<!-- Left Gutter -->
		<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

		<!-- Main content -->
		<main class="w-full max-w-6xl px-6 py-12 flex items-center justify-center min-w-0">
			<div class="w-full max-w-md animate-fade-in">
				<!-- Glassmorphic Signup Card -->
				<div class="bg-brand-surface/60 backdrop-blur-xl border border-border-dim rounded-[2rem] p-8 md:p-10 shadow-glass relative overflow-hidden">
					<!-- Glow Accent Inside Card -->
					<div class="absolute -top-12 -right-12 w-24 h-24 bg-white/[0.03] rounded-full blur-2xl"></div>

					<div class="mb-8 text-center sm:text-left">
						<h2 class="text-2xl font-bold font-mono tracking-tight text-white mb-2">// Create Account</h2>
						<p class="text-xs text-text-muted font-mono">Join Pastey to keep track of your snippets and paste privately.</p>
					</div>

					<form onsubmit={handleSubmit} class="space-y-5">
						{#if errorMsg}
							<div class="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
								<span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
								<span>{errorMsg}</span>
							</div>
						{/if}

						<div class="space-y-4">
							<Input
								label="// Username"
								placeholder="developer_name"
								type="text"
								bind:value={username}
								required
								disabled={isSubmitting}
							/>

							<Input
								label="// Email Address"
								placeholder="you@domain.com"
								type="email"
								bind:value={email}
								required
								disabled={isSubmitting}
							/>

							<div class="relative">
								<Input
									label="// Password (min. 6 characters)"
									placeholder="••••••••••••"
									type={showPassword ? 'text' : 'password'}
									bind:value={password}
									required
									disabled={isSubmitting}
								/>
								<button
									type="button"
									class="absolute right-4 bottom-3 text-text-muted hover:text-white transition-colors"
									onclick={() => (showPassword = !showPassword)}
									aria-label="Toggle password visibility"
								>
									{#if showPassword}
										<EyeOff size={16} />
									{:else}
										<Eye size={16} />
									{/if}
								</button>
							</div>

							<Input
								label="// Confirm Password"
								placeholder="••••••••••••"
								type={showPassword ? 'text' : 'password'}
								bind:value={confirmPassword}
								required
								disabled={isSubmitting}
							/>
						</div>

						<div class="pt-2">
							<Button
								type="submit"
								variant="primary"
								class="w-full font-bold text-xs py-3.5 tracking-wider uppercase flex items-center justify-center gap-2"
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<span>Creating Account...</span>
								{:else}
									<span class="flex items-center gap-2">
										Register <ArrowRight size={14} />
									</span>
								{/if}
							</Button>
						</div>
					</form>

					<div class="mt-8 pt-6 border-t border-border-dim flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
						<span class="text-text-muted">Already have an account?</span>
						<a href="/login" class="text-white hover:underline flex items-center gap-1">
							Sign In <ArrowRight size={12} />
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
