"""Форматирование счёта с точки зрения игрока."""
import re

SET_PATTERN = re.compile(r"^(\d+)-(\d+)(\(.*\))?$")


def flip_score(score: str) -> str:
    """Меняет местами геймы в каждом сете (проигравший → перспектива игрока)."""
    if not score or score.strip() in ("", "W/O", "DEF", "RET", "ABD", "UNP"):
        return score.strip() if score else "—"

    flipped: list[str] = []
    for token in score.strip().split():
        m = SET_PATTERN.match(token)
        if m:
            flipped.append(f"{m.group(2)}-{m.group(1)}{m.group(3) or ''}")
        else:
            flipped.append(token)
    return " ".join(flipped)


def player_perspective_score(score: str | None, won: bool) -> str:
    if not score:
        return "—"
    normalized = score.strip()
    if not normalized:
        return "—"
    return normalized if won else flip_score(normalized)
