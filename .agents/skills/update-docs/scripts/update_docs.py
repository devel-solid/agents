#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import os
import stat
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any, Iterable


SECTION_HEADING = "## Quando ler as conventions"
SUBCONVENTION_SECTION_HEADING = "## Quando ler as subconventions"
POST_BOOTSTRAP_ARG = "--post-bootstrap"
SECTION_PREAMBLE = (
    "- Esta seção é a lista autoritativa de descoberta para as `conventions` publicadas.",
    "- O agente deve consultar esta seção em toda mudança para verificar se existe alguma `convention` acionada no caso concreto.",
    "- Ao criar, remover, renomear ou alterar o escopo de uma `convention`, atualize esta lista.",
)
GENERATED_NOTICE = (
    "> Arquivo gerado. Não edite manualmente.",
    "> Altere a fonte e o manifesto aplicáveis e use o fluxo público de publicação do repositório.",
)
AGENT_CARD_START = "<!-- AGENT-CARD START -->"
AGENT_CARD_END = "<!-- AGENT-CARD END -->"
SKILL_PATH = Path(".agents") / "skills" / "update-docs"
SKILL_SCRIPT = SKILL_PATH / "scripts" / "update_docs.py"


class UpdateDocsError(Exception):
    pass


class ManifestError(UpdateDocsError):
    pass


class ValidationError(UpdateDocsError):
    pass


class CheckoutError(UpdateDocsError):
    pass


@dataclass(frozen=True)
class ConventionEntry:
    origin: str
    source: str


@dataclass(frozen=True)
class ConventionArtifact:
    title: str
    target_path: Path
    target_display: str
    legacy_target_path: Path
    source_path: Path
    source_display: str
    agent_card_lines: tuple[str, ...]
    rendered_text: str


@dataclass(frozen=True)
class ConventionFamily:
    parent: ConventionArtifact
    children: tuple[ConventionArtifact, ...]


@dataclass(frozen=True)
class SyncOutcome:
    written_paths: tuple[Path, ...]


@dataclass(frozen=True)
class RuntimeContext:
    repository: str
    ref: str
    conventions_out_dir: str
    local_tpl_dir: str
    remote_tpl_dir: str
    conventions: tuple[ConventionEntry, ...]
    fingerprint: str
    checkout: Path


