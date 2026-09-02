"use client";

import { dnesniDatum, naDatumString, tydenProDatum } from "@/lib/datum";

const KRATKE = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export default function Tyden({
	datum,
	nastavDatum,
}: {
	datum: string;
	nastavDatum: (datum: string) => void;
}) {
	const dny = tydenProDatum(datum);
	const dnes = dnesniDatum();

	const posun = (oDni: number) => {
		const d = new Date(`${datum}T00:00:00`);
		d.setDate(d.getDate() + oDni);
		nastavDatum(naDatumString(d));
	};

	return (
		<div className="karta">
			<div className="karta__zahlavi">
				<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
					<button
						className="tlacitko tlacitko--tiche"
						onClick={() => posun(-7)}
						aria-label="Předchozí týden"
						type="button"
					>
						‹
					</button>
					<button
						className="tlacitko tlacitko--tiche"
						onClick={() => posun(7)}
						aria-label="Další týden"
						type="button"
					>
						›
					</button>
					<button
						className="tlacitko tlacitko--tiche"
						onClick={() => nastavDatum(dnes)}
						type="button"
					>
						Dnes
					</button>
				</div>
				<div className="pole">
					<input
						className="vstup"
						type="date"
						value={datum}
						onChange={(e) => e.target.value && nastavDatum(e.target.value)}
						aria-label="Datum"
					/>
				</div>
			</div>

			<div className="tyden">
				{dny.map((den, i) => {
					const vybrany = den.datum === datum;
					const jeDnes = den.datum === dnes;

					return (
						<button
							key={den.datum}
							type="button"
							onClick={() => nastavDatum(den.datum)}
							className={[
								"tyden__den",
								jeDnes ? "tyden__den--dnes" : "",
								vybrany ? "tyden__den--vybrany" : "",
							]
								.filter(Boolean)
								.join(" ")}
						>
							<span>{KRATKE[i]}</span>
							<small>
								{Number(den.datum.slice(8))}. {Number(den.datum.slice(5, 7))}.
							</small>
						</button>
					);
				})}
			</div>
		</div>
	);
}
