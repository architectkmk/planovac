export const DNY = [
	"Pondělí",
	"Úterý",
	"Středa",
	"Čtvrtek",
	"Pátek",
	"Sobota",
	"Neděle",
];

/** Datum jako "YYYY-MM-DD" v místním čase (ne UTC, aby se nepřeskakoval den). */
export function naDatumString(datum: Date): string {
	const rok = datum.getFullYear();
	const mesic = String(datum.getMonth() + 1).padStart(2, "0");
	const den = String(datum.getDate()).padStart(2, "0");
	return `${rok}-${mesic}-${den}`;
}

export function dnesniDatum(): string {
	return naDatumString(new Date());
}

/** Aktuální měsíc jako "YYYY-MM". */
export function mesicZDatumu(datum: string): string {
	return datum.slice(0, 7);
}

/** Pondělí týdne, do kterého spadá zadané datum. */
export function pondeliTydne(datum: string): Date {
	const d = new Date(`${datum}T00:00:00`);
	const denVTydnu = d.getDay(); // 0 = neděle
	const posun = denVTydnu === 0 ? -6 : 1 - denVTydnu;
	d.setDate(d.getDate() + posun);
	return d;
}

/** Sedm dní (Po–Ne) týdne, do kterého spadá zadané datum. */
export function tydenProDatum(datum: string): { den: string; datum: string }[] {
	const pondeli = pondeliTydne(datum);

	return DNY.map((den, i) => {
		const d = new Date(pondeli);
		d.setDate(pondeli.getDate() + i);
		return { den, datum: naDatumString(d) };
	});
}

/** Název dne v týdnu pro dané datum, např. "středa". */
export function nazevDne(datum: string): string {
	return new Date(`${datum}T00:00:00`).toLocaleDateString("cs-CZ", {
		weekday: "long",
	});
}

/** Datum ve formátu "1. 3. 2026". */
export function formatujDatum(datum: string): string {
	return new Date(`${datum}T00:00:00`).toLocaleDateString("cs-CZ");
}

/** Všechna data od–do včetně, vzestupně. Rozsah je omezený na 400 dní. */
export function dnyVRozsahu(od: string, doData: string): string[] {
	const dny: string[] = [];
	const konec = new Date(`${doData}T00:00:00`);
	const d = new Date(`${od}T00:00:00`);

	while (d <= konec && dny.length < 400) {
		dny.push(naDatumString(d));
		d.setDate(d.getDate() + 1);
	}

	return dny;
}
