import { NextResponse, type NextRequest } from "next/server";
import {
	chybaServeru,
	jeDatum,
	neprihlasen,
	prihlasenyUzivatel,
	spatnyPozadavek,
} from "@/lib/api";
import { minutyNaCas, odpracovaneMinuty } from "@/lib/cas";
import { nactiDochazkuRozsah, nactiUkolyRozsah } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/** Podklady pro export: dny s docházkou a úkoly v zadaném rozsahu. */
export async function GET(req: NextRequest) {
	const uzivatel = await prihlasenyUzivatel();
	if (!uzivatel) return neprihlasen();

	const od = req.nextUrl.searchParams.get("od");
	const doData = req.nextUrl.searchParams.get("do");

	if (!jeDatum(od) || !jeDatum(doData)) {
		return spatnyPozadavek("Vyberte prosím datum od a do.");
	}
	if (od > doData) {
		return spatnyPozadavek("Datum od musí být dřív než datum do.");
	}

	try {
		const [dochazka, ukolyPodleDne] = await Promise.all([
			nactiDochazkuRozsah(uzivatel.email, od, doData),
			nactiUkolyRozsah(uzivatel.email, od, doData),
		]);

		// Do exportu jdou dny, kde je zapsaná docházka nebo aspoň jeden úkol.
		const vsechnaData = new Set([
			...dochazka.map((z) => z.datum),
			...Object.keys(ukolyPodleDne),
		]);

		const dny = [...vsechnaData]
			.sort((a, b) => a.localeCompare(b))
			.map((datum) => {
				const zaznam = dochazka.find((z) => z.datum === datum) ?? {
					datum,
					prichod: "",
					odchod: "",
					pauza: "",
					prescas: "",
				};

				return {
					datum,
					dochazka: zaznam,
					odpracovano: minutyNaCas(odpracovaneMinuty(zaznam)),
					ukoly: ukolyPodleDne[datum] ?? [],
				};
			});

		const minuty = dochazka.reduce((soucet, z) => soucet + odpracovaneMinuty(z), 0);

		return NextResponse.json({
			od,
			do: doData,
			jmeno: uzivatel.jmeno,
			dny,
			celkem: minutyNaCas(minuty),
		});
	} catch (err) {
		return chybaServeru(err);
	}
}
