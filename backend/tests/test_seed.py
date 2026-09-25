from datetime import date
from app.seed import resolve_date


def test_resolve_relative_dates():
    today = date(2026, 9, 25)
    assert resolve_date("+20d", today) == "2026-10-15"
    assert resolve_date("-400d", today) == "2025-08-21"
    assert resolve_date("2018-03-01", today) == "2018-03-01"
