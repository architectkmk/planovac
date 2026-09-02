"use client";

import { useEffect, useRef, useState } from "react";
import { casNaMinuty, minutyNaCas } from "@/lib/cas";
import { chybovaHlaska, pozadavek } from "@/lib/klient";
import Stav, { type StavUlozeni } from "./Stav";
import type { Ukol } from "@/lib/typy";

export default function Ukoly({ datum }: { datum: string }) {
	const [ukoly, setUkoly] = useState<Ukol[]>([]);
	const [stav, setStav] = useState<StavUlozeni>({ typ: "necinny" });

	const ulozeno = useRef("[]");

	useEffect(() => {
		let aktualni = true;
		setStav({ typ: "nacitam" });
		setUkoly([]);

		pozadavek<{ ukoly: Ukol[] }>(`/api/ukoly?datum=${datum}`)
			.then(({ ukoly: nactene }) => {
				if (!aktualni) return;

				setUkoly(nactene);
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

	const uloz = async (seznam: Ukol[] = ukoly) => {
		// Ořezáváme stejně jako server, aby snímek odpovídal tomu, co se uloží.
		const ciste = seznam
			.map((u) => ({ ukol: u.ukol.trim(), cas: u.cas }))
			.filter((u) => u.ukol !== "");
		const snimek = JSON.stringify(ciste);
		if (snimek === ulozeno.current) return;

		setStav({ typ: "ukladam" });

		try {
			const odpoved = await pozadavek<{ ukoly: Ukol[] }>("/api/ukoly", {
				method: "PUT",
				body: JSON.stringify({ datum, ukoly: ciste }),
			});

			ulozeno.current = JSON.stringify(odpoved.ukoly);
			setStav({ typ: "ulozeno" });
		} catch (err) {
			setStav({ typ: "chyba", zprava: chybovaHlaska(err) });
		}
	};

	const zmen = (index: number, zmena: Partial<Ukol>) => {
		setUkoly((prev) =>
			prev.map((u, i) => (i === index ? { ...u, ...zmena } : u)),
		);
	};

	const smaz = (index: number) => {
		const zbytek = ukoly.filter((_, i) => i !== index);
		setUkoly(zbytek);
		void uloz(zbytek);
	};

	const celkem = minutyNaCas(
		ukoly.reduce((soucet, u) => soucet + casNaMinuty(u.cas), 0),
	);

	const nacita = stav.typ === "nacitam";

	return (
		<section className="karta">
			<div className="karta__zahlavi">
				<h2>Úkoly dne</h2>
				<button
					className="tlacitko"
					type="button"
					disabled={nacita}
					onClick={() => setUkoly((prev) => [...prev, { ukol: "", cas: "" }])}
				>
					Přidat úkol
				</button>
			</div>

			<div className="seznam-ukolu">
				{ukoly.length === 0 && !nacita && (
					<p className="prazdno">
						Zatím tu nic není. Přidejte první úkol tlačítkem vpravo nahoře.
					</p>
				)}

				{ukoly.map((ukol, i) => (
					<div className="radek-ukolu" key={i}>
						<input
							className="vstup"
							type="text"
							placeholder="Popis práce"
							value={ukol.ukol}
							disabled={nacita}
							onChange={(e) => zmen(i, { ukol: e.target.value })}
							onBlur={() => uloz()}
							aria-label={`Úkol ${i + 1}`}
						/>
						<input
							className="vstup"
							type="time"
							value={ukol.cas}
							disabled={nacita}
							onChange={(e) => zmen(i, { cas: e.target.value })}
							onBlur={() => uloz()}
							aria-label={`Čas úkolu ${i + 1}`}
						/>
						<button
							className="tlacitko tlacitko--zrusit"
							type="button"
							onClick={() => smaz(i)}
							aria-label={`Smazat úkol ${i + 1}`}
						>
							✕
						</button>
					</div>
				))}
			</div>

			<div className="souhrn">
				<span>Čas rozepsaný na úkolech</span>
				<span>{celkem}</span>
			</div>

			<Stav stav={stav} />
		</section>
	);
}
