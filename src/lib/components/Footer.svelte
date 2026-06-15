<script lang="ts">
	interface Props {
		showBackToPastey?: boolean;
	}

	let { showBackToPastey = false }: Props = $props();
</script>

<div class="w-full flex border-t border-border-dim bg-brand-surface/20 relative z-10">
	<!-- Left Gutter -->
	<div class="flex-1 bg-stripes border-r border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>

	<!-- Footer Content -->
	<footer class="w-full max-w-6xl px-6 py-8 flex flex-col sm:flex-row justify-between items-start gap-6">
		<div class="space-y-1">
			<div class="font-mono text-sm font-bold text-white">
				Pastey. <span class="font-serif italic font-light text-text-secondary text-sm">by rhnx.my.id</span>
			</div>
			<p class="font-mono text-[10px] text-text-muted">
				Minimal code snippet sharing.
			</p>
		</div>
		<div class="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[10px] text-text-muted">
			{#if showBackToPastey}
				<a href="/" class="hover:text-white transition-colors">← Back to Pastey</a>
			{/if}
			<span class="text-text-muted">© {new Date().getFullYear()} rhnx.my.id</span>
		</div>
	</footer>

	<!-- Right Gutter -->
	<div class="flex-1 bg-stripes border-l border-border-dim hidden sm:block min-w-6 md:min-w-12"></div>
</div>
