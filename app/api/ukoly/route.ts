import { NextResponse, type NextRequest } from "next/server";
import {
	chybaServeru,
	jeDatum,
	neprihlasen,
	ocistiCas,
	prihlasenyUzivatel,
	spatnyPozadavek,
} from "@/lib/api";
import { nactiUkoly, ulozUkoly, type Ukol } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const MAX_UKOLU = 50;

export async function GET(req: NextRequest) {
	const uzivatel = await prihlasenyUzivatel();
	if (!uzivatel) return neprihlasen();

	const datum = req.nextUrl.searchParams.get("datum");
	if (!jeDatum(datum)) return spatnyPozadavek("Chybí nebo je neplatné datum.");

	try {
		return NextResponse.json({ ukoly: await nactiUkoly(uzivatel.email, datum) });
	} catch (err) {
		return chybaServeru(err);
	}
}

export async function PUT(req: NextRequest) {
	const uzivatel = await prihlasenyUzivatel();
	if (!uzivatel) return neprihlasen();

	try {
		const telo = await req.json();
		if (!jeDatum(telo?.datum)) {
			return spatnyPozadavek("Chybí nebo je neplatné datum.");
		}
		if (!Array.isArray(telo?.ukoly)) {
			return spatnyPozadavek("Úkoly musí být pole.");
		}

		const ukoly: Ukol[] = telo.ukoly.slice(0, MAX_UKOLU).map((u: unknown) => {
			const polozka = u as { ukol?: unknown; cas?: unknown };
			return {
				ukol:
					typeof polozka?.ukol === "string" ? polozka.ukol.slice(0, 500) : "",
				cas: ocistiCas(polozka?.cas),
			};
		});

		const ulozene = await ulozUkoly(
			uzivatel.email,
			uzivatel.jmeno,
			telo.datum,
			ukoly,
		);

		return NextResponse.json({ ukoly: ulozene });
	} catch (err) {
		return chybaServeru(err);
	}
}
