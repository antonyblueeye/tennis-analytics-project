#!/usr/bin/env python3
"""Run all ATP import scripts in order (safe to re-run — tables are recreated)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

SCRIPTS = [
    "import_tennis_data.py",
    "import_atp_matches_data.py",
    "import_atp_rankings_data.py",
    "create_atp_players_matches_data.py",
]

NOTES = {
    "import_tennis_data.py": "~1 min · table atp_players",
    "import_atp_matches_data.py": "15–40 min · table atp_matches",
    "import_atp_rankings_data.py": "10–30 min · table atp_rankings",
    "create_atp_players_matches_data.py": "5–15 min · table atp_player_matches",
}


def main() -> int:
    scripts_dir = Path(__file__).resolve().parent
    python = sys.executable

    print("=" * 60)
    print("Tennis Analytics — full DB import")
    print("Reads DATABASE_URL from backend/.env")
    print("=" * 60)

    for name in SCRIPTS:
        path = scripts_dir / name
        if not path.exists():
            print(f"Missing script: {path}")
            return 1

    # Connection test first
    test = subprocess.run([python, str(scripts_dir / "test_connection.py")], cwd=scripts_dir)
    if test.returncode != 0:
        print("\nFix backend/.env (DATABASE_URL from Railway Postgres Public URL) and retry.")
        return 1

    for i, name in enumerate(SCRIPTS, start=1):
        print("\n" + "=" * 60)
        print(f"Step {i}/{len(SCRIPTS)}: {name}")
        print(NOTES.get(name, ""))
        print("=" * 60)

        result = subprocess.run([python, str(scripts_dir / name)], cwd=scripts_dir)
        if result.returncode != 0:
            print(f"\nFailed at {name} (exit {result.returncode}). Fix the error and re-run.")
            print("Already-finished steps are OK; re-running run_all_imports.py is safe.")
            return result.returncode

    print("\n" + "=" * 60)
    print("All done. Tables in Railway:")
    print("  atp_players, atp_matches, atp_rankings, atp_player_matches")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
