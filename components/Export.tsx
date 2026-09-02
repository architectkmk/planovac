"use client";

import { useEffect, useState } from "react";
import { formatujDatum, naDatumString, nazevDne } from "@/lib/datum";
import { chybovaHlaska, pozadavek } from "@/lib/klient";
import Stav, { type StavUlozeni } from "./Stav";
import type { DenExportu } from "@/lib/typy";

type Rozsah = {
	od: string;
	do: string;
	jmeno: string;
	dny: DenExportu[];
	celkem: string;
};

/** První a poslední den měsíce, ve kterém jsme dnes. */
function aktualniMesic() {
	const dnes = new Date();
	const prvni = new Date(dnes.getFullYear(), dnes.getMonth(), 1);
	const posledni = new Date(dnes.getFullYear(), dnes.getMonth() + 1, 0);
	return { od: naDatumString(prvni), do: naDatumString(posledni) };
}

export default function Export() {
	const [rozsah, setRozsah] = useState({ od: "", do: "" });
	const [data, setData] = useState<Rozsah | null>(null);
	const [stav, setStav] = useState<StavUlozeni>({ typ: "necinny" });

	useEffect(() => setRozsah(aktualniMesic()), []);

	const nacti = async () => {
		if (!rozsah.od || !rozsah.do) {
			setStav({ typ: "chyba", zprava: "Vyberte prosím datum od a do." });
			return;
		}

		setStav({ typ: "nacitam" });

		try {
			const odpoved = await pozadavek<Rozsah>(
				`/api/rozsah?od=${rozsah.od}&do=${rozsah.do}`,
			);
			setData(odpoved);
			setStav({ typ: "necinny" });
		} catch (err) {
			setData(null);
			setStav({ typ: "chyba", zprava: chybovaHlaska(err) });
		}
	};

	return (
		<>
			<section className="karta ne-tisknout">
				<div className="karta__zahlavi">
					<h2>Export docházky</h2>
				</div>

				<div className="mrizka-dochazka">
					<div className="pole">
						<label htmlFor="od">Od</label>
						<input
							id="od"
							className="vstup"
							type="date"
							value={rozsah.od}
							onChange={(e) =>
								setRozsah((prev) => ({ ...prev, od: e.target.value }))
							}
						/>
					</div>
					<div className="pole">
						<label htmlFor="do">Do</label>
						<input
							id="do"
							className="vstup"
							type="date"
							value={rozsah.do}
							onChange={(e) =>
								setRozsah((prev) => ({ ...prev, do: e.target.value }))
							}
						/>
					</div>
					<div className="pole" style={{ justifyContent: "flex-end" }}>
						<button className="tlacitko" type="button" onClick={nacti}>
							Zobrazit
						</button>
					</div>
					<div className="pole" style={{ justifyContent: "flex-end" }}>
						<button
							className="tlacitko tlacitko--tiche"
							type="button"
							disabled={!data || data.dny.length === 0}
							onClick={() => window.print()}
						>
							Tisk / uložit PDF
						</button>
					</div>
				</div>

				<Stav stav={stav} />
			</section>

			{data && (
				<section className="karta">
					<div className="karta__zahlavi">
						<h2>
							{data.jmeno} — {formatujDatum(data.od)} až {formatujDatum(data.do)}
						</h2>
						<strong>Celkem {data.celkem}</strong>
					</div>

					{data.dny.length === 0 ? (
						<p className="prazdno">Ve vybraném období nejsou žádné záznamy.</p>
					) : (
						<div
							style={{ display: "flex", flexDirection: "column", gap: 10 }}
						>
							{data.dny.map((den) => (
								<article className="export-den" key={den.datum}>
									<div className="export-den__zahlavi">
										<span>
											{nazevDne(den.datum)} {formatujDatum(den.datum)}
										</span>
										<span>Odpracováno {den.odpracovano}</span>
									</div>

									<table className="export-tabulka">
										<tbody>
											<tr>
												<th>Příchod</th>
												<td>{den.dochazka.prichod || "—"}</td>
												<th>Odchod</th>
												<td>{den.dochazka.odchod || "—"}</td>
												<th>Pauza</th>
												<td>{den.dochazka.pauza || "—"}</td>
												<th>Přesčas</th>
												<td>{den.dochazka.prescas || "—"}</td>
											</tr>
										</tbody>
									</table>

									{den.ukoly.length > 0 && (
										<table
											className="export-tabulka"
											style={{ marginTop: 6 }}
										>
											<tbody>
												{den.ukoly.map((ukol, i) => (
													<tr key={i}>
														<td>{ukol.ukol}</td>
														<th style={{ textAlign: "right" }}>
															{ukol.cas || ""}
														</th>
													</tr>
												))}
											</tbody>
										</table>
									)}
								</article>
							))}
						</div>
					)}
				</section>
			)}
		</>
	);
}
