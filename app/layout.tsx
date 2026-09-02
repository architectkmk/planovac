import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Docházka",
	description: "Evidence docházky a denních úkolů",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="cs">
			<body>{children}</body>
		</html>
	);
}
