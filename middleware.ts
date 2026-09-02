import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
	const prihlasen = Boolean(req.auth);
	const cesta = req.nextUrl.pathname;

	if (!prihlasen && cesta !== "/prihlaseni") {
		return NextResponse.redirect(new URL("/prihlaseni", req.nextUrl.origin));
	}

	if (prihlasen && cesta === "/prihlaseni") {
		return NextResponse.redirect(new URL("/", req.nextUrl.origin));
	}

	return NextResponse.next();
});

export const config = {
	// API routy si přihlášení hlídají samy (vrací 401 místo přesměrování).
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
