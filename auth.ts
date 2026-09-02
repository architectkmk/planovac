import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Seznam povolených e-mailů z proměnné prostředí, malými písmeny. */
function povoleneEmaily(): string[] {
	return (process.env.POVOLENE_EMAILY ?? "")
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}

/**
 * Přihlásit se smí jen člověk z firemní domény (POVOLENA_DOMENA) nebo z výslovně
 * povolených e-mailů (POVOLENE_EMAILY). Když není nastavené ani jedno, appka
 * nepustí dovnitř nikoho — je to bezpečnější než pustit celý internet.
 */
export function maPristup(email: string | null | undefined): boolean {
	if (!email) return false;

	const adresa = email.toLowerCase();
	const domena = (process.env.POVOLENA_DOMENA ?? "").trim().toLowerCase();

	if (domena && adresa.endsWith(`@${domena}`)) return true;

	return povoleneEmaily().includes(adresa);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [Google],
	trustHost: true,
	pages: {
		signIn: "/prihlaseni",
		error: "/prihlaseni",
	},
	callbacks: {
		signIn({ profile }) {
			// Google u neověřeného e-mailu vrací email_verified: false.
			if (profile && profile.email_verified === false) return false;

			return maPristup(profile?.email);
		},
	},
});
