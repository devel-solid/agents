from __future__ import annotations

import difflib
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

from test_update_docs import (
    PROJECT_ROOT,
    build_convention_source,
    build_manifest,
    init_git_repo,
    load_module,
    run_git,
    write_text,
)


FIXTURE = PROJECT_ROOT / "tests" / "fixtures" / "shared_instruction_catalog"
SHARED = (
    "composicao-de-instrucoes-para-repositorios-consumidores.tpl.md",
    "seguranca-para-agentes-e-conteudo-nao-confiavel.tpl.md",
)
LOCAL_ROOT = "templates/docs/conventions-local"
REMOTE_ROOT = "templates/docs/conventions"
OUT_ROOT = "docs/conventions"
OPERATIONAL = "politica-operacional-do-repositorio.tpl.md"
NOTICE = "> Arquivo gerado. Não edite manualmente.\n"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_data(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def candidate_identity() -> dict:
    paths = [PROJECT_ROOT / "agents-compose.yml"]
    paths += sorted((PROJECT_ROOT / "templates").rglob("*.tpl.md"))
    paths += [
        PROJECT_ROOT / ".agents/skills/update-docs/scripts/update_docs.py",
        PROJECT_ROOT / "docs/guides/contratos-de-composicao.md",
    ]
    files = {
        path.relative_to(PROJECT_ROOT).as_posix(): digest(path.read_bytes().replace(b"\r\n", b"\n"))
        for path in sorted(paths)
    }
    canonical = json.dumps(files, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return {"sha256": digest(canonical), "files_sha256_lf": files}


def root_state() -> dict:
    # A preservação é medida antes/depois; não fixa o estado de futuras releases.
    paths = [PROJECT_ROOT / "AGENTS.md", PROJECT_ROOT / "agents-compose.yml"]
    for directory in ("docs/conventions", ".agents/skills", "bin"):
        paths += [p for p in (PROJECT_ROOT / directory).rglob("*") if p.is_file() and "__pycache__" not in p.parts]
    paths += [PROJECT_ROOT / name for name in ("package.json", "package-lock.json", "Makefile", "lefthook.yml", "openspec/config.yaml")]
    return {
        "files": {p.relative_to(PROJECT_ROOT).as_posix(): digest(p.read_bytes()) for p in paths},
        "head": run_git(PROJECT_ROOT, "rev-parse", "HEAD"),
        "tags": run_git(PROJECT_ROOT, "tag", "--list"),
        "remotes": run_git(PROJECT_ROOT, "remote", "-v"),
    }


def stage_profile(module, directory: Path, profile: str) -> Path:
    repo = directory / profile
    repo.mkdir(parents=True)
    context = module.load_runtime_context(PROJECT_ROOT)
    if profile == "local":
        entries = [{"origin": entry.origin, "from": entry.source} for entry in context.conventions]
        shutil.copytree(PROJECT_ROOT / LOCAL_ROOT, repo / LOCAL_ROOT)
    else:
        entries = [{"origin": "local", "from": "contexto-do-projeto.tpl.md"}]
        entries += [{"origin": "remote", "from": name} for name in SHARED]
        write_text(repo / LOCAL_ROOT / "contexto-do-projeto.tpl.md", build_convention_source(
            "Contexto do Consumidor", "Este projeto registra observações de pássaros.",
            ["Leia este documento antes de trabalhar no projeto de observação."]
        ))
    # Identidade de conteúdo, sem tag pública ou commit no repositório real.
    repository = "fixture-local:shared-instruction-catalog"
    ref = "candidate-" + candidate_identity()["sha256"]
    write_text(repo / "agents-compose.yml", build_manifest(
        repository, ref, OUT_ROOT, LOCAL_ROOT, REMOTE_ROOT, entries
    ))
    fingerprint = module.compute_fingerprint(repository, ref)
    checkout = repo / ".cache/agents" / fingerprint
    init_git_repo(checkout)
    shutil.copytree(PROJECT_ROOT / REMOTE_ROOT, checkout / REMOTE_ROOT)
    shutil.copyfile(PROJECT_ROOT / "templates/AGENTS.tpl.md", checkout / "templates/AGENTS.tpl.md")
    write_text(repo / OUT_ROOT / "anotacoes-do-consumidor.md", "Anotações próprias: não remover.\n")
    return repo


def generated_files(repo: Path) -> dict[str, bytes]:
    paths = [repo / "AGENTS.md", *sorted((repo / OUT_ROOT).rglob("*.md"))]
    return {
        p.relative_to(repo).as_posix(): p.read_bytes() for p in paths
        if p.name != "anotacoes-do-consumidor.md"
    }


def record_candidate() -> None:
    """Atualização explícita das evidências após revisão das fontes candidatas."""
    module = load_module()
    before = root_state()
    expected = {"candidate": candidate_identity(), "profiles": {}}
    baseline = json_data(FIXTURE / "baseline.json")
    with tempfile.TemporaryDirectory() as directory:
        for profile in ("neutral", "local"):
            repo = stage_profile(module, Path(directory), profile)
            module.sync_repository(repo)
            generated = generated_files(repo)
            expected["profiles"][profile] = {name: digest(data) for name, data in generated.items()}
            write_text(FIXTURE / f"{profile}-AGENTS.md", generated["AGENTS.md"].decode("utf-8"))
            diff = []
            old_names = {"AGENTS.md"} | set(baseline["export_exclusions"])
            old_names |= {name for name in generated if (PROJECT_ROOT / name).is_file()}
            for name in sorted(old_names | set(generated)):
                old = (PROJECT_ROOT / name).read_text(encoding="utf-8") if (PROJECT_ROOT / name).is_file() else ""
                new = generated.get(name, b"").decode("utf-8")
                diff.extend(difflib.unified_diff(old.splitlines(True), new.splitlines(True),
                    fromfile=f"development/{name}", tofile=f"candidate-{profile}/{name}"))
            write_text(FIXTURE / f"{profile}-generated.diff", "".join(diff))
    write_text(FIXTURE / "candidate.json", json.dumps(expected, ensure_ascii=False, indent=2))
    if root_state() != before:
        raise AssertionError("a captura candidata alterou o estado protegido da raiz")


class SharedInstructionCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.module = load_module()
        self.baseline = json_data(FIXTURE / "baseline.json")

    def test_candidate_identity_is_explicit_and_reproducible(self) -> None:
        self.assertEqual(candidate_identity(), json_data(FIXTURE / "candidate.json")["candidate"],
            "Fontes mudaram: revise o candidato antes de atualizar explicitamente a fixture.")

    def test_inventory_preserves_local_normative_content_and_retirement(self) -> None:
        context = self.module.load_runtime_context(PROJECT_ROOT)
        selections = {entry.source: entry.origin for entry in context.conventions}
        self.assertEqual({entry.source for entry in context.conventions if entry.origin == "remote"}, set(SHARED))
        self.assertEqual(len(self.baseline["source_inventory"]), 22)
        self.assertEqual(set(self.baseline["export_exclusions"]), {
            OUT_ROOT + "/contratos-de-artefatos-para-repositorios-consumidores" + suffix + ".md"
            for suffix in ("", ".agents-compose", ".arquivos-fonte", ".relacao-pai-filha")
        } | {OUT_ROOT + "/uuid-em-novas-implementacoes.md"})
        for entry in self.baseline["source_inventory"]:
            with self.subTest(source=entry["source"]):
                kind = entry["destination_kind"]
                if kind == "local":
                    destination = PROJECT_ROOT / entry["destination"]
                    self.assertEqual(digest(destination.read_bytes().replace(b"\r\n", b"\n")), entry["sha256_lf"])
                    self.module.validate_convention_source(destination)
                    if entry["source"] != entry["destination"]:
                        self.assertFalse((PROJECT_ROOT / entry["source"]).exists())
                    if destination.name.count(".") == 2:
                        self.assertEqual(selections[destination.name], "local")
                elif kind == "reference-only":
                    self.assertFalse((PROJECT_ROOT / entry["source"]).exists())
                    self.assertTrue((PROJECT_ROOT / entry["destination"]).is_file())
                elif kind == "retired":
                    self.assertFalse((PROJECT_ROOT / entry["source"]).exists())
                    self.assertFalse(list((PROJECT_ROOT / LOCAL_ROOT).glob("*uuid*")))
        self.assertEqual(context.conventions[0].source, "contexto-do-projeto.tpl.md")
        self.assertEqual(context.conventions[1].source, OPERATIONAL)
        policy = (PROJECT_ROOT / LOCAL_ROOT / OPERATIONAL).read_text(encoding="utf-8")
        for bullet in self.baseline["base_operational_bullets"]:
            self.assertIn(bullet, policy)

    def test_exact_two_shared_sources_have_valid_cards(self) -> None:
        sources = sorted((PROJECT_ROOT / REMOTE_ROOT).rglob("*.tpl.md"))
        self.assertEqual([path.name for path in sources], list(SHARED))
        for source in sources:
            self.module.validate_convention_source(source)

    def test_profiles_generate_discoverable_utf8_lf_and_stay_idempotent(self) -> None:
        before = root_state()
        self.addCleanup(lambda: self.assertEqual(root_state(), before))
        expected = json_data(FIXTURE / "candidate.json")["profiles"]
        with tempfile.TemporaryDirectory() as directory:
            for profile in ("neutral", "local"):
                with self.subTest(profile=profile):
                    repo = stage_profile(self.module, Path(directory), profile)
                    context = self.module.load_runtime_context(repo)
                    families = self.module.resolve_convention_families(repo, context.checkout, context)
                    outcome = self.module.sync_repository(repo)
                    generated = generated_files(repo)
                    self.assertEqual({name: digest(data) for name, data in generated.items()}, expected[profile])
                    self.assertEqual(len(outcome.written_paths), len(generated))
                    agents = generated["AGENTS.md"].decode("utf-8")
                    self.assertEqual(agents, (FIXTURE / f"{profile}-AGENTS.md").read_text(encoding="utf-8"))
                    for name, data in generated.items():
                        self.assertNotIn(b"\r", data, name)
                        self.assertTrue(data.endswith(b"\n"), name)
                        self.assertFalse(data.startswith(b"\xef\xbb\xbf"), name)
                        self.assertTrue(data.decode("utf-8").startswith(NOTICE), name)
                        self.assertNotIn("<!-- AGENT-CARD START -->", data.decode("utf-8").splitlines(), name)
                    for family in families:
                        self.assertIn(f"Arquivo: `{family.parent.target_display}`", agents)
                        for line in family.parent.agent_card_lines:
                            self.assertIn(line, agents)
                        parent = generated[family.parent.target_display].decode("utf-8")
                        for child in family.children:
                            self.assertIn(f"Arquivo: `{child.target_display}`", parent)
                            for line in child.agent_card_lines:
                                self.assertIn(line, parent)
                            self.assertIn(child.rendered_text.strip(), generated[child.target_display].decode("utf-8"))
                    self.assertFalse(set(generated) & set(self.baseline["export_exclusions"]))
                    combined = "\n".join(data.decode("utf-8") for data in generated.values())
                    if profile == "neutral":
                        self.assertEqual(len(families), 3)
                        self.assertIn("Contexto do Consumidor", agents)
                        self.assertIn("observações de pássaros", combined)
                        for forbidden in ("Lefthook", "masculino genérico", "Use `pt-BR`", "python3", "scope/autonomy", "política operacional", "UUID", "Conventional Commits", "O agente deve fazer somente"):
                            self.assertNotIn(forbidden, combined)
                    else:
                        operational = generated[OUT_ROOT + "/" + OPERATIONAL.replace(".tpl.md", ".md")].decode("utf-8")
                        for bullet in self.baseline["base_operational_bullets"]:
                            self.assertIn(bullet, operational)
                        for entry in self.baseline["source_inventory"]:
                            if entry["destination_kind"] == "local":
                                self.assertIn(entry["published"], generated)
                    mtimes = {name: (repo / name).stat().st_mtime_ns for name in generated}
                    self.assertEqual(self.module.sync_repository(repo).written_paths, ())
                    self.assertEqual({name: (repo / name).stat().st_mtime_ns for name in generated}, mtimes)
                    self.assertEqual((repo / OUT_ROOT / "anotacoes-do-consumidor.md").read_text(encoding="utf-8"), "Anotações próprias: não remover.\n")

    def test_arbitrary_local_family_and_company_catalog_are_not_limited_to_two(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = stage_profile(self.module, Path(directory), "neutral")
            context = self.module.load_runtime_context(repo)
            custom_entries = [{"origin": "local", "from": "grupo/politica.tpl.md"}]
            for name in ("alpha", "beta", "gamma"):
                custom_entries.append({"origin": "remote", "from": name + ".tpl.md"})
                write_text(context.checkout / REMOTE_ROOT / (name + ".tpl.md"), build_convention_source(name, "Regra da empresa.", ["Leia esta regra da empresa."]))
            write_text(repo / LOCAL_ROOT / "grupo/politica.tpl.md", build_convention_source("Política Própria", "Regra própria.", ["Leia a política própria."]))
            write_text(repo / LOCAL_ROOT / "grupo/politica.filho.tpl.md", build_convention_source("Detalhe Próprio", "Exceção própria.", ["Leia o detalhe próprio."]))
            write_text(repo / "agents-compose.yml", build_manifest(context.repository, context.ref, OUT_ROOT, LOCAL_ROOT, REMOTE_ROOT, custom_entries))
            for name in SHARED:
                (context.checkout / REMOTE_ROOT / name).unlink()
            self.module.sync_repository(repo)
            generated = generated_files(repo)
            self.assertEqual(len(generated), 6)
            self.assertIn("Arquivo: `docs/conventions/grupo/politica.filho.md`", generated[OUT_ROOT + "/grupo/politica.md"].decode("utf-8"))
            self.assertIn("Exceção própria.", generated[OUT_ROOT + "/grupo/politica.filho.md"].decode("utf-8"))

    def test_retired_sources_fail_visibly_without_substitution_or_output_changes(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = stage_profile(self.module, Path(directory), "neutral")
            context = self.module.load_runtime_context(repo)
            self.module.sync_repository(repo)
            before = generated_files(repo)
            for retired in self.baseline["export_exclusions"]:
                source = Path(retired).name.replace(".md", ".tpl.md")
                with self.subTest(source=source):
                    write_text(repo / "agents-compose.yml", build_manifest(context.repository, context.ref, OUT_ROOT, LOCAL_ROOT, REMOTE_ROOT, [{"origin": "remote", "from": source}]))
                    with self.assertRaisesRegex(self.module.ValidationError, "fonte de convention ausente") as raised:
                        self.module.sync_repository(repo)
                    self.assertIn(source, str(raised.exception))
                    self.assertEqual(generated_files(repo), before)


if __name__ == "__main__":
    if sys.argv[1:] == ["--record-candidate"]:
        record_candidate()
    else:
        unittest.main()
