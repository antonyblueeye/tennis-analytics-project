"""Статусы турниров: отмены, COVID, предстоящие события текущего года."""
from datetime import date

RESULT_ABSENT = "—"
RESULT_NOT_HELD = "N/T"
RESULT_UPCOMING = "···"

CURRENT_YEAR = date.today().year

COVID_MASTERS_YEAR = 2020
COVID_MASTERS_HELD = frozenset({
    "Rome Masters",
    "Cincinnati Masters",
    "Paris Masters",
})

SHANGHAI_NAME = "Shanghai Masters"
SHANGHAI_NOT_HELD_YEARS = frozenset({2020, 2021, 2022})

SLAM_NOT_HELD = frozenset({(2020, "w")})


def is_masters_not_held(year: int, tourney_name: str) -> bool:
    if year == COVID_MASTERS_YEAR and tourney_name not in COVID_MASTERS_HELD:
        return True
    if tourney_name == SHANGHAI_NAME and year in SHANGHAI_NOT_HELD_YEARS:
        return True
    return False


def is_slam_not_held(year: int, slam: str) -> bool:
    return (year, slam) in SLAM_NOT_HELD


def _masters_template(raw: dict[int, list[str]], year: int) -> list[str] | None:
    for y in (2019, 2021, 2023, year - 1, year + 1, year - 2, year + 2):
        names = raw.get(y)
        if names and len(names) >= 8:
            return names
    if not raw:
        return None
    return max(raw.values(), key=len)


def normalize_masters_calendar(raw: dict[int, list[str]]) -> dict[int, list[str]]:
    """Дополняет неполные годы (COVID 2020, Shanghai) до полного набора эпохи."""
    if not raw:
        return {}

    result = {year: list(names) for year, names in raw.items()}

    template_2020 = raw.get(2019) or raw.get(2021) or _masters_template(raw, COVID_MASTERS_YEAR)
    if template_2020:
        result[COVID_MASTERS_YEAR] = list(template_2020)

    shanghai_template = None
    for y in (2019, 2021, 2023, 2018):
        names = raw.get(y)
        if names and SHANGHAI_NAME in names:
            shanghai_template = names
            break

    if shanghai_template:
        for year in list(result.keys()):
            if year < 2009:
                continue
            if SHANGHAI_NAME in result[year]:
                continue
            name_set = set(result[year]) | {SHANGHAI_NAME}
            result[year] = [t for t in shanghai_template if t in name_set]

    _extend_incomplete_season(result, raw)

    return result


def _extend_incomplete_season(
    result: dict[int, list[str]],
    raw: dict[int, list[str]],
) -> None:
    """Текущий сезон в БД неполный — дополняем составом прошлого года."""
    if CURRENT_YEAR not in raw and CURRENT_YEAR not in result:
        return

    prev_names = result.get(CURRENT_YEAR - 1) or raw.get(CURRENT_YEAR - 1)
    if not prev_names or len(prev_names) < 8:
        return

    cur_names = result.get(CURRENT_YEAR)
    if cur_names is None:
        result[CURRENT_YEAR] = list(prev_names)
    elif len(cur_names) < len(prev_names):
        result[CURRENT_YEAR] = list(prev_names)


def resolve_masters_result(
    year: int,
    tourney_name: str,
    player_result: str | None,
    global_held: set[tuple[int, str]],
    player_tourneys_in_year: set[str],
) -> str:
    if player_result:
        return player_result
    if is_masters_not_held(year, tourney_name):
        return RESULT_NOT_HELD
    if year == CURRENT_YEAR and (year, tourney_name) not in global_held:
        any_held = any(y == year for y, _ in global_held)
        if any_held or player_tourneys_in_year:
            return RESULT_UPCOMING
    return RESULT_ABSENT


def resolve_slam_result(
    year: int,
    slam: str,
    player_result: str | None,
    global_held: set[tuple[int, str]],
    player_slams_in_year: set[str],
) -> str:
    if player_result:
        return player_result
    if is_slam_not_held(year, slam):
        return RESULT_NOT_HELD
    if year == CURRENT_YEAR and (year, slam) not in global_held:
        any_held = any(y == year for y, _ in global_held)
        if any_held or player_slams_in_year:
            return RESULT_UPCOMING
    return RESULT_ABSENT
