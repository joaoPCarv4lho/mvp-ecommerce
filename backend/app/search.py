import re
from .validation import strip_accents

_SYNONYMS = [
    (r"\bplay\s*station\s*5\b|\bplay\s*5\b|\bps\s*5\b", "ps5"),
    (r"\bplay\s*station\s*4\b|\bplay\s*4\b|\bps\s*4\b", "ps4"),
    (r"\bplay\s*station\s*3\b|\bplay\s*3\b|\bps\s*3\b", "ps3"),
    (r"\bplay\s*station\s*2\b|\bplay\s*2\b|\bps\s*2\b", "ps2"),
    (r"\bxbox\s*series\s*x\s*\|?\s*s\b|\bseries\s*[xs]\b", "xbox series"),
    (r"\bnintendo\s*switch\b|\bswitch\b", "switch"),
    (r"\bcontrole\b|\bjoystick\b|\bmanete\b", "controle"),
]


def normalize_search(q: str) -> str:
    s = re.sub(r"[^a-z0-9|\s]", " ", strip_accents(q).lower())
    for rx, v in _SYNONYMS:
        s = re.sub(rx, v, s)
    return re.sub(r"\s+", " ", s).strip()


def matches(index: str, q: str) -> bool:
    words = index.split(" ")
    return all(any(w.startswith(t) for w in words) for t in normalize_search(q).split(" ") if t)
