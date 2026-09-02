/** Fetch, který z odpovědi vytáhne českou chybovou hlášku z API. */
export async function pozadavek<T>(
	url: string,
	nastaveni?: RequestInit,
): Promise<T> {
	const odpoved = await fetch(url, {
		...nastaveni,
		headers: { "Content-Type": "application/json", ...nastaveni?.headers },
	});

	if (!odpoved.ok) {
		let zprava = `Chyba ${odpoved.status}`;
		try {
			const telo = await odpoved.json();
			if (telo?.chyba) zprava = telo.chyba;
		} catch {
			// odpověď nebyla JSON, zůstane obecná hláška
		}
		throw new Error(zprava);
	}

	return odpoved.json() as Promise<T>;
}

export const chybovaHlaska = (err: unknown) =>
	err instanceof Error ? err.message : "Něco se nepovedlo.";
