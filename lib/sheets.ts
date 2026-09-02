import { JWT } from "google-auth-library";
import {
	GoogleSpreadsheet,
	type GoogleSpreadsheetRow,
	type GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { minutyNaCas, odpracovaneMinuty } from "./cas";
import type { Ukol, ZaznamDochazky } from "./typy";

const LIST_DOCHAZKA = "Dochazka";
const LIST_UKOLY = "Ukoly";

const HLAVICKA_DOCHAZKA = [
	"email",
	"jmeno",
	"datum",
	"prichod",
	"odchod",
	"pauza",
	"prescas",
	"odpracovano",
	"minuty",
	"aktualizovano",
];

const HLAVICKA_UKOLY = [
	"email",
	"jmeno",
	"datum",
	"ukol",
	"cas",
	"aktualizovano",
];

export type { Ukol, ZaznamDochazky } from "./typy";

function promenna(nazev: string): string {
	const hodnota = process.env[nazev];
	if (!hodnota) {
		throw new Error(
			`Chybí proměnná prostředí ${nazev}. Doplňte ji do .env.local (lokálně) nebo do nastavení projektu na Vercelu.`,
		);
	}
	return hodnota;
}

/**
 * Tabulka se drží v modulu, aby se při opakovaném volání "teplé" serverless
 * funkce nemusela znovu načítat struktura dokumentu.
 */
let tabulka: Promise<GoogleSpreadsheet> | null = null;

function nactiTabulku(): Promise<GoogleSpreadsheet> {
	tabulka ??= otevriTabulku();
	return tabulka;
}

/**
 * Privátní klíč servisního účtu jde vložit dvěma způsoby a oba musí fungovat:
 * na jeden řádek se sekvencemi \n (tak je zapsaný ve staženém JSONu), nebo
 * rovnou víceřádkově (tak ho člověk běžně vloží do Vercelu). Občas se k němu
 * přilepí i uvozovky, proto je taky odstraníme.
 */
function privatniKlic(): string {
	let klic = promenna("GOOGLE_PRIVATE_KEY").trim();

	const prvni = klic[0];
	if ((prvni === '"' || prvni === "'") && klic.endsWith(prvni)) {
		klic = klic.slice(1, -1);
	}

	return klic.replace(/\\n/g, "\n");
}

async function otevriTabulku(): Promise<GoogleSpreadsheet> {
	const auth = new JWT({
		email: promenna("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
		key: privatniKlic(),
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});

	const doc = new GoogleSpreadsheet(promenna("SHEET_ID"), auth);

	try {
		await doc.loadInfo();
	} catch (err) {
		tabulka = null; // ať se příští požadavek zkusí připojit znovu
		throw err;
	}

	return doc;
}

/** Vrátí list a případně ho i s hlavičkou založí, pokud v tabulce chybí. */
async function nactiList(
	nazev: string,
	hlavicka: string[],
): Promise<GoogleSpreadsheetWorksheet> {
	const doc = await nactiTabulku();
	const existujici = doc.sheetsByTitle[nazev];

	if (existujici) {
		if (!existujici.headerValues?.length) {
			await existujici.setHeaderRow(hlavicka);
		}
		return existujici;
	}

	try {
		return await doc.addSheet({ title: nazev, headerValues: hlavicka });
	} catch (err) {
		// List mezitím mohl založit jiný požadavek — načteme strukturu znovu.
		await doc.loadInfo();
		const vznikly = doc.sheetsByTitle[nazev];
		if (vznikly) return vznikly;
		throw err;
	}
}

function ted(): string {
	return new Date().toISOString();
}

// --- Docházka -------------------------------------------------------------

function naZaznam(radek: GoogleSpreadsheetRow): ZaznamDochazky {
	return {
		datum: String(radek.get("datum") ?? ""),
		prichod: String(radek.get("prichod") ?? ""),
		odchod: String(radek.get("odchod") ?? ""),
		pauza: String(radek.get("pauza") ?? ""),
		prescas: String(radek.get("prescas") ?? ""),
	};
}

const prazdnaDochazka = (datum: string): ZaznamDochazky => ({
	datum,
	prichod: "",
	odchod: "",
	pauza: "",
	prescas: "",
});

export async function nactiDochazku(
	email: string,
	datum: string,
): Promise<ZaznamDochazky> {
	const list = await nactiList(LIST_DOCHAZKA, HLAVICKA_DOCHAZKA);
	const radky = await list.getRows();

	const radek = radky.find(
		(r) => r.get("email") === email && r.get("datum") === datum,
	);

	return radek ? naZaznam(radek) : prazdnaDochazka(datum);
}

export async function nactiDochazkuRozsah(
	email: string,
	od: string,
	doData: string,
): Promise<ZaznamDochazky[]> {
	const list = await nactiList(LIST_DOCHAZKA, HLAVICKA_DOCHAZKA);
	const radky = await list.getRows();

	return radky
		.filter((r) => {
			const datum = String(r.get("datum") ?? "");
			return r.get("email") === email && datum >= od && datum <= doData;
		})
		.map(naZaznam)
		.sort((a, b) => a.datum.localeCompare(b.datum));
}

export async function ulozDochazku(
	email: string,
	jmeno: string,
	zaznam: ZaznamDochazky,
): Promise<ZaznamDochazky> {
	const list = await nactiList(LIST_DOCHAZKA, HLAVICKA_DOCHAZKA);
	const radky = await list.getRows();

	const minuty = odpracovaneMinuty(zaznam);
	const hodnoty = {
		email,
		jmeno,
		datum: zaznam.datum,
		prichod: zaznam.prichod,
		odchod: zaznam.odchod,
		pauza: zaznam.pauza,
		prescas: zaznam.prescas,
		odpracovano: minutyNaCas(minuty),
		minuty: String(minuty),
		aktualizovano: ted(),
	};

	const radek = radky.find(
		(r) => r.get("email") === email && r.get("datum") === zaznam.datum,
	);

	if (radek) {
		radek.assign(hodnoty);
		await radek.save();
	} else {
		await list.addRow(hodnoty);
	}

	return zaznam;
}

// --- Úkoly ----------------------------------------------------------------

export async function nactiUkoly(
	email: string,
	datum: string,
): Promise<Ukol[]> {
	const list = await nactiList(LIST_UKOLY, HLAVICKA_UKOLY);
	const radky = await list.getRows();

	return radky
		.filter((r) => r.get("email") === email && r.get("datum") === datum)
		.map((r) => ({
			ukol: String(r.get("ukol") ?? ""),
			cas: String(r.get("cas") ?? ""),
		}));
}

export async function nactiUkolyRozsah(
	email: string,
	od: string,
	doData: string,
): Promise<Record<string, Ukol[]>> {
	const list = await nactiList(LIST_UKOLY, HLAVICKA_UKOLY);
	const radky = await list.getRows();

	const podleDne: Record<string, Ukol[]> = {};

	for (const r of radky) {
		const datum = String(r.get("datum") ?? "");
		if (r.get("email") !== email || datum < od || datum > doData) continue;

		podleDne[datum] ??= [];
		podleDne[datum].push({
			ukol: String(r.get("ukol") ?? ""),
			cas: String(r.get("cas") ?? ""),
		});
	}

	return podleDne;
}

/**
 * Přepíše úkoly daného člověka pro jeden den. Existující řádky se pokud možno
 * jen upraví, přebytečné se smažou (odspodu, aby se neposouvaly indexy) a
 * chybějící se přidají jedním voláním navíc.
 */
export async function ulozUkoly(
	email: string,
	jmeno: string,
	datum: string,
	ukoly: Ukol[],
): Promise<Ukol[]> {
	const list = await nactiList(LIST_UKOLY, HLAVICKA_UKOLY);
	const radky = await list.getRows();

	const ciste = ukoly
		.map((u) => ({ ukol: (u.ukol ?? "").trim(), cas: u.cas ?? "" }))
		.filter((u) => u.ukol !== "");

	const existujici = radky
		.filter((r) => r.get("email") === email && r.get("datum") === datum)
		.sort((a, b) => a.rowNumber - b.rowNumber);

	const cas = ted();

	// 1. přepsat řádky, které už v tabulce jsou
	const prepsat = Math.min(existujici.length, ciste.length);
	for (let i = 0; i < prepsat; i++) {
		const radek = existujici[i];
		const novy = ciste[i];

		const stavajici = {
			ukol: String(radek.get("ukol") ?? ""),
			cas: String(radek.get("cas") ?? ""),
		};

		if (stavajici.ukol === novy.ukol && stavajici.cas === novy.cas) {
			continue; // beze změny, není co ukládat
		}

		radek.assign({ ...novy, jmeno, aktualizovano: cas });
		await radek.save();
	}

	// 2. smazat přebytečné (odspodu nahoru)
	for (let i = existujici.length - 1; i >= ciste.length; i--) {
		await existujici[i].delete();
	}

	// 3. přidat nové
	if (ciste.length > existujici.length) {
		const nove = ciste.slice(existujici.length).map((u) => ({
			email,
			jmeno,
			datum,
			ukol: u.ukol,
			cas: u.cas,
			aktualizovano: cas,
		}));
		await list.addRows(nove);
	}

	return ciste;
}
