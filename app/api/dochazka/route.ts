import { NextResponse, type NextRequest } from "next/server";
import {
	chybaServeru,
	jeDatum,
	neprihlasen,
	ocistiCas,
	prihlasenyUzivatel,
	spatnyPozadavek,
} from "@/lib/api";
import { nactiDochazku, ulozDochazku } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const uzivatel = await prihlasenyUzivatel();
	if (!uzivatel) return neprihlasen();

	const datum = req.nextUrl.searchParams.get("datum");
	if (!jeDatum(datum)) return spatnyPozadavek("Chybí nebo je neplatné datum.");

	try {
		return NextResponse.json(await nactiDochazku(uzivatel.email, datum));
	} catch (err) {
		return chybaServeru(err);
	}
}

export async function POST(req: NextRequest) {
	const uzivatel = await prihlasenyUzivatel();
	if (!uzivatel) return neprihlasen();

	try {
		const telo = await req.json();
		if (!jeDatum(telo?.datum)) {
			return spatnyPozadavek("Chybí nebo je neplatné datum.");
		}

		const zaznam = {
			datum: telo.datum,
			prichod: ocistiCas(telo.prichod),
			odchod: ocistiCas(telo.odchod),
			pauza: ocistiCas(telo.pauza),
			prescas: ocistiCas(telo.prescas),
		};

		await ulozDochazku(uzivatel.email, uzivatel.jmeno, zaznam);
		return NextResponse.json(zaznam);
	} catch (err) {
		return chybaServeru(err);
	}
}
