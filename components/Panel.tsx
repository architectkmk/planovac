"use client";

import { useEffect, useState } from "react";
import { dnesniDatum, formatujDatum, nazevDne } from "@/lib/datum";
import Dochazka from "./Dochazka";
import Mesic from "./Mesic";
import Tyden from "./Tyden";
import Ukoly from "./Ukoly";

export default function Panel() {
	// Datum se nastavuje až v prohlížeči, aby se řídilo časovou zónou uživatele
	// a ne serverem na Vercelu (ten běží v UTC).
	const [datum, setDatum] = useState<string | null>(null);
	const [verze, setVerze] = useState(0);

	useEffect(() => setDatum(dnesniDatum()), []);

	if (!datum) return <p className="prazdno">Načítám…</p>;

	return (
		<>
			<Tyden datum={datum} nastavDatum={setDatum} />

			<p style={{ fontWeight: 600 }}>
				{nazevDne(datum)} {formatujDatum(datum)}
			</p>

			<Dochazka datum={datum} poUlozeni={() => setVerze((v) => v + 1)} />
			<Ukoly datum={datum} />
			<Mesic datum={datum} verze={verze} />
		</>
	);
}
