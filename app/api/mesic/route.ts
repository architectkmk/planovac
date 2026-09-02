import { NextResponse, type NextRequest } from "next/server";
import {
	chybaServeru,
	jeMesic,
	neprihlasen,
	prihlasenyUzivatel,
	spatnyPozadavek,
} from "@/lib/api";
import { minutyNaCas, odpracovaneMinuty } from "@/lib/cas";
import { nactiDochazkuRozsah } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const uzivatel = await prihlasenyUzivatel();
	if (!uzivatel) return neprihlasen();

	const mesic = req.nextUrl.searchParams.get("mesic");
	if (!jeMesic(mesic)) return spatnyPozadavek("Chybí nebo je neplatný měsíc.");

	try {
		const zaznamy = await nactiDochazkuRozsah(
			uzivatel.email,
			`${mesic}-01`,
			`${mesic}-31`,
		);

		const minuty = zaznamy.reduce((soucet, z) => soucet + odpracovaneMinuty(z), 0);
		const odpracovaneDny = zaznamy.filter((z) => odpracovaneMinuty(z) > 0).length;

		return NextResponse.json({
			mesic,
			celkem: minutyNaCas(minuty),
			minuty,
			dny: odpracovaneDny,
		});
	} catch (err) {
		return chybaServeru(err);
	}
}
