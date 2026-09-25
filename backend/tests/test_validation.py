from app.validation import validate_product_input, slugify

VALID = {
    "familia": "PlayStation 5", "modelo": "Slim", "capacidade": "1TB", "condicao": "usado", "tipo": "console",
    "preco": {"precoAVista": 2999, "precoParcelado": 3199.92, "parcelasMax": 12},
    "usado": {"estado": "excelente", "acompanha": {"console": True, "controles": 1, "cabos": True, "caixa": False, "jogo": False}, "revisadoEm": "2026-09-20", "fotosReais": []},
}


def test_valid():
    assert validate_product_input(VALID) == []


def test_glued_text():
    assert any("sem espaço" in e for e in validate_product_input({**VALID, "modelo": "Slim 1TBControle"}))


def test_used_requires_estado_and_acompanha():
    errs = validate_product_input({**VALID, "usado": None})
    assert any("estado" in e for e in errs) and any("acompanha" in e for e in errs)


def test_slugify_spec_example():
    assert slugify("PlayStation 5 Slim 1TB com Leitor (Usado)") == "playstation-5-slim-1tb-com-leitor-usado"
    assert "--" not in slugify("a -- b") and not slugify("x!").endswith("-")
