from __future__ import annotations

import importlib.util
import os
import stat
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = PROJECT_ROOT / ".agents" / "skills" / "update-docs" / "scripts" / "update_docs.py"


def load_module():
    spec = importlib.util.spec_from_file_location("update_docs", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("não foi possível carregar update_docs.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text if text.endswith("\n") else text + "\n")


def run_git(cwd: Path, *args: str) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise AssertionError(
            f"git {' '.join(args)} falhou: {completed.stderr.strip() or completed.stdout.strip()}"
        )
    return completed.stdout.strip()


def init_git_repo(root: Path) -> None:
    root.mkdir(parents=True, exist_ok=True)
    run_git(root, "init")


def build_convention_source(title: str, body: str, card_lines: list[str]) -> str:
    card = "\n".join(card_lines)
    return textwrap.dedent(
        f"""\
        # {title}

        {body}

        <!-- AGENT-CARD START -->
        {card}
        <!-- AGENT-CARD END -->
        """
    )


def build_manifest(
    repository: str,
    ref: str,
    out_dir: str,
    local_tpl_dir: str,
    remote_tpl_dir: str,
    entries: list[dict[str, str]],
) -> str:
    lines = [
        "agents:",
        f"  repository: {repository}",
        f"  ref: {ref}",
        "",
        "outputs:",
        "  AGENTS.md:",
        "    include:",
        "      conventions:",
        f"        out_dir: {out_dir}",
        "        local:",
        f"          tpl_dir: {local_tpl_dir}",
        "        remote:",
        f"          tpl_dir: {remote_tpl_dir}",
    ]
    if entries:
        lines.append("        entries:")
        for entry in entries:
            lines.extend(
                [
                    f"          - origin: {entry['origin']}",
                    f"            from: {entry['from']}",
                ]
            )
    else:
        lines.append("        entries: []")
    return "\n".join(lines) + "\n"


class UpdateDocsSkillTests(unittest.TestCase):
    def test_remove_path_handles_readonly_git_pack_files(self) -> None:
        cache = self.make_repo() / "cache"
        pack = cache / ".git" / "objects" / "pack" / "example.idx"
        write_text(pack, "objeto Git somente leitura\n")
        pack.chmod(stat.S_IREAD)

        self.module.remove_path(cache)

        self.assertFalse(cache.exists())

    def test_readonly_removal_retries_the_failed_unlink(self) -> None:
        path = self.make_repo() / "example.idx"
        write_text(path, "objeto Git\n")
        path.chmod(stat.S_IREAD)
        error = PermissionError("arquivo somente leitura")

        self.module.retry_readonly_remove(os.unlink, path, (type(error), error, None))

        self.assertFalse(path.exists())

    def test_readonly_removal_preserves_other_permission_errors(self) -> None:
        path = self.make_repo() / "example.idx"
        write_text(path, "arquivo gravável\n")
        error = PermissionError("permissão negada por outro motivo")

        with self.assertRaises(PermissionError) as raised:
            self.module.retry_readonly_remove(os.unlink, path, (type(error), error, None))

        self.assertIs(raised.exception, error)
        self.assertTrue(path.exists())

    def setUp(self) -> None:
        self.module = load_module()

    def make_repo(self) -> Path:
        tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(tempdir.cleanup)
        return Path(tempdir.name)

    def test_load_compose_rejects_tabs(self) -> None:
        repo_root = self.make_repo()
        write_text(
            repo_root / "agents-compose.yml",
            "agents:\n\trepository: git@example.com:org/agents.git\n\tref: deadbeef\n",
        )

        with self.assertRaises(self.module.ManifestError):
            self.module.load_compose(repo_root)

    def test_load_runtime_context_accepts_new_schema_and_normalizes_fields(self) -> None:
        repo_root = self.make_repo()
        repository = "git@example.com:org/agents.git"
        ref = "0123456789abcdef0123456789abcdef01234567"
        write_text(
            repo_root / "agents-compose.yml",
            build_manifest(
                repository,
                ref,
                "docs/conventions",
                "templates/docs/conventions-local",
                "templates/docs/conventions",
                [
                    {
                        "origin": "local",
                        "from": "sub-dir/contexto-do-projeto.tpl.md",
                    },
                    {
                        "origin": "remote",
                        "from": "grupo/padrao-de-mensagem-de-commit.tpl.md",
                    },
                ],
            ),
        )

        context = self.module.load_runtime_context(repo_root)

        self.assertEqual(context.repository, repository)
        self.assertEqual(context.ref, ref)
        self.assertEqual(context.conventions_out_dir, "docs/conventions")
        self.assertEqual(context.local_tpl_dir, "templates/docs/conventions-local")
        self.assertEqual(context.remote_tpl_dir, "templates/docs/conventions")
        self.assertEqual(context.fingerprint, self.module.compute_fingerprint(repository, ref))
        self.assertEqual(context.checkout, repo_root / ".cache" / "agents" / context.fingerprint)
        self.assertEqual(
            context.conventions,
            (
                self.module.ConventionEntry(
                    origin="local",
                    source="sub-dir/contexto-do-projeto.tpl.md",
                ),
                self.module.ConventionEntry(
                    origin="remote",
                    source="grupo/padrao-de-mensagem-de-commit.tpl.md",
                ),
            ),
        )

    def test_load_runtime_context_allows_empty_entries(self) -> None:
        repo_root = self.make_repo()
        write_text(
            repo_root / "agents-compose.yml",
            build_manifest(
                "git@example.com:org/agents.git",
                "deadbeef",
                "docs/conventions",
                "templates/docs/conventions-local",
                "templates/docs/conventions",
                [],
            ),
        )

        context = self.module.load_runtime_context(repo_root)

        self.assertEqual(context.conventions_out_dir, "docs/conventions")
        self.assertEqual(context.local_tpl_dir, "templates/docs/conventions-local")
        self.assertEqual(context.remote_tpl_dir, "templates/docs/conventions")
        self.assertEqual(context.conventions, tuple())

    def test_load_runtime_context_rejects_missing_or_invalid_out_dir(self) -> None:
        cases = [
            {
                "name": "missing",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                    """
                ),
            },
            {
                "name": "invalid-type",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: []
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                    """
                ),
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                write_text(repo_root / "agents-compose.yml", case["manifest"])
                with self.assertRaisesRegex(
                    self.module.ManifestError,
                    r'outputs\["AGENTS\.md"\]\.include\.conventions\.out_dir ausente ou inválido',
                ):
                    self.module.load_runtime_context(repo_root)

    def test_load_runtime_context_rejects_missing_source_root_blocks_or_tpl_dirs(self) -> None:
        cases = [
            {
                "name": "missing-local",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions\.local ausente ou inválido',
            },
            {
                "name": "missing-remote",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            entries: []
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions\.remote ausente ou inválido',
            },
            {
                "name": "missing-local-tpl-dir",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local: {}
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions\.local\.tpl_dir ausente ou inválido',
            },
            {
                "name": "missing-remote-tpl-dir",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote: {}
                            entries: []
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions\.remote\.tpl_dir ausente ou inválido',
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                write_text(repo_root / "agents-compose.yml", case["manifest"])
                with self.assertRaisesRegex(self.module.ManifestError, case["error"]):
                    self.module.load_runtime_context(repo_root)

    def test_load_runtime_context_rejects_missing_or_invalid_entries(self) -> None:
        cases = [
            {
                "name": "missing",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                    """
                ),
            },
            {
                "name": "invalid-type",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: {}
                    """
                ),
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                write_text(repo_root / "agents-compose.yml", case["manifest"])
                with self.assertRaisesRegex(
                    self.module.ManifestError,
                    r'outputs\["AGENTS\.md"\]\.include\.conventions\.entries ausente ou inválido',
                ):
                    self.module.load_runtime_context(repo_root)

    def test_load_runtime_context_rejects_unsafe_convention_directories(self) -> None:
        cases = [
            {
                "name": "out-dir",
                "manifest": build_manifest(
                    "git@example.com:org/agents.git",
                    "deadbeef",
                    "../docs/conventions",
                    "templates/docs/conventions-local",
                    "templates/docs/conventions",
                    [],
                ),
                "error": r"^out_dir inseguro",
                "exception": self.module.ValidationError,
            },
            {
                "name": "local-tpl-dir",
                "manifest": build_manifest(
                    "git@example.com:org/agents.git",
                    "deadbeef",
                    "docs/conventions",
                    "../templates/docs/conventions-local",
                    "templates/docs/conventions",
                    [],
                ),
                "error": r"^local\.tpl_dir inseguro",
                "exception": self.module.ValidationError,
            },
            {
                "name": "remote-tpl-dir",
                "manifest": build_manifest(
                    "git@example.com:org/agents.git",
                    "deadbeef",
                    "docs/conventions",
                    "templates/docs/conventions-local",
                    "../templates/docs/conventions",
                    [],
                ),
                "error": r"^remote\.tpl_dir inseguro",
                "exception": self.module.ValidationError,
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                write_text(repo_root / "agents-compose.yml", case["manifest"])
                with self.assertRaisesRegex(case["exception"], case["error"]):
                    self.module.load_runtime_context(repo_root)

    def test_load_runtime_context_rejects_invalid_entry_values(self) -> None:
        cases = [
            {
                "name": "origin-invalid",
                "entry": {
                    "origin": "side",
                    "from": "sub-dir/contexto-do-projeto.tpl.md",
                },
                "error": r"entrada de convention #1 possui origin inválido",
                "exception": self.module.ManifestError,
            },
            {
                "name": "from-empty",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries:
                              - origin: remote
                                from: "   "
                    """
                ),
                "error": r"entrada de convention #1 possui from ausente ou inválido",
                "exception": self.module.ManifestError,
            },
            {
                "name": "from-absolute",
                "entry": {
                    "origin": "remote",
                    "from": "/abs/fora.tpl.md",
                },
                "error": r"entrada de convention #1 possui from inseguro",
                "exception": self.module.ValidationError,
            },
            {
                "name": "from-traversal",
                "entry": {
                    "origin": "remote",
                    "from": "../fora.tpl.md",
                },
                "error": r"entrada de convention #1 possui from inseguro",
                "exception": self.module.ValidationError,
            },
            {
                "name": "from-missing-suffix",
                "entry": {
                    "origin": "remote",
                    "from": "sub-dir/fora.md",
                },
                "error": r"entrada de convention #1 possui from inválido",
                "exception": self.module.ManifestError,
            },
            {
                "name": "from-legacy-prefix",
                "entry": {
                    "origin": "remote",
                    "from": "templates/docs/conventions/alpha.tpl.md",
                },
                "error": r"entrada de convention #1 possui from inválido",
                "exception": self.module.ManifestError,
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                manifest = case.get("manifest")
                if manifest is None:
                    manifest = build_manifest(
                        "git@example.com:org/agents.git",
                        "deadbeef",
                        "docs/conventions",
                        "templates/docs/conventions-local",
                        "templates/docs/conventions",
                        [case["entry"]],
                    )
                write_text(repo_root / "agents-compose.yml", manifest)
                with self.assertRaisesRegex(case["exception"], case["error"]):
                    self.module.load_runtime_context(repo_root)

    def test_load_runtime_context_rejects_extra_keys_in_conventions_local_remote_and_entries(self) -> None:
        cases = [
            {
                "name": "conventions",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                            mode: strict
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions possui chaves inválidas: \'mode\'',
            },
            {
                "name": "local",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                              mode: strict
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions\.local possui chaves inválidas: \'mode\'',
            },
            {
                "name": "remote",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                              mode: strict
                            entries: []
                    """
                ),
                "error": r'outputs\["AGENTS\.md"\]\.include\.conventions\.remote possui chaves inválidas: \'mode\'',
            },
            {
                "name": "entry",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: deadbeef

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries:
                              - origin: remote
                                from: grupo/alpha.tpl.md
                                extra: value
                    """
                ),
                "error": r"entrada de convention #1 possui chaves inválidas: 'extra'",
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                write_text(repo_root / "agents-compose.yml", case["manifest"])
                with self.assertRaisesRegex(self.module.ManifestError, case["error"]):
                    self.module.load_runtime_context(repo_root)

    def test_load_runtime_context_rejects_legacy_schema_without_source_roots(self) -> None:
        repo_root = self.make_repo()
        write_text(
            repo_root / "agents-compose.yml",
            textwrap.dedent(
                """\
                agents:
                  repository: git@example.com:org/agents.git
                  ref: deadbeef

                outputs:
                  AGENTS.md:
                    include:
                      conventions:
                        out_dir: docs/conventions
                        entries:
                          - origin: remote
                            from: templates/docs/conventions/alpha.tpl.md
                """
            ),
        )

        with self.assertRaisesRegex(
            self.module.ManifestError,
            r'outputs\["AGENTS\.md"\]\.include\.conventions\.local ausente ou inválido',
        ):
            self.module.load_runtime_context(repo_root)

    def test_resolve_convention_source_path_and_expected_public_target_preserve_subdirectories_and_validate_root(
        self,
    ) -> None:
        repo_root = self.make_repo()
        checkout = repo_root / ".cache" / "agents" / "fingerprint"
        local_tpl_dir = "templates/docs/conventions-local"
        remote_tpl_dir = "templates/docs/conventions"
        local_source = repo_root / local_tpl_dir / "grupo" / "contexto-do-projeto.tpl.md"
        remote_source = checkout / remote_tpl_dir / "grupo" / "padrao-de-mensagem-de-commit.tpl.md"
        write_text(
            local_source,
            build_convention_source(
                "Contexto do Projeto",
                "Texto local.",
                ["origem local", "subdiretorio preservado"],
            ),
        )
        write_text(
            remote_source,
            build_convention_source(
                "Padrão de Mensagem de Commit",
                "Texto remoto.",
                ["origem remota", "subdiretorio preservado"],
            ),
        )

        local_entry = self.module.ConventionEntry(
            origin="local",
            source="grupo/contexto-do-projeto.tpl.md",
        )
        remote_entry = self.module.ConventionEntry(
            origin="remote",
            source="grupo/padrao-de-mensagem-de-commit.tpl.md",
        )

        resolved_local = self.module.resolve_convention_source_path(
            local_entry,
            repo_root,
            checkout,
            local_tpl_dir,
            remote_tpl_dir,
        )
        resolved_remote = self.module.resolve_convention_source_path(
            remote_entry,
            repo_root,
            checkout,
            local_tpl_dir,
            remote_tpl_dir,
        )

        self.assertEqual(resolved_local, local_source.resolve(strict=False))
        self.assertEqual(resolved_remote, remote_source.resolve(strict=False))
        self.assertEqual(
            self.module.expected_public_target(
                resolved_local,
                repo_root,
                "local",
                local_tpl_dir,
                "docs/conventions",
            ),
            "docs/conventions/grupo/contexto-do-projeto.md",
        )
        self.assertEqual(
            self.module.expected_public_target(
                resolved_remote,
                checkout,
                "remote",
                remote_tpl_dir,
                "docs/conventions",
            ),
            "docs/conventions/grupo/padrao-de-mensagem-de-commit.md",
        )

        missing_source = repo_root / local_tpl_dir / "grupo" / "faltante.tpl.md"
        missing_target = self.module.expected_public_target(
            missing_source,
            repo_root,
            "local",
            local_tpl_dir,
            "docs/conventions",
        )
        with self.assertRaisesRegex(self.module.ValidationError, r"fonte de convention ausente"):
            self.module.resolve_convention_artifact(missing_source, repo_root, missing_target, repo_root)

        escape_root = repo_root / local_tpl_dir / "escape"
        outside_root = repo_root / "external"
        outside_root.mkdir(parents=True, exist_ok=True)
        escape_root.symlink_to(outside_root, target_is_directory=True)

        with self.assertRaisesRegex(self.module.ValidationError, r"entrada local com from fora da raiz"):
            self.module.resolve_convention_source_path(
                self.module.ConventionEntry(origin="local", source="escape/fora.tpl.md"),
                repo_root,
                checkout,
                local_tpl_dir,
                remote_tpl_dir,
            )

    def test_validate_convention_targets_uses_final_public_target_and_detects_collisions(self) -> None:
        cases = [
            {
                "name": "no-collision-different-subdirs",
                "entries": [
                    {"origin": "local", "from": "grupo/alpha.tpl.md"},
                    {"origin": "remote", "from": "outro/alpha.tpl.md"},
                ],
                "files": {
                    "repo": {
                        "templates/docs/conventions-local/grupo/alpha.tpl.md": build_convention_source(
                            "Alpha Local",
                            "Texto local.",
                            ["card local"],
                        ),
                    },
                    "checkout": {
                        "templates/docs/conventions/outro/alpha.tpl.md": build_convention_source(
                            "Alpha Remote",
                            "Texto remoto.",
                            ["card remota"],
                        ),
                        "templates/AGENTS.tpl.md": "# AGENTS\n",
                    },
                },
            },
            {
                "name": "collision-same-final-target",
                "entries": [
                    {"origin": "local", "from": "grupo/alpha.tpl.md"},
                    {"origin": "remote", "from": "grupo/alpha.tpl.md"},
                ],
                "files": {
                    "repo": {
                        "templates/docs/conventions-local/grupo/alpha.tpl.md": build_convention_source(
                            "Alpha Local",
                            "Texto local.",
                            ["card local"],
                        ),
                    },
                    "checkout": {
                        "templates/docs/conventions/grupo/alpha.tpl.md": build_convention_source(
                            "Alpha Remote",
                            "Texto remoto.",
                            ["card remota"],
                        ),
                        "templates/AGENTS.tpl.md": "# AGENTS\n",
                    },
                },
                "error": r"destino publicado duplicado",
            },
        ]

        repository = "git@example.com:org/agents.git"
        ref = "0123456789abcdef0123456789abcdef01234567"
        fingerprint = self.module.compute_fingerprint(repository, ref)

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_repo()
                checkout = repo_root / ".cache" / "agents" / fingerprint
                init_git_repo(checkout)

                write_text(
                    repo_root / "agents-compose.yml",
                    build_manifest(
                        repository,
                        ref,
                        "docs/conventions",
                        "templates/docs/conventions-local",
                        "templates/docs/conventions",
                        case["entries"],
                    ),
                )

                for relative_path, content in case["files"]["repo"].items():
                    write_text(repo_root / relative_path, content)
                for relative_path, content in case["files"]["checkout"].items():
                    write_text(checkout / relative_path, content)

                context = self.module.load_runtime_context(repo_root)
                resolved_checkout = self.module.resolve_checkout(repo_root, context.fingerprint)

                if "error" in case:
                    with self.assertRaisesRegex(self.module.ValidationError, case["error"]):
                        self.module.validate_convention_targets(repo_root, resolved_checkout, context)
                else:
                    self.module.validate_convention_targets(repo_root, resolved_checkout, context)

    def test_resolve_convention_family_respects_relative_directory_boundaries(self) -> None:
        repo_root = self.make_repo()
        repository = "git@example.com:org/agents.git"
        ref = "fedcba9876543210fedcba9876543210fedcba98"
        fingerprint = self.module.compute_fingerprint(repository, ref)
        checkout = repo_root / ".cache" / "agents" / fingerprint
        init_git_repo(checkout)

        write_text(
            repo_root / "agents-compose.yml",
            build_manifest(
                repository,
                ref,
                "docs/conventions",
                "templates/docs/conventions-local",
                "templates/docs/conventions",
                [
                    {"origin": "local", "from": "grupo/pai.tpl.md"},
                    {"origin": "local", "from": "outro/pai.tpl.md"},
                ],
            ),
        )

        write_text(
            repo_root / "templates" / "docs" / "conventions-local" / "grupo" / "pai.tpl.md",
            build_convention_source("Pai", "Texto pai.", ["card pai"]),
        )
        write_text(
            repo_root / "templates" / "docs" / "conventions-local" / "grupo" / "pai.filho.tpl.md",
            build_convention_source("Filho", "Texto filho.", ["card filho"]),
        )
        write_text(
            repo_root / "templates" / "docs" / "conventions-local" / "outro" / "pai.tpl.md",
            build_convention_source("Pai Outro", "Texto pai outro.", ["card pai outro"]),
        )

        context = self.module.load_runtime_context(repo_root)
        resolved_checkout = self.module.resolve_checkout(repo_root, context.fingerprint)

        same_dir_family = self.module.resolve_convention_family(
            self.module.ConventionEntry(origin="local", source="grupo/pai.tpl.md"),
            repo_root,
            resolved_checkout,
            context.conventions_out_dir,
            context.local_tpl_dir,
            context.remote_tpl_dir,
        )
        self.assertEqual(len(same_dir_family.children), 1)
        self.assertEqual(
            same_dir_family.children[0].target_display,
            "docs/conventions/grupo/pai.filho.md",
        )

        different_dir_family = self.module.resolve_convention_family(
            self.module.ConventionEntry(origin="local", source="outro/pai.tpl.md"),
            repo_root,
            resolved_checkout,
            context.conventions_out_dir,
            context.local_tpl_dir,
            context.remote_tpl_dir,
        )
        self.assertEqual(different_dir_family.children, tuple())

    def test_sync_repository_publishes_nested_targets_and_generates_agents_md(self) -> None:
        repo_root = self.make_repo()
        repository = "git@example.com:org/agents.git"
        ref = "0123456789abcdef0123456789abcdef01234567"
        fingerprint = self.module.compute_fingerprint(repository, ref)
        checkout = repo_root / ".cache" / "agents" / fingerprint
        init_git_repo(checkout)

        write_text(
            repo_root / "agents-compose.yml",
            build_manifest(
                repository,
                ref,
                "docs/conventions",
                "templates/docs/conventions-local",
                "templates/docs/conventions",
                [
                    {"origin": "local", "from": "grupo/contexto-do-projeto.tpl.md"},
                    {"origin": "remote", "from": "outro/padrao-de-mensagem-de-commit.tpl.md"},
                ],
            ),
        )
        write_text(
            checkout / "templates" / "AGENTS.tpl.md",
            "# AGENTS\n",
        )
        write_text(
            repo_root / "templates" / "docs" / "conventions-local" / "grupo" / "contexto-do-projeto.tpl.md",
            build_convention_source(
                "Contexto do Projeto",
                "Texto local.",
                ["card local"],
            ),
        )
        write_text(
            repo_root / "templates" / "docs" / "conventions-local" / "grupo" / "contexto-do-projeto.extra.tpl.md",
            build_convention_source(
                "Contexto do Projeto Extra",
                "Texto filho local.",
                ["card filho local"],
            ),
        )
        write_text(
            checkout / "templates" / "docs" / "conventions" / "outro" / "padrao-de-mensagem-de-commit.tpl.md",
            build_convention_source(
                "Padrão de Mensagem de Commit",
                "Texto remoto.",
                ["card remoto"],
            ),
        )

        outcome = self.module.sync_repository(repo_root)
        expected_notice = (
            "> Arquivo gerado. Não edite manualmente.\n"
            "> Altere a fonte e o manifesto aplicáveis e use o fluxo público de publicação do repositório.\n\n"
        )

        self.assertEqual(
            {path.relative_to(repo_root).as_posix() for path in outcome.written_paths},
            {
                "AGENTS.md",
                "docs/conventions/grupo/contexto-do-projeto.md",
                "docs/conventions/grupo/contexto-do-projeto.extra.md",
                "docs/conventions/outro/padrao-de-mensagem-de-commit.md",
            },
        )

        agents_text = (repo_root / "AGENTS.md").read_text(encoding="utf-8")
        self.assertTrue(agents_text.startswith(expected_notice + "# AGENTS\n"))
        self.assertIn("## Quando ler as conventions", agents_text)
        self.assertIn("Arquivo: `docs/conventions/grupo/contexto-do-projeto.md`", agents_text)
        self.assertIn("Arquivo: `docs/conventions/outro/padrao-de-mensagem-de-commit.md`", agents_text)

        parent_text = (repo_root / "docs" / "conventions" / "grupo" / "contexto-do-projeto.md").read_text(
            encoding="utf-8"
        )
        self.assertTrue(parent_text.startswith(expected_notice))
        self.assertIn("## Quando ler as subconventions", parent_text)
        self.assertIn("### Contexto do Projeto Extra", parent_text)
        self.assertIn("Arquivo: `docs/conventions/grupo/contexto-do-projeto.extra.md`", parent_text)

        child_text = (repo_root / "docs" / "conventions" / "grupo" / "contexto-do-projeto.extra.md").read_text(
            encoding="utf-8"
        )
        self.assertTrue(child_text.startswith(expected_notice))

        remote_text = (
            repo_root / "docs" / "conventions" / "outro" / "padrao-de-mensagem-de-commit.md"
        ).read_text(encoding="utf-8")
        self.assertTrue(remote_text.startswith(expected_notice))

    def test_sync_repository_cleans_legacy_flat_targets_without_touching_current_targets(self) -> None:
        repo_root = self.make_repo()
        repository = "git@example.com:org/agents.git"
        ref = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        fingerprint = self.module.compute_fingerprint(repository, ref)
        checkout = repo_root / ".cache" / "agents" / fingerprint
        init_git_repo(checkout)

        write_text(
            repo_root / "agents-compose.yml",
            build_manifest(
                repository,
                ref,
                "docs/conventions",
                "templates/docs/conventions-local",
                "templates/docs/conventions",
                [
                    {"origin": "remote", "from": "grupo/alpha.tpl.md"},
                    {"origin": "remote", "from": "beta.tpl.md"},
                ],
            ),
        )
        write_text(
            checkout / "templates" / "AGENTS.tpl.md",
            "# AGENTS\n",
        )
        write_text(
            checkout / "templates" / "docs" / "conventions" / "grupo" / "alpha.tpl.md",
            build_convention_source(
                "Alpha",
                "Texto alpha.",
                ["card alpha"],
            ),
        )
        write_text(
            checkout / "templates" / "docs" / "conventions" / "beta.tpl.md",
            build_convention_source(
                "Beta",
                "Texto beta.",
                ["card beta"],
            ),
        )
        write_text(repo_root / "docs" / "conventions" / "alpha.md", "# Legacy Alpha\n")
        write_text(repo_root / "docs" / "conventions" / "beta.md", "# Legacy Beta\n")
        write_text(repo_root / "docs" / "conventions" / "outra" / "nao-remover.md", "# Keep\n")

        outcome = self.module.sync_repository(repo_root)

        self.assertEqual(
            {path.relative_to(repo_root).as_posix() for path in outcome.written_paths},
            {
                "AGENTS.md",
                "docs/conventions/grupo/alpha.md",
                "docs/conventions/beta.md",
            },
        )
        self.assertFalse((repo_root / "docs" / "conventions" / "alpha.md").exists())
        self.assertTrue((repo_root / "docs" / "conventions" / "grupo" / "alpha.md").is_file())
        self.assertTrue((repo_root / "docs" / "conventions" / "beta.md").is_file())
        self.assertTrue((repo_root / "docs" / "conventions" / "outra" / "nao-remover.md").is_file())


if __name__ == "__main__":
    unittest.main()
