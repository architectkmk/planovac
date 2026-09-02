/** Převede "HH:MM" na počet minut. Prázdný nebo neplatný vstup = 0. */
export function casNaMinuty(cas: string | undefined | null): number {
	if (!cas || !cas.includes(":")) return 0;
	const [h, m] = cas.split(":").map(Number);
	if (Number.isNaN(h) || Number.isNaN(m)) return 0;
	return h * 60 + m;
}

/** Převede minuty na "HH:MM". Záporné hodnoty vrací jako "00:00". */
export function minutyNaCas(minuty: number): string {
	if (!Number.isFinite(minuty) || minuty <= 0) return "00:00";
	const h = Math.floor(minuty / 60);
	const m = Math.round(minuty % 60);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type Dochazka = {
	prichod: string;
	odchod: string;
	pauza: string;
	prescas: string;
};

/**
 * Odpracované minuty za jednu směnu: (odchod - příchod) - pauza + přesčas.
 * Když chybí příchod nebo odchod, vrací 0.
 */
export function odpracovaneMinuty(d: Partial<Dochazka>): number {
	const prichod = casNaMinuty(d.prichod);
	const odchod = casNaMinuty(d.odchod);
	if (!prichod || !odchod || odchod <= prichod) return 0;

	const minuty = odchod - prichod - casNaMinuty(d.pauza) + casNaMinuty(d.prescas);
	return minuty > 0 ? minuty : 0;
}

/** Odpracovaný čas jedné směny jako "HH:MM". */
export function odpracovano(d: Partial<Dochazka>): string {
	return minutyNaCas(odpracovaneMinuty(d));
}
