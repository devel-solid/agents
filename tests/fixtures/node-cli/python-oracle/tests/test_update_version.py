from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = (
    PROJECT_ROOT / ".agents" / "skills" / "update-version" / "scripts" / "update_version.py"
)


def load_module():
    spec = importlib.util.spec_from_file_location("update_version", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("não foi possível carregar update_version.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text if text.endswith("\n") else text + "\n")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


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


def assert_validation_error_message(
    test_case: unittest.TestCase,
    context: unittest.case._AssertRaisesContext,
    expected_message: str,
) -> None:
    test_case.assertEqual(str(context.exception), expected_message)


def build_manifest(
    ref: str,
    repository: str = "git@example.com:org/agents.git",
    out_dir: str = "docs/conventions",
    local_tpl_dir: str = "templates/docs/conventions-local",
    remote_tpl_dir: str = "templates/docs/conventions",
    entries: list[dict[str, str]] | None = None,
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


class UpdateVersionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.module = load_module()

    def make_dir(self) -> Path:
        tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(tempdir.cleanup)
        return Path(tempdir.name)

    def init_repo(self, root: Path, files: dict[str, str]) -> str:
        root.mkdir(parents=True, exist_ok=True)
        run_git(root, "init")
        run_git(root, "config", "user.email", "codex@example.com")
        run_git(root, "config", "user.name", "Codex")
        for relative_path, content in files.items():
            write_text(root / relative_path, content)
        run_git(root, "add", "-A")
        run_git(root, "commit", "-m", "initial")
        return run_git(root, "rev-parse", "HEAD")

    def init_bare_origin(self, root: Path) -> None:
        run_git(root.parent, "init", "--bare", str(root))

    def clone_repo(self, source: Path, destination: Path) -> None:
        run_git(source.parent, "clone", str(source), str(destination))
        run_git(destination, "config", "user.email", "codex@example.com")
        run_git(destination, "config", "user.name", "Codex")
        run_git(destination, "checkout", "-B", "main", "origin/main")

    def setup_repo_with_origin(self) -> tuple[Path, Path]:
        origin = self.make_dir() / "origin.git"
        self.init_bare_origin(origin)

        seed = self.make_dir() / "seed"
        self.init_repo(
            seed,
            {
                "agents-compose.yml": build_manifest("v3.8.1", repository=str(origin)),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        run_git(seed, "branch", "-M", "main")
        run_git(seed, "remote", "add", "origin", str(origin))
        run_git(seed, "push", "-u", "origin", "main")
        run_git(origin, "symbolic-ref", "HEAD", "refs/heads/main")

        repo = self.make_dir() / "repo"
        self.clone_repo(origin, repo)
        return origin, repo

    def commit_file(self, repo: Path, relative_path: str, content: str, message: str) -> str:
        write_text(repo / relative_path, content)
        run_git(repo, "add", relative_path)
        run_git(repo, "commit", "-m", message)
        return run_git(repo, "rev-parse", "HEAD")

    def origin_main_head(self, repo: Path) -> str:
        return run_git(repo, "rev-parse", "refs/remotes/origin/main")

    def test_next_version_bumps_semver(self) -> None:
        self.assertEqual(self.module.next_version("v3.8.1", "patch"), "v3.8.2")
        self.assertEqual(self.module.next_version("v3.8.1", "minor"), "v3.9.0")
        self.assertEqual(self.module.next_version("v3.8.1", "major"), "v4.0.0")

    def test_next_version_rejects_invalid_ref(self) -> None:
        with self.assertRaises(self.module.ValidationError):
            self.module.next_version("3.8.1", "patch")

    def test_set_compose_ref_updates_only_agents_ref(self) -> None:
        repo_root = self.make_dir()
        write_text(
            repo_root / "agents-compose.yml",
            textwrap.dedent(
                """\
                agents:
                  repository: git@example.com:org/agents.git
                  ref: v3.8.1 # pin atual

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
                """
            ),
        )

        changed = self.module.set_compose_ref(repo_root, "v3.8.2")

        self.assertTrue(changed)
        self.assertEqual(
            read_text(repo_root / "agents-compose.yml"),
            textwrap.dedent(
                """\
                agents:
                  repository: git@example.com:org/agents.git
                  ref: v3.8.2 # pin atual

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
                """
            ),
        )

    def test_validate_state_accepts_clean_main_head_ahead_of_origin(self) -> None:
        _, repo = self.setup_repo_with_origin()
        origin_main_head = self.origin_main_head(repo)
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")

        self.module.validate_state(
            repo,
            expected_head=head,
            expected_branch="main",
            expected_current_ref="v3.8.1",
            expected_origin_main_head=origin_main_head,
            next_release_version="v3.8.2",
        )

    def test_validate_state_rejects_wrong_branch(self) -> None:
        _, repo = self.setup_repo_with_origin()
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")
        run_git(repo, "checkout", "-b", "feature/release")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=self.origin_main_head(repo),
                next_release_version="v3.8.2",
            )

    def test_validate_state_rejects_dirty_worktree(self) -> None:
        _, repo = self.setup_repo_with_origin()
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")
        write_text(repo / "dirty.txt", "sujo\n")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=self.origin_main_head(repo),
                next_release_version="v3.8.2",
            )

    def test_validate_state_rejects_head_drift(self) -> None:
        _, repo = self.setup_repo_with_origin()
        original_head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")
        self.commit_file(repo, "README.md", "release 2\n", "docs: altera release")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_state(
                repo,
                expected_head=original_head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=self.origin_main_head(repo),
                next_release_version="v3.8.2",
            )

    def test_validate_state_rejects_existing_tag(self) -> None:
        _, repo = self.setup_repo_with_origin()
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")
        run_git(repo, "tag", "v3.8.2")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=self.origin_main_head(repo),
                next_release_version="v3.8.2",
            )

    def test_validate_state_rejects_missing_origin(self) -> None:
        repo = self.make_dir() / "repo"
        head = self.init_repo(
            repo,
            {
                "agents-compose.yml": build_manifest("v3.8.1"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        run_git(repo, "branch", "-M", "main")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head="deadbeef",
                next_release_version="v3.8.2",
            )

    def test_validate_state_rejects_compose_drift(self) -> None:
        _, repo = self.setup_repo_with_origin()
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")
        self.module.set_compose_ref(repo, "v3.8.2")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=self.origin_main_head(repo),
                next_release_version="v3.8.3",
            )

    def test_validate_state_rejects_missing_origin_main(self) -> None:
        _, repo = self.setup_repo_with_origin()
        origin_main_head = self.origin_main_head(repo)
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")
        run_git(repo, "update-ref", "-d", "refs/remotes/origin/main")

        with self.assertRaises(self.module.ValidationError) as context:
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=origin_main_head,
                next_release_version="v3.8.2",
            )

        assert_validation_error_message(
            self,
            context,
            "origin/main ausente; atualize a visão do remoto antes da release",
        )

    def test_validate_state_rejects_origin_main_drift_since_proposal(self) -> None:
        origin, repo = self.setup_repo_with_origin()
        expected_origin_main_head = self.origin_main_head(repo)
        head = self.commit_file(repo, "README.md", "release\n", "docs: prepara release")

        other = self.make_dir() / "other"
        self.clone_repo(origin, other)
        self.commit_file(other, "REMOTE.md", "ahead\n", "docs: avança remoto")
        run_git(other, "push", "origin", "main")
        run_git(repo, "fetch", "origin")

        current_origin_main_head = self.origin_main_head(repo)

        with self.assertRaises(self.module.ValidationError) as context:
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=expected_origin_main_head,
                next_release_version="v3.8.2",
            )

        assert_validation_error_message(
            self,
            context,
            "origin/main mudou desde a proposta da release: "
            f"esperado {expected_origin_main_head}, encontrado {current_origin_main_head}",
        )

    def test_validate_state_rejects_origin_main_ahead(self) -> None:
        origin, repo = self.setup_repo_with_origin()
        head = run_git(repo, "rev-parse", "HEAD")

        other = self.make_dir() / "other"
        self.clone_repo(origin, other)
        self.commit_file(other, "REMOTE.md", "ahead\n", "docs: avança remoto")
        run_git(other, "push", "origin", "main")
        run_git(repo, "fetch", "origin")

        current_origin_main_head = self.origin_main_head(repo)

        with self.assertRaises(self.module.ValidationError) as context:
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=current_origin_main_head,
                next_release_version="v3.8.2",
            )

        assert_validation_error_message(
            self,
            context,
            "origin/main está à frente do HEAD local",
        )

    def test_validate_state_rejects_origin_main_divergent(self) -> None:
        origin, repo = self.setup_repo_with_origin()
        head = self.commit_file(repo, "README.md", "local\n", "docs: prepara release")

        other = self.make_dir() / "other"
        self.clone_repo(origin, other)
        self.commit_file(other, "REMOTE.md", "remote\n", "docs: altera remoto")
        run_git(other, "push", "origin", "main")
        run_git(repo, "fetch", "origin")

        current_origin_main_head = self.origin_main_head(repo)

        with self.assertRaises(self.module.ValidationError) as context:
            self.module.validate_state(
                repo,
                expected_head=head,
                expected_branch="main",
                expected_current_ref="v3.8.1",
                expected_origin_main_head=current_origin_main_head,
                next_release_version="v3.8.2",
            )

        assert_validation_error_message(
            self,
            context,
            "o histórico local divergiu de origin/main",
        )

    def test_validate_release_paths_accepts_only_release_outputs(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1", out_dir="docs/publicadas"),
                "AGENTS.md": "# AGENTS\n",
                ".agents/skills/update-docs/SKILL.md": "# skill\n",
                "docs/publicadas/alpha.md": "# Alpha\n",
            },
        )
        write_text(repo_root / "agents-compose.yml", build_manifest("v3.8.2", out_dir="docs/publicadas"))
        write_text(repo_root / "AGENTS.md", "# AGENTS atualizado\n")
        write_text(repo_root / "docs" / "publicadas" / "alpha.md", "# Alpha atualizado\n")
        write_text(repo_root / "docs" / "publicadas" / "grupo" / "alpha.md", "# Alpha grupo\n")
        write_text(repo_root / "docs" / "publicadas" / "outro" / "alpha.md", "# Alpha outro\n")
        write_text(repo_root / ".agents" / "skills" / "update-docs" / "scripts" / "update_docs.py", "print('ok')\n")

        changed_paths = self.module.validate_release_paths(repo_root)

        self.assertEqual(
            changed_paths,
            [
                ".agents/skills/update-docs/scripts/update_docs.py",
                "AGENTS.md",
                "agents-compose.yml",
                "docs/publicadas/alpha.md",
                "docs/publicadas/grupo/alpha.md",
                "docs/publicadas/outro/alpha.md",
            ],
        )

    def test_validate_release_paths_rejects_markdown_outside_configured_out_dir(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1", out_dir="docs/publicadas"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        write_text(repo_root / "docs" / "conventions" / "fora.md", "# Fora\n")

        with self.assertRaises(self.module.ValidationError) as context:
            self.module.validate_release_paths(repo_root)

        assert_validation_error_message(
            self,
            context,
            "release gerou caminhos fora do escopo permitido: docs/conventions/fora.md",
        )

    def test_validate_release_paths_accepts_created_nested_markdown_under_out_dir(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1", out_dir="docs/publicadas"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        write_text(repo_root / "agents-compose.yml", build_manifest("v3.8.2", out_dir="docs/publicadas"))
        write_text(repo_root / "AGENTS.md", "# AGENTS atualizado\n")
        write_text(repo_root / "docs" / "publicadas" / "grupo" / "alpha.md", "# Alpha\n")
        write_text(repo_root / "docs" / "publicadas" / "outro" / "alpha.md", "# Alpha outro\n")

        changed_paths = self.module.validate_release_paths(repo_root)

        self.assertEqual(
            changed_paths,
            [
                "AGENTS.md",
                "agents-compose.yml",
                "docs/publicadas/grupo/alpha.md",
                "docs/publicadas/outro/alpha.md",
            ],
        )

    def test_validate_release_paths_accepts_modified_nested_markdown_under_out_dir(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1", out_dir="docs/publicadas"),
                "AGENTS.md": "# AGENTS\n",
                "docs/publicadas/grupo/alpha.md": "# Alpha\n",
            },
        )
        write_text(repo_root / "agents-compose.yml", build_manifest("v3.8.2", out_dir="docs/publicadas"))
        write_text(repo_root / "AGENTS.md", "# AGENTS atualizado\n")
        write_text(repo_root / "docs" / "publicadas" / "grupo" / "alpha.md", "# Alpha atualizado\n")

        changed_paths = self.module.validate_release_paths(repo_root)

        self.assertEqual(
            changed_paths,
            [
                "AGENTS.md",
                "agents-compose.yml",
                "docs/publicadas/grupo/alpha.md",
            ],
        )

    def test_validate_release_paths_allows_deleted_nested_markdown_under_out_dir(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1", out_dir="docs/publicadas"),
                "AGENTS.md": "# AGENTS\n",
                "docs/publicadas/grupo/alpha.md": "# Alpha\n",
            },
        )
        (repo_root / "docs" / "publicadas" / "grupo" / "alpha.md").unlink()

        changed_paths = self.module.validate_release_paths(repo_root)

        self.assertEqual(changed_paths, ["docs/publicadas/grupo/alpha.md"])

    def test_validate_release_paths_rejects_old_conventions_schema(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: v3.8.1

                    outputs:
                      AGENTS.md:
                        include:
                          conventions: []
                    """
                ),
                "AGENTS.md": "# AGENTS\n",
            },
        )

        with self.assertRaises(self.module.ManifestError) as context:
            self.module.validate_release_paths(repo_root)

        assert_validation_error_message(
            self,
            context,
            'outputs["AGENTS.md"].include.conventions ausente ou inválido',
        )

    def test_load_conventions_out_dir_rejects_incomplete_conventions_schema(self) -> None:
        cases = [
            {
                "name": "missing-local",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: v3.8.1

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
                "error": 'outputs["AGENTS.md"].include.conventions.local ausente ou inválido',
            },
            {
                "name": "missing-remote",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: v3.8.1

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
                "error": 'outputs["AGENTS.md"].include.conventions.remote ausente ou inválido',
            },
            {
                "name": "missing-local-tpl-dir",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: v3.8.1

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              mode: strict
                            remote:
                              tpl_dir: templates/docs/conventions
                            entries: []
                    """
                ),
                "error": 'outputs["AGENTS.md"].include.conventions.local.tpl_dir ausente ou inválido',
            },
            {
                "name": "missing-remote-tpl-dir",
                "manifest": textwrap.dedent(
                    """\
                    agents:
                      repository: git@example.com:org/agents.git
                      ref: v3.8.1

                    outputs:
                      AGENTS.md:
                        include:
                          conventions:
                            out_dir: docs/conventions
                            local:
                              tpl_dir: templates/docs/conventions-local
                            remote:
                              mode: strict
                            entries: []
                    """
                ),
                "error": 'outputs["AGENTS.md"].include.conventions.remote.tpl_dir ausente ou inválido',
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                repo_root = self.make_dir() / "repo"
                write_text(repo_root / "agents-compose.yml", case["manifest"])

                with self.assertRaises(self.module.ManifestError) as context:
                    self.module.load_conventions_out_dir(repo_root)

                assert_validation_error_message(self, context, case["error"])

    def test_validate_release_paths_rejects_unsafe_out_dir(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1", out_dir="../docs/publicadas"),
                "AGENTS.md": "# AGENTS\n",
            },
        )

        with self.assertRaises(self.module.ValidationError) as context:
            self.module.validate_release_paths(repo_root)

        assert_validation_error_message(
            self,
            context,
            "out_dir inseguro: '../docs/publicadas'",
        )

    def test_validate_release_paths_rejects_deleted_agents_md(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        (repo_root / "AGENTS.md").unlink()

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_release_paths(repo_root)

    def test_validate_release_paths_rejects_deleted_agents_compose(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        (repo_root / "agents-compose.yml").unlink()

        with self.assertRaises(self.module.ManifestError) as context:
            self.module.validate_release_paths(repo_root)

        assert_validation_error_message(
            self,
            context,
            "agents-compose.yml não encontrado",
        )

    def test_validate_release_paths_rejects_deleted_update_docs_script(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1"),
                "AGENTS.md": "# AGENTS\n",
                ".agents/skills/update-docs/scripts/update_docs.py": "print('ok')\n",
            },
        )
        (repo_root / ".agents" / "skills" / "update-docs" / "scripts" / "update_docs.py").unlink()

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_release_paths(repo_root)

    def test_validate_release_paths_rejects_renamed_agents_md_out_of_scope(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        run_git(repo_root, "mv", "AGENTS.md", "AGENTS-renamed.md")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_release_paths(repo_root)

    def test_validate_release_paths_rejects_unrelated_files(self) -> None:
        repo_root = self.make_dir() / "repo"
        self.init_repo(
            repo_root,
            {
                "agents-compose.yml": build_manifest("v3.8.1"),
                "AGENTS.md": "# AGENTS\n",
            },
        )
        write_text(repo_root / "README.md", "fora do escopo\n")

        with self.assertRaises(self.module.ValidationError):
            self.module.validate_release_paths(repo_root)


if __name__ == "__main__":
    unittest.main()
