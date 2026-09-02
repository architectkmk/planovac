"use client";

import { useEffect, useState } from "react";
import { chybovaHlaska, pozadavek } from "@/lib/klient";
import Stav, { type StavUlozeni } from "./Stav";

type Souhrn = { celkem: string; dny: number };

export default function Mesic({
	datum,
	verze,
}: {
	datum: string;
	verze: number;
}) {
	const [mesic, setMesic] = useState(datum.slice(0, 7));
	const [souhrn, setSouhrn] = useState<Souhrn>({ celkem: "00:00", dny: 0 });
	const [stav, setStav] = useState<StavUlozeni>({ typ: "necinny" });

	// Souhrn sleduje měsíc, ve kterém je vybraný den.
	useEffect(() => setMesic(datum.slice(0, 7)), [datum]);

	useEffect(() => {
		let aktualni = true;
		setStav({ typ: "nacitam" });

		pozadavek<Souhrn>(`/api/mesic?mesic=${mesic}`)
			.then((data) => {
				if (!aktualni) return;
				setSouhrn(data);
				setStav({ typ: "necinny" });
			})
			.catch((err) => {
				if (aktualni) setStav({ typ: "chyba", zprava: chybovaHlaska(err) });
			});

		return () => {
			aktualni = false;
		};
	}, [mesic, verze]);

	return (
		<section className="karta">
			<div className="karta__zahlavi">
				<h2>Měsíční souhrn</h2>
			</div>

			<div className="mrizka-dochazka">
				<div className="pole">
					<label htmlFor="mesic">Měsíc</label>
					<input
						id="mesic"
						className="vstup"
						type="month"
						value={mesic}
						onChange={(e) => e.target.value && setMesic(e.target.value)}
					/>
				</div>
				<div className="pole">
					<span>Odpracováno</span>
					<p className="hodnota">{souhrn.celkem}</p>
				</div>
				<div className="pole">
					<span>Odpracovaných dní</span>
					<p className="hodnota">{souhrn.dny}</p>
				</div>
			</div>

			<Stav stav={stav} />
		</section>
	);
}
