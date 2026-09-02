import { NextResponse } from "next/server";
import { auth, maPristup } from "@/auth";

export type Uzivatel = { email: string; jmeno: string };

/** Vrátí přihlášeného uživatele, nebo null když session chybí či ztratila přístup. */
export async function prihlasenyUzivatel(): Promise<Uzivatel | null> {
	const session = await auth();
	const email = session?.user?.email;

	if (!email || !maPristup(email)) return null;

	return { email, jmeno: session?.user?.name ?? email };
}

export const neprihlasen = () =>
	NextResponse.json({ chyba: "Nejste přihlášen/a." }, { status: 401 });

export const spatnyPozadavek = (zprava: string) =>
	NextResponse.json({ chyba: zprava }, { status: 400 });

export function chybaServeru(err: unknown) {
	console.error(err);
	const zprava =
		err instanceof Error ? err.message : "Neznámá chyba na serveru.";
	return NextResponse.json({ chyba: zprava }, { status: 500 });
}

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const MESIC = /^\d{4}-\d{2}$/;
const CAS = /^\d{1,2}:\d{2}$/;

export const jeDatum = (h: unknown): h is string =>
	typeof h === "string" && DATUM.test(h);

export const jeMesic = (h: unknown): h is string =>
	typeof h === "string" && MESIC.test(h);

/** Očistí čas na "HH:MM"; cokoli jiného než platný čas se uloží jako prázdné. */
export function ocistiCas(hodnota: unknown): string {
	if (typeof hodnota !== "string") return "";
	const cas = hodnota.trim();
	return CAS.test(cas) ? cas : "";
}
