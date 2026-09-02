import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Hlavicka({
	naExportu = false,
}: {
	naExportu?: boolean;
}) {
	const session = await auth();

	return (
		<header className="hlavicka ne-tisknout">
			<div className="hlavicka__nazev">
				<strong>Docházka</strong>
				<span>Evidence práce a denních úkolů</span>
			</div>

			<div className="hlavicka__vpravo">
				<span className="hlavicka__uzivatel">
					{session?.user?.name ?? session?.user?.email}
				</span>

				<Link className="tlacitko tlacitko--tiche" href={naExportu ? "/" : "/export"}>
					{naExportu ? "Zpět na přehled" : "Export"}
				</Link>

				<form
					action={async () => {
						"use server";
						await signOut({ redirectTo: "/prihlaseni" });
					}}
				>
					<button className="tlacitko tlacitko--tiche" type="submit">
						Odhlásit se
					</button>
				</form>
			</div>
		</header>
	);
}
