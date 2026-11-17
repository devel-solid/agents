#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath


SEMVER_RE = re.compile(r"^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
ALLOWED_EXACT_PATHS = {"AGENTS.md", "agents-compose.yml"}
ALLOWED_SKILL_PREFIX = ".agents/skills/update-docs/"


class UpdateVersionError(Exception):
    pass


class ManifestError(UpdateVersionError):
    pass


class ValidationError(UpdateVersionError):
    pass


class GitError(UpdateVersionError):
    pass


@dataclass(frozen=True)
class SemVer:
    major: int
    minor: int
    patch: int

    def bump(self, kind: str) -> "SemVer":
        if kind == "major":
            return SemVer(self.major + 1, 0, 0)
        if kind == "minor":
            return SemVer(self.major, self.minor + 1, 0)
        if kind == "patch":
            return SemVer(self.major, self.minor, self.patch + 1)
        raise ValidationError(f"bump inválido: {kind}")

    def render(self) -> str:
        return f"v{self.major}.{self.minor}.{self.patch}"


@dataclass(frozen=True)
class AgentsComposeField:
    index: int
    indent: int
    value: str
    comment: str


@dataclass(frozen=True)
class ChangedPath:
    status: str
    path: str


def normalize_text(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def read_text(path: Path) -> str:
    return normalize_text(path.read_text(encoding="utf-8"))


def write_text(path: Path, text: str) -> None:
    normalized = normalize_text(text)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(normalized if normalized.endswith("\n") else normalized + "\n")


def parse_semver(ref: str) -> SemVer:
    match = SEMVER_RE.fullmatch(ref.strip())
    if match is None:
        raise ValidationError(f"ref semver inválida: {ref}")
    return SemVer(*(int(part) for part in match.groups()))


def next_version(current_ref: str, bump: str) -> str:
    return parse_semver(current_ref).bump(bump).render()


def parse_scalar(token: str) -> str:
    token = token.strip()
    if len(token) >= 2 and token[0] == token[-1] and token[0] in {"'", '"'}:
        return token[1:-1]
    return token


def has_path_traversal(path_text: str) -> bool:
    return any(
        path.anchor or ".." in path.parts
        for path in (PurePosixPath(path_text), PureWindowsPath(path_text))
    )


def split_value_and_comment(text: str) -> tuple[str, str]:
    in_single = False
    in_double = False
    for index, char in enumerate(text):
        if char == "'" and not in_double:
            in_single = not in_single
            continue
        if char == '"' and not in_single:
            in_double = not in_double
            continue
        if char != "#" or in_single or in_double:
            continue
        if index == 0 or text[index - 1].isspace():
            return text[:index].rstrip(), text[index:]
    return text.rstrip(), ""


def find_repo_root(start: Path | None = None) -> Path:
    current = (start or Path.cwd()).resolve()
    if current.is_file():
        current = current.parent
    for candidate in (current, *current.parents):
        if (candidate / "agents-compose.yml").is_file():
            return candidate
    raise ManifestError("agents-compose.yml não encontrado")


def load_compose_lines(repo_root: Path) -> list[str]:
    compose_path = repo_root / "agents-compose.yml"
    if not compose_path.is_file():
        raise ManifestError("agents-compose.yml não encontrado")
    try:
        return read_text(compose_path).splitlines()
    except UnicodeDecodeError as exc:
        raise ManifestError("agents-compose.yml não é UTF-8 válido") from exc


def parse_agents_compose_fields(repo_root: Path) -> tuple[str, str, AgentsComposeField]:
    lines = load_compose_lines(repo_root)

    in_agents = False
    repository: str | None = None
    ref_field: AgentsComposeField | None = None

    for index, raw_line in enumerate(lines):
        if "\t" in raw_line:
            raise ManifestError("tabs de indentação não são permitidos")
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        if indent == 0:
            if stripped == "agents:":
                if in_agents:
                    raise ManifestError("bloco agents duplicado")
                in_agents = True
                continue
            if in_agents:
                break
            continue
        if not in_agents:
            continue
        if ":" not in stripped:
            continue
        key, remainder = stripped.split(":", 1)
        value_text, comment = split_value_and_comment(remainder)
        value = parse_scalar(value_text)
        if key == "repository":
            if repository is not None:
                raise ManifestError("agents.repository duplicado")
            if not value:
                raise ManifestError("agents.repository ausente ou inválido")
            repository = value
        elif key == "ref":
            if ref_field is not None:
                raise ManifestError("agents.ref duplicado")
            if not value:
                raise ManifestError("agents.ref ausente ou inválido")
            ref_field = AgentsComposeField(index=index, indent=indent, value=value, comment=comment)

    if not in_agents:
        raise ManifestError("bloco agents ausente")
    if repository is None:
        raise ManifestError("agents.repository ausente ou inválido")
    if ref_field is None:
        raise ManifestError("agents.ref ausente ou inválido")
    return repository, ref_field.value, ref_field


def load_conventions_out_dir(repo_root: Path) -> str:
    lines = load_compose_lines(repo_root)
    stack: list[tuple[int, str]] = []
    conventions_path = ("outputs", "AGENTS.md", "include", "conventions")
    out_dir_path = (*conventions_path, "out_dir")
    local_path = (*conventions_path, "local")
    remote_path = (*conventions_path, "remote")
    local_tpl_dir_path = (*local_path, "tpl_dir")
    remote_tpl_dir_path = (*remote_path, "tpl_dir")
    entries_path = (*conventions_path, "entries")
    conventions_seen = False
    local_seen = False
    remote_seen = False
    local_tpl_dir_seen = False
    remote_tpl_dir_seen = False
    entries_seen = False
    out_dir: str | None = None

    for raw_line in lines:
        if "\t" in raw_line:
            raise ManifestError("tabs de indentação não são permitidos")
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        while stack and indent <= stack[-1][0]:
            stack.pop()
        if stripped.startswith("- "):
            continue
        if ":" not in stripped:
            continue

        key, remainder = stripped.split(":", 1)
        key = key.strip()
        value_text, _comment = split_value_and_comment(remainder)
        value = parse_scalar(value_text)
        current_path = tuple(name for _, name in stack) + (key,)

        if current_path == conventions_path:
            conventions_seen = True
            if value:
                raise ManifestError('outputs["AGENTS.md"].include.conventions ausente ou inválido')
        elif current_path == out_dir_path:
            if not value or value in {"[]", "{}"}:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.out_dir ausente ou inválido')
            normalized_out_dir = Path(value.strip()).as_posix()
            if not normalized_out_dir:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.out_dir ausente ou inválido')
            out_dir = normalized_out_dir
        elif current_path == local_path:
            local_seen = True
            if value:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.local ausente ou inválido')
        elif current_path == remote_path:
            remote_seen = True
            if value:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.remote ausente ou inválido')
        elif current_path == local_tpl_dir_path:
            local_tpl_dir_seen = True
            if not value or value in {"[]", "{}"}:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.local.tpl_dir ausente ou inválido')
        elif current_path == remote_tpl_dir_path:
            remote_tpl_dir_seen = True
            if not value or value in {"[]", "{}"}:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.remote.tpl_dir ausente ou inválido')
        elif current_path == entries_path:
            entries_seen = True
            if value not in {"", "[]"}:
                raise ManifestError('outputs["AGENTS.md"].include.conventions.entries ausente ou inválido')

        if not value:
            stack.append((indent, key))

    if not conventions_seen:
        raise ManifestError('outputs["AGENTS.md"].include.conventions ausente ou inválido')
    if out_dir is None:
        raise ManifestError('outputs["AGENTS.md"].include.conventions.out_dir ausente ou inválido')
    if not local_seen:
        raise ManifestError('outputs["AGENTS.md"].include.conventions.local ausente ou inválido')
    if not remote_seen:
        raise ManifestError('outputs["AGENTS.md"].include.conventions.remote ausente ou inválido')
    if not local_tpl_dir_seen:
        raise ManifestError('outputs["AGENTS.md"].include.conventions.local.tpl_dir ausente ou inválido')
    if not remote_tpl_dir_seen:
        raise ManifestError('outputs["AGENTS.md"].include.conventions.remote.tpl_dir ausente ou inválido')
    if has_path_traversal(out_dir):
        raise ValidationError(f"out_dir inseguro: {out_dir!r}")
    if not entries_seen:
        raise ManifestError('outputs["AGENTS.md"].include.conventions.entries ausente ou inválido')
    return out_dir


def set_compose_ref(repo_root: Path, next_ref: str) -> bool:
    parse_semver(next_ref)
    compose_path = repo_root / "agents-compose.yml"
    current_text = read_text(compose_path)
    lines = current_text.splitlines()
    _, current_ref, ref_field = parse_agents_compose_fields(repo_root)
    if current_ref == next_ref:
        return False
    comment_suffix = f" {ref_field.comment}" if ref_field.comment else ""
    lines[ref_field.index] = f"{' ' * ref_field.indent}ref: {next_ref}{comment_suffix}".rstrip()
    updated = "\n".join(lines)
    write_text(compose_path, updated)
    return True


def run_git(repo_root: Path, *args: str) -> str:
    completed = subprocess.run(
        ["git", "-C", str(repo_root), *args],
        capture_output=True,
        text=True,
    )
    if completed.returncode == 0:
        return completed.stdout.rstrip("\n")
    message = completed.stderr.strip() or completed.stdout.strip()
    if not message:
        message = f"git {' '.join(args)} falhou"
    raise GitError(message)


def git_ref_exists(repo_root: Path, ref: str) -> bool:
    completed = subprocess.run(
        ["git", "-C", str(repo_root), "rev-parse", "--verify", "--quiet", ref],
        capture_output=True,
        text=True,
    )
    return completed.returncode == 0


def ensure_origin_remote(repo_root: Path) -> None:
    try:
        run_git(repo_root, "remote", "get-url", "origin")
    except GitError as exc:
        raise ValidationError("remote origin ausente ou inválido") from exc


def validate_state(
    repo_root: Path,
    expected_head: str,
    expected_branch: str,
    expected_current_ref: str,
    expected_origin_main_head: str,
    next_release_version: str,
) -> None:
    parse_semver(expected_current_ref)
    parse_semver(next_release_version)
    if expected_current_ref == next_release_version:
        raise ValidationError("a próxima versão precisa ser diferente da versão atual")

    ensure_origin_remote(repo_root)

    current_branch = run_git(repo_root, "branch", "--show-current")
    if current_branch != expected_branch:
        raise ValidationError(f"branch atual inválida: esperado {expected_branch}, encontrado {current_branch or '(detached)'}")

    status = run_git(repo_root, "status", "--porcelain", "--untracked-files=all")
    if status:
        raise ValidationError("a worktree precisa estar limpa antes da release")

    current_head = run_git(repo_root, "rev-parse", "HEAD")
    if current_head != expected_head:
        raise ValidationError("o HEAD mudou desde a proposta da release")

    _, current_ref, _ = parse_agents_compose_fields(repo_root)
    if current_ref != expected_current_ref:
        raise ValidationError(
            f"agents.ref mudou desde a proposta: esperado {expected_current_ref}, encontrado {current_ref}"
        )

    local_tag_ref = f"refs/tags/{next_release_version}"
    if git_ref_exists(repo_root, local_tag_ref):
        raise ValidationError(f"tag local já existe: {next_release_version}")

    remote_tag = run_git(repo_root, "ls-remote", "--tags", "--refs", "origin", local_tag_ref)
    if remote_tag:
        raise ValidationError(f"tag remota já existe: {next_release_version}")

    origin_main = "refs/remotes/origin/main"
    if not git_ref_exists(repo_root, f"{origin_main}^{{commit}}"):
        raise ValidationError("origin/main ausente; atualize a visão do remoto antes da release")

    current_origin_main_head = run_git(repo_root, "rev-parse", origin_main)
    if current_origin_main_head != expected_origin_main_head:
        raise ValidationError(
            "origin/main mudou desde a proposta da release: "
            f"esperado {expected_origin_main_head}, encontrado {current_origin_main_head}"
        )

    ahead_behind = run_git(repo_root, "rev-list", "--left-right", "--count", f"HEAD...{origin_main}")
    left_count_text, right_count_text = ahead_behind.split()
    left_count = int(left_count_text)
    right_count = int(right_count_text)
    if right_count > 0 and left_count > 0:
        raise ValidationError("o histórico local divergiu de origin/main")
    if right_count > 0:
        raise ValidationError("origin/main está à frente do HEAD local")


def is_allowed_release_path(path_text: str, conventions_out_dir: str) -> bool:
    path = Path(path_text).as_posix()
    if path in ALLOWED_EXACT_PATHS:
        return True
    if path.startswith(ALLOWED_SKILL_PREFIX):
        return True
    if not path.endswith(".md"):
        return False
    candidate = Path(path)
    out_dir = Path(conventions_out_dir)
    try:
        candidate.relative_to(out_dir)
    except ValueError:
        return False
    return True


def collect_changed_paths(repo_root: Path) -> list[ChangedPath]:
    status = run_git(repo_root, "status", "--porcelain=v1", "--untracked-files=all")
    paths: list[ChangedPath] = []
    for raw_line in normalize_text(status).splitlines():
        if not raw_line:
            continue
        if len(raw_line) < 4:
            raise ValidationError(f"linha inesperada do git status: {raw_line!r}")
        code = raw_line[:2]
        if code == "!!":
            continue
        path_fragment = raw_line[3:]
        if " -> " in path_fragment:
            source, destination = path_fragment.split(" -> ", 1)
            paths.extend(
                [
                    ChangedPath(status=code, path=source),
                    ChangedPath(status=code, path=destination),
                ]
            )
            continue
        paths.append(ChangedPath(status=code, path=path_fragment))
    return sorted(paths, key=lambda changed: changed.path)


def validate_release_paths(repo_root: Path) -> list[str]:
    conventions_out_dir = load_conventions_out_dir(repo_root)
    changed_paths = collect_changed_paths(repo_root)
    invalid_paths: list[str] = []
    for changed in changed_paths:
        if "R" in changed.status or "C" in changed.status:
            invalid_paths.append(changed.path)
            continue
        if "D" in changed.status and (
            changed.path in ALLOWED_EXACT_PATHS or changed.path.startswith(ALLOWED_SKILL_PREFIX)
        ):
            invalid_paths.append(changed.path)
            continue
        if not is_allowed_release_path(changed.path, conventions_out_dir):
            invalid_paths.append(changed.path)
    if invalid_paths:
        joined = ", ".join(invalid_paths)
        raise ValidationError(f"release gerou caminhos fora do escopo permitido: {joined}")
    return [changed.path for changed in changed_paths]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    next_version_parser = subparsers.add_parser("next-version")
    next_version_parser.add_argument("--current-ref", required=True)
    next_version_parser.add_argument("--bump", required=True, choices=("major", "minor", "patch"))

    validate_state_parser = subparsers.add_parser("validate-state")
    validate_state_parser.add_argument("--repo-root", type=Path)
    validate_state_parser.add_argument("--expected-head", required=True)
    validate_state_parser.add_argument("--expected-branch", required=True)
    validate_state_parser.add_argument("--expected-current-ref", required=True)
    validate_state_parser.add_argument("--expected-origin-main-head", required=True)
    validate_state_parser.add_argument("--next-version", required=True)

    set_compose_parser = subparsers.add_parser("set-compose-ref")
    set_compose_parser.add_argument("--repo-root", type=Path)
    set_compose_parser.add_argument("--next-ref", required=True)

    validate_paths_parser = subparsers.add_parser("validate-release-paths")
    validate_paths_parser.add_argument("--repo-root", type=Path)

    return parser


def resolve_repo_root(value: Path | None) -> Path:
    return find_repo_root(value or Path.cwd())


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.command == "next-version":
            print(next_version(args.current_ref, args.bump))
            return 0

        if args.command == "validate-state":
            repo_root = resolve_repo_root(args.repo_root)
            validate_state(
                repo_root,
                expected_head=args.expected_head,
                expected_branch=args.expected_branch,
                expected_current_ref=args.expected_current_ref,
                expected_origin_main_head=args.expected_origin_main_head,
                next_release_version=args.next_version,
            )
            return 0

        if args.command == "set-compose-ref":
            repo_root = resolve_repo_root(args.repo_root)
            changed = set_compose_ref(repo_root, args.next_ref)
            if changed:
                print(args.next_ref)
            return 0

        if args.command == "validate-release-paths":
            repo_root = resolve_repo_root(args.repo_root)
            for path in validate_release_paths(repo_root):
                print(path)
            return 0
    except UpdateVersionError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    parser.error(f"comando não suportado: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
