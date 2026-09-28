import type { RequestEvent } from '@sveltejs/kit';

// Headers set by common reverse proxies / hosting platforms, in priority order.
// Vercel and most CDNs populate `x-forwarded-for`; Vercel also sets
// `x-real-ip`, Cloudflare uses `cf-connecting-ip`, Fastly uses
// `fastly-client-ip`, and some setups use `true-client-ip`.
const IP_HEADERS = [
	'cf-connecting-ip',
	'true-client-ip',
	'fastly-client-ip',
	'x-real-ip',
	'x-forwarded-for'
];

// Extracts the originating client IP from a SvelteKit request event.
//
// Works behind Vercel and other proxy/CDN hosting by trusting the standard
// forwarding headers, and falls back to SvelteKit's own getClientAddress()
// for local/direct connections.
export function getClientIp(event: RequestEvent): string {
	const headers = event.request.headers;

	for (const name of IP_HEADERS) {
		const value = headers.get(name);
		if (!value) {
			continue;
		}

		// `x-forwarded-for` can be a comma-separated chain
		// (client, proxy1, proxy2, ...). The left-most entry is the
		// original client.
		const first = value.split(',')[0]?.trim();
		if (first) {
			return normalizeIp(first);
		}
	}

	try {
		return normalizeIp(event.getClientAddress());
	} catch {
		// getClientAddress() throws if the platform can't determine an address.
		return 'unknown';
	}
}

// Strips an IPv4-mapped IPv6 prefix and a trailing port if present so the
// same client is keyed consistently.
function normalizeIp(ip: string): string {
	let out = ip.trim();

	// IPv4-mapped IPv6: ::ffff:1.2.3.4 -> 1.2.3.4
	if (out.toLowerCase().startsWith('::ffff:')) {
		out = out.slice(7);
	}

	// Strip a port from an IPv4 address like 1.2.3.4:5678 (leave IPv6 intact).
	if (out.includes('.') && out.includes(':')) {
		out = out.split(':')[0];
	}

	return out;
}
