import { Link } from "@tanstack/react-router";

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">SORAKU</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Soraku. All rights reserved.</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Link to="/az" search={{ letter: undefined, page: undefined }} className="text-muted-foreground hover:text-primary transition-colors font-semibold">
            All
          </Link>
          <Link to="/az" search={{ letter: undefined, page: undefined }} className="text-muted-foreground hover:text-primary transition-colors">
            #
          </Link>
          <Link to="/az" search={{ letter: undefined, page: undefined }} className="text-muted-foreground hover:text-primary transition-colors">
            0-9
          </Link>
          {LETTERS.map((l) => (
            <Link
              key={l}
              to="/az"
              search={{ letter: l, page: 1 }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {l}
            </Link>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.04] text-center">
          <p className="text-xs text-white/20">
            Soraku is not affiliated with any content provider.
          </p>
        </div>
      </div>
    </footer>
  );
}