import Export from "@/components/Export";
import Hlavicka from "@/components/Hlavicka";

export default function StrankaExportu() {
	return (
		<>
			<Hlavicka naExportu />
			<main className="obsah">
				<Export />
			</main>
		</>
	);
}
