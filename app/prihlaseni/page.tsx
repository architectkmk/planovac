import { signIn } from "@/auth";

const CHYBY: Record<string, string> = {
	AccessDenied:
		"Tento účet nemá přístup. Přihlaste se firemním Google účtem, nebo požádejte správce o přidání.",
	Configuration:
		"Přihlášení není správně nastavené. Zkontrolujte proměnné prostředí na Vercelu.",
	Verification: "Odkaz pro přihlášení vypršel. Zkuste to prosím znovu.",
};

export default async function Prihlaseni({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const { error } = await searchParams;

	return (
		<main className="prihlaseni">
			<div className="prihlaseni__karta">
				<div>
					<h1 style={{ fontSize: "1.3rem" }}>Docházka</h1>
					<p style={{ color: "var(--text-slaby)" }}>
						Evidence práce a denních úkolů
					</p>
				</div>

				{error && (
					<p className="chyba">
						{CHYBY[error] ?? "Přihlášení se nepovedlo. Zkuste to prosím znovu."}
					</p>
				)}

				<form
					action={async () => {
						"use server";
						await signIn("google", { redirectTo: "/" });
					}}
				>
					<button className="tlacitko" type="submit" style={{ width: "100%" }}>
						Přihlásit se Google účtem
					</button>
				</form>
			</div>
		</main>
	);
}
