"use client";

import { useEffect, useRef, useState } from "react";
import { odpracovano } from "@/lib/cas";
import { chybovaHlaska, pozadavek } from "@/lib/klient";
import Stav, { type StavUlozeni } from "./Stav";
import type { ZaznamDochazky } from "@/lib/typy";

const PRAZDNE = { prichod: "", odchod: "", pauza: "", prescas: "" };

const POLE = [
	{ klic: "prichod", popisek: "Příchod" },
	{ klic: "odchod", popisek: "Odchod" },
	{ klic: "pauza", popisek: "Pauza" },
	{ klic: "prescas", popisek: "Přesčas" },
] as const;

export default function Dochazka({
	datum,
	poUlozeni,
}: {
	datum: string;
	poUlozeni: () => void;
}) {
	const [data, setData] = useState(PRAZDNE);
	const [stav, setStav] = useState<StavUlozeni>({ typ: "necinny" });

	// Poslední uložený stav, aby se při opuštění nezměněného pole nic nezapisovalo.
	const ulozeno = useRef(JSON.stringify(PRAZDNE));

	useEffect(() => {
		let aktualni = true;
		setStav({ typ: "nacitam" });
		setData(PRAZDNE);

		pozadavek<ZaznamDochazky>(`/api/dochazka?datum=${datum}`)
			.then((zaznam) => {
				if (!aktualni) return;

				const nactene = {
					prichod: zaznam.prichod ?? "",
					odchod: zaznam.odchod ?? "",
					pauza: zaznam.pauza ?? "",
					prescas: zaznam.prescas ?? "",
				};

				setData(nactene);
				ulozeno.current = JSON.stringify(nactene);
				setStav({ typ: "necinny" });
			})
			.catch((err) => {
				if (aktualni) setStav({ typ: "chyba", zprava: chybovaHlaska(err) });
			});

		return () => {
			aktualni = false;
		};
	}, [datum]);

	const uloz = async () => {
		const snimek = JSON.stringify(data);
		if (snimek === ulozeno.current) return;

		setStav({ typ: "ukladam" });

		try {
			await pozadavek("/api/dochazka", {
				method: "POST",
				body: JSON.stringify({ datum, ...data }),
			});

			ulozeno.current = snimek;
			setStav({ typ: "ulozeno" });
			poUlozeni();
		} catch (err) {
			setStav({ typ: "chyba", zprava: chybovaHlaska(err) });
		}
	};

	const nacita = stav.typ === "nacitam";

	return (
		<section className="karta">
			<div className="karta__zahlavi">
				<h2>Docházka</h2>
			</div>

			<div className="mrizka-dochazka">
				{POLE.map(({ klic, popisek }) => (
					<div className="pole" key={klic}>
						<label htmlFor={`dochazka-${klic}`}>{popisek}</label>
						<input
							id={`dochazka-${klic}`}
							className="vstup"
							type="time"
							value={data[klic]}
							disabled={nacita}
							onChange={(e) =>
								setData((prev) => ({ ...prev, [klic]: e.target.value }))
							}
							onBlur={uloz}
						/>
					</div>
				))}

				<div className="pole">
					<span>Odpracováno</span>
					<p className="hodnota">{odpracovano(data)}</p>
				</div>
			</div>

			<Stav stav={stav} />
		</section>
	);
}
