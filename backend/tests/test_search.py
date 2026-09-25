from app.search import normalize_search


def test_ps5_synonyms_equivalent():
    a = normalize_search("ps5")
    assert normalize_search("play 5") == a
    assert normalize_search("PlayStation 5") == a
    assert normalize_search("PLAY5") == a


def test_accents_and_case():
    assert normalize_search("Retrô CLÁSSICO") == "retro classico"
