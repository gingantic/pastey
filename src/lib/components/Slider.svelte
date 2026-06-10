<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	interface Slide {
		image: string;
		title: string;
		description: string;
		link?: string;
		linkText?: string;
	}

	interface Props {
		slides: Slide[];
		autoplay?: boolean;
		autoplayInterval?: number;
		class?: string;
	}

	let {
		slides = [],
		autoplay = false,
		autoplayInterval = 5000,
		class: customClass = ''
	}: Props = $props();

	let currentIndex = $state(0);
	let intervalId: any = null;

	function nextSlide() {
		currentIndex = (currentIndex + 1) % slides.length;
	}

	function prevSlide() {
		currentIndex = (currentIndex - 1 + slides.length) % slides.length;
	}

	function goToSlide(index: number) {
		currentIndex = index;
		resetAutoplay();
	}

	function startAutoplay() {
		if (autoplay && slides.length > 1) {
			intervalId = setInterval(nextSlide, autoplayInterval);
		}
	}

	function resetAutoplay() {
		if (intervalId) {
			clearInterval(intervalId);
			startAutoplay();
		}
	}

	onMount(() => {
		startAutoplay();
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});
</script>

<div class="w-full {customClass}">
	{#if slides.length > 0}
		<!-- Slide Wrapper -->
		<div
			class="relative h-64 lg:h-[450px] w-full rounded-3xl overflow-hidden bg-brand-card border border-border-dim group cursor-pointer select-none"
		>
			{#each slides as slide, index}
				<div
					class="absolute inset-0 transition-all duration-500 ease-in-out
						{index === currentIndex
						? 'opacity-100 z-10 pointer-events-auto'
						: 'opacity-0 z-0 pointer-events-none'}"
				>
					<img
						src={slide.image}
						alt={slide.title}
						class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[1500ms]"
					/>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
					></div>
					<div class="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 z-20">
						<h3
							class="font-mono text-xl md:text-3xl lg:text-4xl font-bold mb-4 text-white leading-tight"
						>
							{slide.title}
						</h3>
						<p
							class="text-xs md:text-sm text-text-secondary mb-6 line-clamp-2 opacity-90 font-sans"
						>
							{slide.description}
						</p>
						<div class="flex gap-3">
							{#if slide.link}
								<a
									href={slide.link}
									class="bg-white text-black px-6 py-2 rounded-full text-xs font-bold font-mono hover:bg-gray-200 transition-colors inline-block"
								>
									{slide.linkText || 'Read more'}
								</a>
							{/if}
							<button
								onclick={(e) => {
									e.stopPropagation();
									nextSlide();
								}}
								class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:text-black transition-all text-white"
								aria-label="Next slide"
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
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Controls & Dots -->
		<div class="flex items-center justify-between mt-6 px-2">
			<!-- Prev Button -->
			<button
				onclick={prevSlide}
				class="w-10 h-10 rounded-full border border-border-dim flex items-center justify-center text-text-secondary hover:text-black hover:bg-white transition-all duration-300"
				aria-label="Previous slide"
			>
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
			</button>

			<!-- Dots Indicators -->
			<div class="flex gap-2">
				{#each slides as _, index}
					<button
						onclick={() => goToSlide(index)}
						class="h-2 rounded-full transition-all duration-300
							{index === currentIndex ? 'bg-white w-4' : 'bg-white/20 w-2 hover:bg-white/40'}"
						aria-label="Go to slide {index + 1}"
					></button>
				{/each}
			</div>

			<!-- Next Button -->
			<button
				onclick={nextSlide}
				class="w-10 h-10 rounded-full border border-border-dim flex items-center justify-center text-text-secondary hover:text-black hover:bg-white transition-all duration-300"
				aria-label="Next slide"
			>
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
					<path d="m9 18 6-6-6-6"></path>
				</svg>
			</button>
		</div>
	{/if}
</div>
