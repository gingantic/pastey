<script lang="ts">
	import { navigating } from '$app/stores';

	let progress = $state(0);
	let visible = $state(false);
	let active = $state(false);

	$effect(() => {
		const isNavigating = !!$navigating;
		let interval: any;

		if (isNavigating) {
			active = true;
			visible = true;
			progress = 0;
			interval = setInterval(() => {
				if (progress < 90) {
					// Gradually slow down progress increments as it approaches 90%
					progress += (90 - progress) * 0.15;
				}
			}, 100);
		} else {
			if (active) {
				progress = 100;
				active = false;
				const timeout = setTimeout(() => {
					if (!active) {
						visible = false;
						progress = 0;
					}
				}, 300);
				return () => clearTimeout(timeout);
			}
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	});
</script>

{#if visible}
	<div
		class="fixed top-0 left-0 right-0 h-[3px] bg-white transition-all duration-300 ease-out z-[99999]"
		style="width: {progress}%; opacity: {active ? 1 : 0}; box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);"
	></div>
{/if}
