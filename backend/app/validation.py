import re
import unicodedata

_GLUED = re.compile(r"\d+(TB|GB|MB)(?=[A-Za-zÀ-ú])", re.I)
_CONDICAO = {"novo": "Novo", "usado": "Usado", "lacrado": "Lacrado"}
_CONDICOES = set(_CONDICAO)
_TIPOS = {"console", "jogo", "acessorio", "headset", "gift-card"}
_PLATAFORMAS = {"playstation", "xbox", "nintendo", "retro", "multi"}
_BRANDS = [(re.compile(r"\bplaystation\b", re.I), "PlayStation"),
           (re.compile(r"\bxbox series x\s*\|?\s*s\b", re.I), "Xbox Series X|S"),
           (re.compile(r"\bnintendo switch\b", re.I), "Nintendo Switch")]


def _numero_positivo(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", strip_accents(text).lower())
    return re.sub(r"-+", "-", s).strip("-")


def unique_slug(base: str, taken: set[str]) -> str:
    slug, i = base, 2
    while slug in taken:
        slug, i = f"{base}-{i}", i + 1
    taken.add(slug)
    return slug


def build_product_name(p: dict) -> str:
    name = " ".join(x for x in [p.get("familia"), p.get("modelo"), p.get("capacidade"), p.get("edicao")] if x)
    name = re.sub(r"\s+", " ", name).strip()
    for rx, v in _BRANDS:
        name = rx.sub(v, name)
    return name if p.get("tipo") == "gift-card" else f"{name} — {_CONDICAO[p['condicao']]}"


def validate_product_input(p: dict) -> list[str]:
    errors: list[str] = []
    text = " ".join(x for x in [p.get("familia"), p.get("modelo"), p.get("capacidade"), p.get("edicao")] if x)
    if not p.get("familia") or not p.get("modelo"):
        errors.append("Plataforma e modelo são obrigatórios.")
    if _GLUED.search(text):
        errors.append('Texto colado sem espaço (ex.: "1TBControle").')
    if "->" in text or "→" in text:
        errors.append("Não use setas no nome.")
    if re.search("garantia", text, re.I):
        errors.append("Garantia é um campo próprio, não parte do nome.")
    if p.get("condicao") not in _CONDICOES:
        errors.append("Condição inválida. Use novo, usado ou lacrado.")
    if p.get("tipo") not in _TIPOS:
        errors.append("Tipo inválido.")
    if p.get("plataforma") not in _PLATAFORMAS:
        errors.append("Plataforma inválida.")
    if p.get("condicao") == "usado":
        usado = p.get("usado") or {}
        if not usado.get("estado"):
            errors.append("Usado precisa do estado de conservação.")
        if not usado.get("acompanha"):
            errors.append("Usado precisa informar o que acompanha.")
    preco = p.get("preco")
    if not isinstance(preco, dict):
        errors.append("Preço é obrigatório.")
    else:
        parcelas_max = preco.get("parcelasMax")
        parcelas_ok = isinstance(parcelas_max, int) and not isinstance(parcelas_max, bool) and parcelas_max >= 1
        if not _numero_positivo(preco.get("precoAVista")):
            errors.append("Preço à vista deve ser numérico e maior que zero.")
        if not _numero_positivo(preco.get("precoParcelado")):
            errors.append("Preço parcelado deve ser numérico e maior que zero.")
        if not parcelas_ok:
            errors.append("Número de parcelas deve ser um número inteiro maior ou igual a 1.")
        elif _numero_positivo(preco.get("precoParcelado")) and round(preco["precoParcelado"] * 100) % parcelas_max != 0:
            errors.append("Preço parcelado precisa dividir exatamente pelo número de parcelas.")
    return errors
