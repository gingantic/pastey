<script lang="ts">
	interface TimelineItem {
		year: string;
		title: string;
		subtitle?: string;
		details: string;
	}

	interface Props {
		items: TimelineItem[];
		class?: string;
	}

	let { items = [], class: customClass = '' }: Props = $props();
</script>

<div class="space-y-6 relative max-w-3xl mx-auto {customClass}">
	{#if items.length > 0}
		<!-- Timeline Line -->
		<div class="absolute left-[3.5rem] top-2 bottom-2 w-px bg-white/10"></div>

		{#each items as item}
			<div class="flex gap-6 relative group">
				<!-- Year Label -->
				<div
					class="w-12 pt-1 flex flex-col items-end text-[10px] text-text-muted font-mono shrink-0"
				>
					<span class="text-white font-bold transition-colors group-hover:text-white"
						>{item.year}</span
					>
				</div>

				<!-- Content -->
				<div
					class="flex-1 pb-6 border-b border-border-dim group-hover:border-white/20 transition-colors duration-300"
				>
					<h4 class="text-sm font-bold text-text-primary mb-1 tracking-tight">{item.title}</h4>
					{#if item.subtitle}
						<p class="text-[10px] text-text-muted mb-2 font-mono">{item.subtitle}</p>
					{/if}
					<p class="text-xs text-gray-300 font-mono leading-relaxed">{item.details}</p>
				</div>
			</div>
		{/each}
	{/if}
</div>