def normalize_text(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def read_text(path: Path) -> str:
    return normalize_text(path.read_text(encoding="utf-8"))


def write_if_changed(path: Path, text: str) -> bool:
    normalized = normalize_text(text)
    if path.exists():
        existing = read_text(path)
        if existing == normalized:
            return False
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(normalized if normalized.endswith("\n") else normalized + "\n")
    return True


def find_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    if current.is_file():
        current = current.parent
    for candidate in (current, *current.parents):
        if (candidate / "agents-compose.yml").is_file():
            return candidate
    raise ManifestError("agents-compose.yml não encontrado")


def compute_fingerprint(repository: str, ref: str) -> str:
    digest = hashlib.sha256(f"{repository}\n{ref}".encode("utf-8")).hexdigest()
    return digest[:16]


def is_git_repository(path: Path) -> bool:
    if not (path / ".git").exists():
        return False
    completed = subprocess.run(
        ["git", "-C", str(path), "rev-parse", "--is-inside-work-tree"],
        capture_output=True,
        text=True,
    )
    return completed.returncode == 0 and completed.stdout.strip() == "true"


def is_within(path: Path, root: Path) -> bool:
    try:
        path.resolve(strict=False).relative_to(root.resolve(strict=False))
    except ValueError:
        return False
    return True


def has_path_traversal(path_text: str) -> bool:
    return any(
        path.anchor or ".." in path.parts
        for path in (PurePosixPath(path_text), PureWindowsPath(path_text))
    )


def join_relative_path(base: str, relative: str) -> str:
    return (Path(base) / relative).as_posix()


def convention_source_base(source_root: Path, tpl_dir: str) -> Path:
    return source_root / tpl_dir


def convention_filename_suffix(origin: str) -> str:
    if origin in {"local", "remote"}:
        return ".tpl.md"
    raise ValidationError(f"origin inválido: {origin!r}")


def classify_convention_filename(name: str, origin: str) -> tuple[str, str] | None:
    suffix = convention_filename_suffix(origin)
    if not name.endswith(suffix):
        return None
    stem = name[: -len(suffix)]
    if not stem:
        raise ValidationError(f"arquivo de convention com nome vazio: {name!r}")
    parts = stem.split(".")
    if len(parts) == 1:
        if not parts[0]:
            raise ValidationError(f"arquivo de convention com nome vazio: {name!r}")
        return "parent", parts[0]
    if len(parts) == 2:
        if not parts[0] or not parts[1]:
            raise ValidationError(f"arquivo de convention malformado: {name!r}")
        return "child", parts[0]
    raise ValidationError(f"arquivo de convention em profundidade maior que 1: {name!r}")


def expected_public_target(source_path: Path, source_root: Path, origin: str, tpl_dir: str, out_dir: str) -> str:
    if has_path_traversal(out_dir):
        raise ValidationError(f"out_dir inseguro: {out_dir!r}")
    source_base = convention_source_base(source_root, tpl_dir)
    try:
        relative_source = source_path.resolve(strict=False).relative_to(source_base.resolve(strict=False))
    except ValueError as exc:
        raise ValidationError(f"fonte de convention fora da raiz de origem: {source_path}") from exc

    relative_text = relative_source.as_posix()
    suffix = convention_filename_suffix(origin)
    if not relative_text.endswith(suffix):
        raise ValidationError(f"entrada {origin} com from inválido: {relative_text!r}")
    published_relative = f"{relative_text[:-len(suffix)]}.md"
    return join_relative_path(out_dir, published_relative)


def expected_legacy_public_target(source_path: Path, source_root: Path, origin: str, tpl_dir: str, out_dir: str) -> str:
    if has_path_traversal(out_dir):
        raise ValidationError(f"out_dir inseguro: {out_dir!r}")
    source_base = convention_source_base(source_root, tpl_dir)
    try:
        relative_source = source_path.resolve(strict=False).relative_to(source_base.resolve(strict=False))
    except ValueError as exc:
        raise ValidationError(f"fonte de convention fora da raiz de origem: {source_path}") from exc

    relative_text = relative_source.as_posix()
    suffix = convention_filename_suffix(origin)
    if not relative_text.endswith(suffix):
        raise ValidationError(f"entrada {origin} com from inválido: {relative_text!r}")
    flattened_name = f"{relative_source.name[:-len(suffix)]}.md"
    return join_relative_path(out_dir, flattened_name)


def resolve_public_target_path(repo_root: Path, target_display: str) -> Path:
    target_path = (repo_root / target_display).resolve(strict=False)
    if not is_within(target_path, repo_root):
        raise ValidationError(f"destino publicado fora da raiz: {target_display!r}")
    return target_path


@dataclass(frozen=True)
class ConventionDirectoryScan:
    parents: dict[str, Path]
    children: dict[str, tuple[Path, ...]]


def scan_convention_directory(directory: Path, origin: str) -> ConventionDirectoryScan:
    parents: dict[str, Path] = {}
    children: dict[str, list[Path]] = {}
    for candidate in sorted(directory.iterdir(), key=lambda path: path.name):
        if not candidate.is_file():
            continue
        classification = classify_convention_filename(candidate.name, origin)
        if classification is None:
            continue
        kind, root = classification
        if kind == "parent":
            parents[root] = candidate
        else:
            children.setdefault(root, []).append(candidate)
    for root, child_paths in children.items():
        if root not in parents:
            raise ValidationError(f"subconvention órfã sem pai correspondente: {child_paths[0]}")
    return ConventionDirectoryScan(
        parents=parents,
        children={root: tuple(child_paths) for root, child_paths in children.items()},
    )


def run_git(*args: str, cwd: Path | None = None) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    if completed.returncode == 0:
        return completed.stdout.strip()
    message = completed.stderr.strip() or completed.stdout.strip()
    if not message:
        message = f"git {' '.join(args)} falhou"
    raise CheckoutError(message)


def retry_readonly_remove(function, path, exc_info) -> None:
    error = exc_info[1]
    if function is not os.unlink or not isinstance(error, PermissionError):
        raise error
    mode = os.stat(path, follow_symlinks=False).st_mode
    if not stat.S_ISREG(mode) or mode & stat.S_IWUSR:
        raise error
    os.chmod(path, mode | stat.S_IWUSR)
    function(path)


def remove_path(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path, onerror=retry_readonly_remove)
    elif path.exists() or path.is_symlink():
        path.unlink()


def is_dirty_checkout(checkout: Path) -> bool:
    status = run_git("-C", str(checkout), "status", "--porcelain")
    return bool(status.strip())


def refresh_checkout(checkout: Path) -> None:
    run_git("-C", str(checkout), "fetch", "--force", "--tags", "origin")


def ref_exists(checkout: Path, ref: str) -> bool:
    completed = subprocess.run(
        ["git", "-C", str(checkout), "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"],
        capture_output=True,
        text=True,
    )
    return completed.returncode == 0


def clone_checkout(repository: str, checkout: Path) -> None:
    checkout.parent.mkdir(parents=True, exist_ok=True)
    run_git("clone", repository, str(checkout))


def ensure_checkout(repository: str, ref: str, checkout: Path) -> Path:
    if checkout.exists():
        if not is_git_repository(checkout):
            remove_path(checkout)
        elif is_dirty_checkout(checkout):
            remove_path(checkout)
    if not checkout.exists():
        clone_checkout(repository, checkout)
    refresh_checkout(checkout)
    if not ref_exists(checkout, ref):
        raise CheckoutError(f"ref pinada ausente no checkout: {ref}")
    run_git("-C", str(checkout), "checkout", "--force", "--detach", ref)
    return checkout


def file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def should_ignore_skill_path(path: Path) -> bool:
    return any(part == "__pycache__" for part in path.parts) or path.suffix == ".pyc"


def directory_snapshot(path: Path) -> tuple[tuple[str, ...], ...] | None:
    if not path.exists():
        return None
    entries: list[tuple[str, ...]] = []
    for candidate in sorted(path.rglob("*")):
        relative = candidate.relative_to(path)
        if should_ignore_skill_path(relative):
            continue
        relative_text = relative.as_posix()
        if candidate.is_symlink():
            raise ValidationError(f"skill contém symlink não suportado: {candidate}")
        if candidate.is_dir():
            entries.append(("dir", relative_text))
        elif candidate.is_file():
            entries.append(("file", relative_text, file_digest(candidate)))
    return tuple(entries)


def remote_skill_path(checkout: Path) -> Path:
    return checkout / SKILL_PATH


def local_skill_path(repo_root: Path) -> Path:
    return repo_root / SKILL_PATH


def sync_local_skill_from_checkout(repo_root: Path, checkout: Path) -> bool:
    source = remote_skill_path(checkout)
    if not source.is_dir():
        raise ValidationError(f"skill ausente no checkout pinado: {source}")
    destination = local_skill_path(repo_root)
    if directory_snapshot(source) == directory_snapshot(destination):
        return False

    destination.parent.mkdir(parents=True, exist_ok=True)
    staging_root = Path(tempfile.mkdtemp(prefix="update-docs-", dir=str(destination.parent)))
    staging_skill = staging_root / "update-docs"
    try:
        shutil.copytree(source, staging_skill)
        if destination.exists() or destination.is_symlink():
            remove_path(destination)
        staging_skill.replace(destination)
    finally:
        if staging_skill.exists():
            remove_path(staging_skill)
        if staging_root.exists():
            remove_path(staging_root)
    return True


def reexec_current_skill(repo_root: Path) -> int:
    script_path = repo_root / SKILL_SCRIPT
    if not script_path.is_file():
        raise ValidationError(f"script da skill ausente após bootstrap: {script_path}")
    completed = subprocess.run(
        [sys.executable, "-B", str(script_path), "--repo-root", str(repo_root), POST_BOOTSTRAP_ARG],
        cwd=repo_root,
    )
    return completed.returncode


def load_compose(repo_root: Path) -> dict[str, Any]:
    compose_path = repo_root / "agents-compose.yml"
    if not compose_path.is_file():
        raise ManifestError("agents-compose.yml não encontrado")
    data = parse_yaml(read_text(compose_path))
    if not isinstance(data, dict):
        raise ManifestError("agents-compose.yml deve conter um mapa na raiz")
    return data


def parse_yaml(text: str) -> Any:
    lines = normalize_text(text).splitlines()
    value, index = parse_block(lines, 0, 0)
    index = skip_ignored(lines, index)
    if index < len(lines):
        raise ManifestError(f"conteúdo YAML inesperado na linha {index + 1}")
    return value


def skip_ignored(lines: list[str], index: int) -> int:
    while index < len(lines):
        stripped = lines[index].strip()
        if not stripped or stripped.startswith("#"):
            index += 1
            continue
        break
    return index


def leading_spaces(line: str) -> int:
    if "\t" in line:
        raise ManifestError("tabs de indentação não são permitidos")
    return len(line) - len(line.lstrip(" "))


def is_mapping_fragment(text: str) -> bool:
    if ":" not in text:
        return False
    colon = text.find(":")
    return colon == len(text) - 1 or text[colon + 1].isspace()


def parse_scalar(token: str) -> Any:
    token = token.strip()
    if token == "[]":
        return []
    if token == "{}":
        return {}
    if token in {"null", "~"}:
        return None
    if len(token) >= 2 and token[0] == token[-1] and token[0] in {"'", '"'}:
        return token[1:-1]
    return token


def parse_key_value(text: str) -> tuple[str, Any, bool]:
    if ":" not in text:
        raise ManifestError(f"linha YAML inválida: {text!r}")
    key, raw_value = text.split(":", 1)
    key = key.strip()
    if not key:
        raise ManifestError("chave YAML vazia")
    raw_value = raw_value.strip()
    if not raw_value:
        return key, None, False
    return key, parse_scalar(raw_value), True


def parse_block(lines: list[str], index: int, indent: int) -> tuple[Any, int]:
    container: dict[str, Any] | list[Any] | None = None
    while True:
        index = skip_ignored(lines, index)
        if index >= len(lines):
            return container if container is not None else {}, index
        line = lines[index]
        current_indent = leading_spaces(line)
        if current_indent < indent:
            return container if container is not None else {}, index
        if current_indent > indent:
            raise ManifestError(f"indentação inesperada na linha {index + 1}")
        content = line[indent:]
        if content.startswith("- "):
            if container is None:
                container = []
            if not isinstance(container, list):
                raise ManifestError(f"estrutura YAML mista na linha {index + 1}")
            item, index = parse_list_item(lines, index, indent)
            container.append(item)
            continue
        if container is None:
            container = {}
        if not isinstance(container, dict):
            raise ManifestError(f"estrutura YAML mista na linha {index + 1}")
        key, value, has_value = parse_key_value(content)
        if key in container:
            raise ManifestError(f"chave duplicada em YAML: {key!r}")
        index += 1
        if has_value:
            container[key] = value
            continue
        child_index = skip_ignored(lines, index)
        if child_index >= len(lines):
            raise ManifestError(f"bloco aninhado ausente para {key!r}")
        child_indent = leading_spaces(lines[child_index])
        if child_indent <= indent:
            raise ManifestError(f"bloco aninhado ausente para {key!r}")
        child, index = parse_block(lines, child_index, child_indent)
        container[key] = child


def parse_list_item(lines: list[str], index: int, indent: int) -> tuple[Any, int]:
    line = lines[index]
    content = line[indent:]
    if not content.startswith("- "):
        raise ManifestError(f"item de lista inválido na linha {index + 1}")
    rest = content[2:].strip()
    index += 1
    if not rest:
        item: Any = {}
    elif is_mapping_fragment(rest):
        key, value, has_value = parse_key_value(rest)
        item = {key: value if has_value else None}
    else:
        item = parse_scalar(rest)

    child_index = skip_ignored(lines, index)
    if child_index < len(lines):
        child_indent = leading_spaces(lines[child_index])
        if child_indent > indent:
            child, index = parse_block(lines, child_index, child_indent)
            if isinstance(item, dict):
                if not isinstance(child, dict):
                    raise ManifestError(f"item de lista não pode misturar mapa e escalar na linha {index + 1}")
                for key, value in child.items():
                    if key in item:
                        raise ManifestError(f"chave duplicada em item de lista: {key!r}")
                    item[key] = value
            elif item == {}:
                item = child
            else:
                raise ManifestError(f"item de lista escalar não pode ter bloco aninhado na linha {index + 1}")
    return item, index


def validate_non_empty_manifest_string(field_path: str, value: Any) -> str:
    if not isinstance(value, str):
        raise ManifestError(f"{field_path} ausente ou inválido")
    text = value.strip()
    if not text:
        raise ManifestError(f"{field_path} ausente ou inválido")
    return text


def validate_safe_manifest_path(field_name: str, path_text: str) -> None:
    if has_path_traversal(path_text):
        raise ValidationError(f"{field_name} inseguro: {path_text!r}")


def path_has_prefix(path_text: str, prefix_text: str) -> bool:
    path_parts = Path(path_text).parts
    prefix_parts = Path(prefix_text).parts
    return len(path_parts) >= len(prefix_parts) and path_parts[: len(prefix_parts)] == prefix_parts


def validate_convention_root_block(conventions: dict[str, Any], key: str) -> str:
    field_path = f'outputs["AGENTS.md"].include.conventions.{key}'
    block = conventions.get(key)
    if not isinstance(block, dict):
        raise ManifestError(f"{field_path} ausente ou inválido")
    extra_keys = sorted(set(block) - {"tpl_dir"})
    if extra_keys:
        invalid_keys = ", ".join(repr(item) for item in extra_keys)
        raise ManifestError(f"{field_path} possui chaves inválidas: {invalid_keys}")
    tpl_dir = validate_non_empty_manifest_string(f"{field_path}.tpl_dir", block.get("tpl_dir"))
    validate_safe_manifest_path(f"{key}.tpl_dir", tpl_dir)
    return tpl_dir


def validate_convention_entry(
    raw_entry: Any,
    index: int,
    local_tpl_dir: str,
    remote_tpl_dir: str,
) -> ConventionEntry:
    if not isinstance(raw_entry, dict):
        raise ManifestError(f"entrada de convention #{index} deve ser um mapa")
    extra_entry_keys = sorted(set(raw_entry) - {"origin", "from"})
    if extra_entry_keys:
        invalid_keys = ", ".join(repr(key) for key in extra_entry_keys)
        raise ManifestError(f"entrada de convention #{index} possui chaves inválidas: {invalid_keys}")
    origin = raw_entry.get("origin")
    source = raw_entry.get("from")
    if not isinstance(origin, str) or origin not in {"local", "remote"}:
        raise ManifestError(f"entrada de convention #{index} possui origin inválido")
    source = validate_non_empty_manifest_string(f"entrada de convention #{index} possui from", source)
    validate_safe_manifest_path(f"entrada de convention #{index} possui from", source)
    if not source.endswith(".tpl.md"):
        raise ManifestError(f"entrada de convention #{index} possui from inválido")
    origin_tpl_dir = local_tpl_dir if origin == "local" else remote_tpl_dir
    if path_has_prefix(source, origin_tpl_dir):
        raise ManifestError(f"entrada de convention #{index} possui from inválido")
    return ConventionEntry(origin=origin, source=source)


def validate_manifest_structure(
    data: dict[str, Any],
) -> tuple[str, str, str, str, str, list[ConventionEntry]]:
    agents = data.get("agents")
    if not isinstance(agents, dict):
        raise ManifestError("bloco agents ausente ou inválido")
    repository = agents.get("repository")
    ref = agents.get("ref")
    if not isinstance(repository, str) or not repository.strip():
        raise ManifestError("agents.repository ausente ou inválido")
    if not isinstance(ref, str) or not ref.strip():
        raise ManifestError("agents.ref ausente ou inválido")

    outputs = data.get("outputs")
    if not isinstance(outputs, dict):
        raise ManifestError("bloco outputs ausente ou inválido")
    agents_md = outputs.get("AGENTS.md")
    if not isinstance(agents_md, dict):
        raise ManifestError('outputs["AGENTS.md"] ausente ou inválido')
    include = agents_md.get("include")
    if not isinstance(include, dict):
        raise ManifestError('outputs["AGENTS.md"].include ausente ou inválido')
    conventions = include.get("conventions")
    if not isinstance(conventions, dict):
        raise ManifestError('outputs["AGENTS.md"].include.conventions ausente ou inválido')
    convention_keys = set(conventions)
    extra_convention_keys = sorted(convention_keys - {"out_dir", "local", "remote", "entries"})
    if extra_convention_keys:
        invalid_keys = ", ".join(repr(key) for key in extra_convention_keys)
        raise ManifestError(f'outputs["AGENTS.md"].include.conventions possui chaves inválidas: {invalid_keys}')

    out_dir = validate_non_empty_manifest_string('outputs["AGENTS.md"].include.conventions.out_dir', conventions.get("out_dir"))
    validate_safe_manifest_path("out_dir", out_dir)
    local_tpl_dir = validate_convention_root_block(conventions, "local")
    remote_tpl_dir = validate_convention_root_block(conventions, "remote")

    entries = conventions.get("entries")
    if not isinstance(entries, list):
        raise ManifestError('outputs["AGENTS.md"].include.conventions.entries ausente ou inválido')

    parsed_conventions: list[ConventionEntry] = []
    for index, raw_entry in enumerate(entries, start=1):
        parsed_conventions.append(validate_convention_entry(raw_entry, index, local_tpl_dir, remote_tpl_dir))

    return repository, ref, out_dir, local_tpl_dir, remote_tpl_dir, parsed_conventions


def load_runtime_context(repo_root: Path) -> RuntimeContext:
    data = load_compose(repo_root)
    repository, ref, conventions_out_dir, local_tpl_dir, remote_tpl_dir, conventions = validate_manifest_structure(data)
    fingerprint = compute_fingerprint(repository, ref)
    checkout = repo_root / ".cache" / "agents" / fingerprint
    return RuntimeContext(
        repository=repository,
        ref=ref,
        conventions_out_dir=conventions_out_dir,
        local_tpl_dir=local_tpl_dir,
        remote_tpl_dir=remote_tpl_dir,
        conventions=tuple(conventions),
        fingerprint=fingerprint,
        checkout=checkout,
    )


def resolve_checkout(repo_root: Path, fingerprint: str) -> Path:
    checkout = repo_root / ".cache" / "agents" / fingerprint
    if not checkout.exists():
        raise ValidationError(f"checkout pinado ausente: {checkout}")
    if not is_git_repository(checkout):
        raise ValidationError(f"checkout pinado inválido: {checkout}")
    return checkout


def validate_convention_source(source_path: Path) -> tuple[str, tuple[str, ...]]:
    try:
        text = read_text(source_path)
    except UnicodeDecodeError as exc:
        raise ValidationError(f"{source_path} não é UTF-8 válido") from exc
    lines = text.splitlines()
    h1_indices = [index for index, line in enumerate(lines) if line.startswith("# ")]
    if len(h1_indices) != 1:
        raise ValidationError(f"{source_path} deve conter exatamente um heading Markdown de nível 1")
    start_indices = [index for index, line in enumerate(lines) if line.strip() == AGENT_CARD_START]
    end_indices = [index for index, line in enumerate(lines) if line.strip() == AGENT_CARD_END]
    if len(start_indices) != 1 or len(end_indices) != 1:
        raise ValidationError(f"{source_path} deve conter exatamente um bloco AGENT-CARD")
    start = start_indices[0]
    end = end_indices[0]
    if start > end:
        raise ValidationError(f"{source_path} possui AGENT-CARD malformado")
    card_lines = [line.strip() for line in lines[start + 1 : end] if line.strip()]
    if not card_lines:
        raise ValidationError(f"{source_path} possui AGENT-CARD vazio")
    title = lines[h1_indices[0]][2:].strip()
    return title, tuple(card_lines)


def strip_agent_card(source_text: str) -> str:
    lines = normalize_text(source_text).splitlines()
    start_indices = [index for index, line in enumerate(lines) if line.strip() == AGENT_CARD_START]
    end_indices = [index for index, line in enumerate(lines) if line.strip() == AGENT_CARD_END]
    if len(start_indices) != 1 or len(end_indices) != 1:
        raise ValidationError("AGENT-CARD ausente ou ambíguo")
    start = start_indices[0]
    end = end_indices[0]
    if start > end:
        raise ValidationError("AGENT-CARD malformado")
    remove_end = end
    while remove_end + 1 < len(lines) and not lines[remove_end + 1].strip():
        remove_end += 1
    stripped_lines = lines[:start] + lines[remove_end + 1 :]
    return "\n".join(stripped_lines).rstrip() + "\n"


def resolve_convention_artifact(
    source_path: Path,
    source_root: Path,
    target_display: str,
    repo_root: Path,
    legacy_target_display: str | None = None,
) -> ConventionArtifact:
    target_path = resolve_public_target_path(repo_root, target_display)
    if legacy_target_display is None:
        legacy_target_display = target_display
    legacy_target_path = resolve_public_target_path(repo_root, legacy_target_display)
    if not source_path.is_file():
        raise ValidationError(f"fonte de convention ausente: {source_path}")

    try:
        source_display = source_path.resolve(strict=False).relative_to(source_root.resolve(strict=False)).as_posix()
    except ValueError as exc:
        raise ValidationError(f"fonte de convention fora da raiz de origem: {source_path}") from exc
    title, card_lines = validate_convention_source(source_path)
    rendered_text = strip_agent_card(read_text(source_path))
    return ConventionArtifact(
        title=title,
        target_path=target_path,
        target_display=target_display,
        legacy_target_path=legacy_target_path,
        source_path=source_path,
        source_display=source_display,
        agent_card_lines=card_lines,
        rendered_text=rendered_text,
    )


def resolve_convention_source_path(
    entry: ConventionEntry,
    repo_root: Path,
    checkout: Path,
    local_tpl_dir: str,
    remote_tpl_dir: str,
) -> Path:
    if has_path_traversal(entry.source):
        raise ValidationError(f"entrada de convention com path inseguro: {entry}")
    source_root = checkout if entry.origin == "remote" else repo_root
    tpl_dir = remote_tpl_dir if entry.origin == "remote" else local_tpl_dir
    source_base = convention_source_base(source_root, tpl_dir)
    source_path = (source_base / entry.source).resolve(strict=False)
    if not is_within(source_path, source_base):
        raise ValidationError(f"entrada {entry.origin} com from fora da raiz: {entry.source!r}")
    return source_path


def resolve_convention(
    entry: ConventionEntry,
    repo_root: Path,
    checkout: Path,
    out_dir: str,
    local_tpl_dir: str,
    remote_tpl_dir: str,
) -> ConventionArtifact:
    source_path = resolve_convention_source_path(entry, repo_root, checkout, local_tpl_dir, remote_tpl_dir)
    source_root = checkout if entry.origin == "remote" else repo_root
    tpl_dir = remote_tpl_dir if entry.origin == "remote" else local_tpl_dir
    target_display = expected_public_target(source_path, source_root, entry.origin, tpl_dir, out_dir)
    legacy_target_display = expected_legacy_public_target(source_path, source_root, entry.origin, tpl_dir, out_dir)
    return resolve_convention_artifact(
        source_path,
        source_root,
        target_display,
        repo_root,
        legacy_target_display,
    )


def resolve_convention_family(
    entry: ConventionEntry,
    repo_root: Path,
    checkout: Path,
    out_dir: str,
    local_tpl_dir: str,
    remote_tpl_dir: str,
) -> ConventionFamily:
    source_path = resolve_convention_source_path(entry, repo_root, checkout, local_tpl_dir, remote_tpl_dir)
    if not source_path.is_file():
        raise ValidationError(f"fonte de convention ausente: {source_path}")
    classification = classify_convention_filename(source_path.name, entry.origin)
    if classification is None:
        if entry.origin == "remote":
            raise ValidationError(f'entrada remote com from inválido: {entry.source!r}')
        raise ValidationError(f'entrada local com from inválido: {entry.source!r}')
    if classification[0] != "parent":
        if classification[0] == "child":
            raise ValidationError(f"pai inválido com '.' extra no basename: {entry.source!r}")
        if entry.origin == "remote":
            raise ValidationError(f'entrada remote com from inválido: {entry.source!r}')
        raise ValidationError(f'entrada local com from inválido: {entry.source!r}')

    source_root = checkout if entry.origin == "remote" else repo_root
    tpl_dir = remote_tpl_dir if entry.origin == "remote" else local_tpl_dir
    target_display = expected_public_target(source_path, source_root, entry.origin, tpl_dir, out_dir)
    legacy_target_display = expected_legacy_public_target(source_path, source_root, entry.origin, tpl_dir, out_dir)

    directory_scan = scan_convention_directory(source_path.parent, entry.origin)
    parent_root = classification[1]
    if directory_scan.parents.get(parent_root) != source_path:
        if entry.origin == "remote":
            raise ValidationError(f'entrada remote com from inválido: {entry.source!r}')
        raise ValidationError(f'entrada local com from inválido: {entry.source!r}')

    parent_artifact = resolve_convention_artifact(
        source_path,
        source_root,
        target_display,
        repo_root,
        legacy_target_display,
    )
    child_paths = directory_scan.children.get(parent_root, ())
    child_artifacts = tuple(
        resolve_convention_artifact(
            child_path,
            source_root,
            expected_public_target(child_path, source_root, entry.origin, tpl_dir, out_dir),
            repo_root,
            expected_legacy_public_target(child_path, source_root, entry.origin, tpl_dir, out_dir),
        )
        for child_path in child_paths
    )
    return ConventionFamily(parent=parent_artifact, children=child_artifacts)


def ensure_unique_convention_targets(artifacts: Iterable[ConventionArtifact]) -> None:
    targets: dict[str, list[ConventionArtifact]] = {}
    for artifact in artifacts:
        targets.setdefault(artifact.target_display, []).append(artifact)

    duplicate_targets = [
        (target_display, sorted(items, key=lambda artifact: artifact.source_display))
        for target_display, items in targets.items()
        if len(items) > 1
    ]
    if not duplicate_targets:
        return

    target_display, items = sorted(duplicate_targets, key=lambda item: item[0])[0]
    sources = ", ".join(f"'{artifact.source_display}'" for artifact in items)
    raise ValidationError(f"destino publicado duplicado: {target_display!r} ({sources})")


def remove_file_if_exists(path: Path) -> None:
    if path.is_symlink() or path.is_file():
        path.unlink()


def cleanup_legacy_targets(artifacts: Iterable[ConventionArtifact]) -> None:
    artifacts = tuple(artifacts)
    current_targets = {artifact.target_path for artifact in artifacts}
    seen_legacy_targets: set[Path] = set()
    for artifact in artifacts:
        legacy_target_path = artifact.legacy_target_path
        if legacy_target_path == artifact.target_path:
            continue
        if legacy_target_path in current_targets:
            continue
        if legacy_target_path in seen_legacy_targets:
            continue
        remove_file_if_exists(legacy_target_path)
        seen_legacy_targets.add(legacy_target_path)


def resolve_convention_families(
    repo_root: Path,
    checkout: Path,
    context: RuntimeContext,
) -> list[ConventionFamily]:
    return [
        resolve_convention_family(
            entry,
            repo_root,
            checkout,
            context.conventions_out_dir,
            context.local_tpl_dir,
            context.remote_tpl_dir,
        )
        for entry in context.conventions
    ]


def validate_convention_targets(
    repo_root: Path,
    checkout: Path,
    context: RuntimeContext,
) -> None:
    families = resolve_convention_families(repo_root, checkout, context)
    all_artifacts = [artifact for family in families for artifact in (family.parent, *family.children)]
    ensure_unique_convention_targets(all_artifacts)


def render_artifact_blocks(artifacts: Iterable[ConventionArtifact]) -> list[str]:
    output_lines: list[str] = []
    for index, artifact in enumerate(artifacts):
        if index:
            output_lines.append("")
        output_lines.append(f"### {artifact.title}")
        output_lines.append("")
        output_lines.append(f"Arquivo: `{artifact.target_display}`")
        if artifact.agent_card_lines:
            output_lines.append("")
            output_lines.extend(f"- {line}" for line in artifact.agent_card_lines)
    return output_lines


def render_agents_md(template_text: str, sections: Iterable[ConventionArtifact]) -> str:
    lines = normalize_text(template_text).splitlines()
    heading_index = None
    for index in range(len(lines) - 1, -1, -1):
        if lines[index].strip() == SECTION_HEADING:
            heading_index = index
            break
    if heading_index is None:
        prefix_lines = lines[:]
        prefix_lines.append("")
        prefix_lines.append(SECTION_HEADING)
        after_lines: list[str] = []
    else:
        prefix_lines = lines[: heading_index + 1]
        after_lines = lines[heading_index + 1 :]

    preamble_lines: list[str] = []
    for line in after_lines:
        if line.startswith("### "):
            break
        preamble_lines.append(line)
    if any(line.strip() for line in preamble_lines):
        section_body = trim_blank_edges(preamble_lines)
    else:
        section_body = list(SECTION_PREAMBLE)

    output_lines = trim_trailing_blank_lines(prefix_lines)
    output_lines.append("")
    output_lines.extend(section_body)

    rendered_sections = list(sections)
    if rendered_sections:
        output_lines.append("")
        output_lines.extend(render_artifact_blocks(rendered_sections))

    return "\n".join(trim_trailing_blank_lines(output_lines)).rstrip() + "\n"


def render_convention_with_subconventions(parent: ConventionArtifact, children: Iterable[ConventionArtifact]) -> str:
    rendered_children = list(children)
    if not rendered_children:
        return parent.rendered_text
    output_lines = trim_trailing_blank_lines(normalize_text(parent.rendered_text).splitlines())
    output_lines.append("")
    output_lines.append(SUBCONVENTION_SECTION_HEADING)
    output_lines.append("")
    output_lines.extend(render_artifact_blocks(rendered_children))
    return "\n".join(trim_trailing_blank_lines(output_lines)).rstrip() + "\n"


def trim_blank_edges(lines: list[str]) -> list[str]:
    result = list(lines)
    while result and not result[0].strip():
        result.pop(0)
    while result and not result[-1].strip():
        result.pop()
    return result


def trim_trailing_blank_lines(lines: list[str]) -> list[str]:
    result = list(lines)
    while result and not result[-1].strip():
        result.pop()
    return result


def prefix_generated_notice(text: str) -> str:
    body_lines = trim_blank_edges(normalize_text(text).splitlines())
    output_lines = list(GENERATED_NOTICE)
    if body_lines:
        output_lines.append("")
        output_lines.extend(body_lines)
    return "\n".join(trim_trailing_blank_lines(output_lines)).rstrip() + "\n"


def sync_repository(repo_root: Path) -> SyncOutcome:
    context = load_runtime_context(repo_root)
    checkout = resolve_checkout(repo_root, context.fingerprint)

    families = resolve_convention_families(repo_root, checkout, context)
    all_artifacts = [artifact for family in families for artifact in (family.parent, *family.children)]
    ensure_unique_convention_targets(all_artifacts)

    template_path = checkout / "templates" / "AGENTS.tpl.md"
    if not template_path.is_file():
        raise ValidationError(f"template AGENTS ausente: {template_path}")
    agents_text = prefix_generated_notice(render_agents_md(read_text(template_path), [family.parent for family in families]))

    changed_paths: list[Path] = []
    for family in families:
        parent_text = prefix_generated_notice(render_convention_with_subconventions(family.parent, family.children))
        if write_if_changed(family.parent.target_path, parent_text):
            changed_paths.append(family.parent.target_path)
        for child in family.children:
            child_text = prefix_generated_notice(child.rendered_text)
            if write_if_changed(child.target_path, child_text):
                changed_paths.append(child.target_path)

    agents_path = repo_root / "AGENTS.md"
    if write_if_changed(agents_path, agents_text):
        changed_paths.append(agents_path)

    cleanup_legacy_targets(all_artifacts)

    return SyncOutcome(written_paths=tuple(changed_paths))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Sincroniza AGENTS.md e as conventions publicadas a partir de agents-compose.yml"
    )
    parser.add_argument("--repo-root", type=Path, default=None, help="raiz do repositório consumidor")
    parser.add_argument(POST_BOOTSTRAP_ARG, action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    try:
        repo_root = find_repo_root(args.repo_root)
        if not args.post_bootstrap:
            context = load_runtime_context(repo_root)
            checkout = ensure_checkout(context.repository, context.ref, context.checkout)
            validate_convention_targets(repo_root, checkout, context)
            sync_local_skill_from_checkout(repo_root, checkout)
            return reexec_current_skill(repo_root)
        outcome = sync_repository(repo_root)
    except UpdateDocsError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    for path in outcome.written_paths:
        print(path.relative_to(repo_root).as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
