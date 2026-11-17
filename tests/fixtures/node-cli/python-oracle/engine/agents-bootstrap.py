#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import shutil
import subprocess
import sys
from pathlib import Path


class BootstrapError(Exception):
    pass


class ManifestError(BootstrapError):
    pass


class ValidationError(BootstrapError):
    pass


class CheckoutError(BootstrapError):
    pass


def normalize_text(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def read_text(path: Path) -> str:
    return normalize_text(path.read_text(encoding="utf-8"))


def parse_scalar(token: str) -> str:
    token = token.strip()
    if len(token) >= 2 and token[0] == token[-1] and token[0] in {"'", '"'}:
        return token[1:-1]
    return token


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


def run_git(*args: str, cwd: Path | None = None) -> None:
    completed = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    if completed.returncode == 0:
        return
    message = completed.stderr.strip() or completed.stdout.strip()
    if not message:
        message = f"git {' '.join(args)} falhou"
    raise CheckoutError(message)


def refresh_checkout(checkout: Path) -> None:
    run_git("fetch", "--force", "--tags", "origin", cwd=checkout)


def parse_agents_compose(repo_root: Path) -> tuple[str, str]:
    compose_path = repo_root / "agents-compose.yml"
    if not compose_path.is_file():
        raise ManifestError("agents-compose.yml não encontrado")
    try:
        lines = read_text(compose_path).splitlines()
    except UnicodeDecodeError as exc:
        raise ManifestError("agents-compose.yml não é UTF-8 válido") from exc

    repository: str | None = None
    ref: str | None = None
    in_agents = False

    for raw_line in lines:
        if "\t" in raw_line:
            raise ManifestError("tabs de indentação não são permitidos")
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        if indent == 0:
            if stripped == "agents:":
                in_agents = True
                continue
            if in_agents:
                break
            continue
        if not in_agents:
            continue
        if ":" not in stripped:
            continue
        key, raw_value = stripped.split(":", 1)
        key = key.strip()
        value = parse_scalar(raw_value)
        if key == "repository":
            if repository is not None:
                raise ManifestError("agents.repository duplicado")
            repository = value
        elif key == "ref":
            if ref is not None:
                raise ManifestError("agents.ref duplicado")
            ref = value

    if not repository or not repository.strip():
        raise ManifestError("agents.repository ausente ou inválido")
    if not ref or not ref.strip():
        raise ManifestError("agents.ref ausente ou inválido")
    return repository, ref


def ref_exists(checkout: Path, ref: str) -> bool:
    completed = subprocess.run(
        ["git", "-C", str(checkout), "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"],
        capture_output=True,
        text=True,
    )
    return completed.returncode == 0


def ensure_checkout(repository: str, ref: str, checkout: Path) -> Path:
    if checkout.exists():
        if not is_git_repository(checkout):
            raise ValidationError(f"checkout pinado inválido: {checkout}")
        refresh_checkout(checkout)
    else:
        checkout.parent.mkdir(parents=True, exist_ok=True)
        run_git("clone", repository, str(checkout))

    if not ref_exists(checkout, ref):
        raise CheckoutError(f"ref pinada ausente no checkout: {ref}")
    run_git("-C", str(checkout), "checkout", "--force", "--detach", ref)
    return checkout


def remove_path(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    elif path.exists() or path.is_symlink():
        path.unlink()


def copy_skill(checkout: Path, repo_root: Path) -> Path:
    source = checkout / ".agents" / "skills" / "update-docs"
    if not source.is_dir():
        raise ValidationError(f"skill ausente no checkout pinado: {source}")
    destination = repo_root / ".agents" / "skills" / "update-docs"
    if destination.exists() or destination.is_symlink():
        remove_path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, destination)
    return destination


def bootstrap(repo_root: Path) -> Path:
    repository, ref = parse_agents_compose(repo_root)
    fingerprint = compute_fingerprint(repository, ref)
    checkout = repo_root / ".cache" / "agents" / fingerprint
    ensure_checkout(repository, ref, checkout)
    copy_skill(checkout, repo_root)
    return checkout


def main(script_path: Path | None = None) -> int:
    try:
        repo_root = find_repo_root(script_path or Path(__file__).resolve())
        bootstrap(repo_root)
    except BootstrapError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
