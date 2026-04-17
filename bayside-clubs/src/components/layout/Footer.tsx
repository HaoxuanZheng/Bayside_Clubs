import Link from "next/link";
import { GitBranch } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-sm text-slate-600 sm:px-6">
        <p>Bayside Hub · Bayside High School · Built by Haoxuan Zheng</p>
        <Link
          href="https://github.com/your-username/bayside-clubs"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <GitBranch className="h-4 w-4" />
        </Link>
      </div>
    </footer>
  );
}
