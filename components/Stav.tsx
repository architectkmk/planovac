export type StavUlozeni =
	| { typ: "necinny" }
	| { typ: "nacitam" }
	| { typ: "ukladam" }
	| { typ: "ulozeno" }
	| { typ: "chyba"; zprava: string };

const POPISKY: Record<string, string> = {
	nacitam: "Načítám…",
	ukladam: "Ukládám…",
	ulozeno: "Uloženo",
};

export default function Stav({ stav }: { stav: StavUlozeni }) {
	if (stav.typ === "necinny") return <p className="stav" />;

	if (stav.typ === "chyba") {
		return (
			<p className="stav stav--chyba">
				<span className="stav__tecka" />
				{stav.zprava}
			</p>
		);
	}

	const trida = stav.typ === "ulozeno" ? "stav--ok" : "stav--nacitam";

	return (
		<p className={`stav ${trida}`}>
			<span className="stav__tecka" />
			{POPISKY[stav.typ]}
		</p>
	);
}
