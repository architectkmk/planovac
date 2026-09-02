/**
 * Sdílené typy. Jsou schválně mimo lib/sheets.ts, aby si je mohly komponenty
 * v prohlížeči importovat bez rizika, že s sebou přitáhnou serverový kód.
 */

export type ZaznamDochazky = {
	datum: string;
	prichod: string;
	odchod: string;
	pauza: string;
	prescas: string;
};

export type Ukol = {
	ukol: string;
	cas: string;
};

export type DenExportu = {
	datum: string;
	dochazka: ZaznamDochazky;
	odpracovano: string;
	ukoly: Ukol[];
};
