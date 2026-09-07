"""CureSync Backend - Drug database service for searching and interaction lookup.

Uses Supabase as primary data source with local JSON fallback.
"""
import json
from pathlib import Path
from app.config import settings
from app.models.schemas import DrugInfo, InteractionDetail


# Severity mapping: DB values -> local values
_SEVERITY_MAP = {
    "severe": "high",
    "contraindicated": "high",
    "moderate": "medium",
    "mild": "low",
    # Local JSON values pass through
    "high": "high",
    "medium": "medium",
    "low": "low",
}


class DrugService:
    """Service for drug search and interaction checking.

    Primary: Supabase (generics, drugs, drug_interactions tables)
    Fallback: Local JSON file (drugs_database.json)
    """

    def __init__(self):
        self._drugs: dict[str, dict] = {}
        self._aliases: dict[str, str] = {}           # lowercase common name -> generic name
        self._reverse_aliases: dict[str, str] = {}   # lowercase generic name -> display name
        self._load_local_database()
        self._load_aliases()

        # Lazy import to avoid circular dependency
        self._db = None

    @property
    def db(self):
        """Lazy-load db_service to avoid circular imports."""
        if self._db is None:
            from app.services.db_service import db_service
            self._db = db_service
        return self._db

    def _load_local_database(self):
        """Load drugs from the local JSON database file (fallback)."""
        db_path = settings.DRUGS_DB_PATH
        if not db_path.exists():
            print(f"WARNING: Drug database not found at {db_path}")
            return

        with open(db_path, "r", encoding="utf-8") as f:
            drugs_list = json.load(f)

        for drug in drugs_list:
            drug_id = drug["id"].lower()
            self._drugs[drug_id] = drug

        print(f"Loaded {len(self._drugs)} drugs from local JSON database.")

    def _load_aliases(self):
        """Load common/brand name -> generic name mappings."""
        alias_path = Path(__file__).parent.parent / "data" / "drug_aliases.json"
        if not alias_path.exists():
            return
        with open(alias_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        # Normalize keys to lowercase
        self._aliases = {k.lower(): v.lower() for k, v in raw.items()}
        # Build reverse map: generic -> first common name (title-cased)
        for common, generic in self._aliases.items():
            if generic not in self._reverse_aliases:
                self._reverse_aliases[generic] = common.title()
        print(f"Loaded {len(self._aliases)} drug name aliases.")

    # ── Search ──────────────────────────────────────────────────────────────

    def search(self, query: str, limit: int = 10) -> list[DrugInfo]:
        """Search drugs by name. Tries Supabase first, falls back to local JSON."""
        query_lower = query.lower().strip()
        if not query_lower:
            return []

        # Try exact alias match first
        resolved_query = self._aliases.get(query_lower, query_lower)

        # Try Supabase first
        if self.db.available:
            results = self.db.search_generics(resolved_query, limit)
            if results:
                return [self._enrich_drug_info(self._generic_to_drug_info(g)) for g in results]

            # If no exact alias match, try partial alias matches
            # e.g. "asp" -> find "aspirin" alias -> resolve to "acetylsalicylic acid"
            if resolved_query == query_lower:
                for alias_key, generic_name in self._aliases.items():
                    if query_lower in alias_key and len(query_lower) >= 2:
                        partial_results = self.db.search_generics(generic_name, limit)
                        if partial_results:
                            return [self._enrich_drug_info(self._generic_to_drug_info(g)) for g in partial_results]

        # Fallback to local JSON
        results = []
        for drug_id, drug in self._drugs.items():
            name_lower = drug["name"].lower()
            if query_lower in name_lower or query_lower in drug_id or resolved_query in name_lower:
                results.append(self._enrich_drug_info(DrugInfo(**drug)))
                if len(results) >= limit:
                    break

        return results

    def get_drug(self, drug_id: str) -> DrugInfo | None:
        """Get a single drug by ID."""
        # Try Supabase
        if self.db.available:
            generic = self.db.get_generic_by_id(drug_id)
            if generic:
                return self._generic_to_drug_info(generic)

        # Fallback
        drug = self._drugs.get(drug_id.lower())
        if drug:
            return DrugInfo(**drug)
        return None

    def find_by_name(self, name: str) -> DrugInfo | None:
        """Find a drug by exact or close name match."""
        name_lower = name.lower().strip()

        # Try Supabase first
        if self.db.available:
            generic = self.db.get_generic_by_name(name)
            if generic:
                return self._generic_to_drug_info(generic)

        # Fallback to local JSON
        # Try exact ID match first
        if name_lower in self._drugs:
            return DrugInfo(**self._drugs[name_lower])

        # Try name match
        for drug_id, drug in self._drugs.items():
            if drug["name"].lower() == name_lower:
                return DrugInfo(**drug)

        # Try partial match
        for drug_id, drug in self._drugs.items():
            if name_lower in drug["name"].lower() or drug["name"].lower() in name_lower:
                return DrugInfo(**drug)

        return None

    # ── Interactions ────────────────────────────────────────────────────────

    def check_interactions(self, medicine_names: list[str]) -> tuple[list[InteractionDetail], bool, str]:
        """
        Check interactions between a list of medicines.
        Tries Supabase drug_interactions table first, falls back to local JSON.
        Returns: (interactions list, has_emergency, emergency_message)
        """
        # Try Supabase path
        if self.db.available:
            db_interactions = self._check_interactions_supabase(medicine_names)
            if db_interactions is not None:
                interactions, has_emergency, emergency_message = db_interactions
                if interactions:
                    return interactions, has_emergency, emergency_message
                # If Supabase returned empty but medicines were found, still return
                # (no interactions found is a valid result)
                if any(self.db.get_generic_by_name(n) for n in medicine_names):
                    return interactions, has_emergency, emergency_message

        # Fallback to local JSON
        return self._check_interactions_local(medicine_names)

    def _check_interactions_supabase(self, medicine_names: list[str]) -> tuple[list[InteractionDetail], bool, str] | None:
        """Check interactions using Supabase drug_interactions table."""
        # Resolve medicine names to generic IDs
        generics = []
        for name in medicine_names:
            generic = self.db.get_generic_by_name(name)
            if generic:
                generics.append(generic)

        if len(generics) < 2:
            return None

        generic_ids = [g["id"] for g in generics]
        raw_interactions = self.db.get_interactions(generic_ids)

        interactions: list[InteractionDetail] = []
        has_emergency = False
        emergency_drugs: list[str] = []

        for ix in raw_interactions:
            name_a = (ix.get("ga") or {}).get("name") or "Unknown"
            name_b = (ix.get("gb") or {}).get("name") or "Unknown"
            db_severity = ix.get("severity") or "mild"
            severity = _SEVERITY_MAP.get(db_severity, "low")

            detail = InteractionDetail(
                drug_a=name_a,
                drug_b=name_b,
                severity=severity,
                description=ix.get("clinical_effect") or ix.get("mechanism") or "No description available",
                recommendation=ix.get("recommendation") or self._get_recommendation(severity),
            )
            interactions.append(detail)

            if severity == "high":
                has_emergency = True
                emergency_drugs.append(f"{name_a} + {name_b}")

        emergency_message = ""
        if has_emergency:
            combos = "; ".join(emergency_drugs)
            emergency_message = (
                f"DANGEROUS INTERACTIONS DETECTED: {combos}. "
                "Please consult a healthcare professional immediately."
            )

        return interactions, has_emergency, emergency_message

    def _check_interactions_local(self, medicine_names: list[str]) -> tuple[list[InteractionDetail], bool, str]:
        """Check interactions using local JSON database."""
        interactions: list[InteractionDetail] = []
        has_emergency = False
        emergency_drugs: list[str] = []

        resolved: list[tuple[str, DrugInfo | None]] = []
        for name in medicine_names:
            drug = self.find_by_name(name)
            resolved.append((name, drug))

        for i in range(len(resolved)):
            for j in range(i + 1, len(resolved)):
                name_a, drug_a = resolved[i]
                name_b, drug_b = resolved[j]

                interaction = self._check_pair(name_a, drug_a, name_b, drug_b)
                if interaction:
                    interactions.append(interaction)
                    if interaction.severity == "high":
                        has_emergency = True
                        emergency_drugs.append(f"{interaction.drug_a} + {interaction.drug_b}")

        emergency_message = ""
        if has_emergency:
            combos = "; ".join(emergency_drugs)
            emergency_message = (
                f"DANGEROUS INTERACTIONS DETECTED: {combos}. "
                "Please consult a healthcare professional immediately."
            )

        return interactions, has_emergency, emergency_message

    def _check_pair(
        self, name_a: str, drug_a: DrugInfo | None, name_b: str, drug_b: DrugInfo | None
    ) -> InteractionDetail | None:
        """Check interaction between two drugs (local JSON only)."""
        if drug_a is None or drug_b is None:
            return None

        id_a = drug_a.id.lower()
        id_b = drug_b.id.lower()

        # Check A -> B interactions
        interactions_a = drug_a.interactions or {}
        if id_b in interactions_a:
            info = interactions_a[id_b]
            return InteractionDetail(
                drug_a=drug_a.name,
                drug_b=drug_b.name,
                severity=info["severity"],
                description=info["description"],
                recommendation=self._get_recommendation(info["severity"]),
            )

        # Check B -> A interactions
        interactions_b = drug_b.interactions or {}
        if id_a in interactions_b:
            info = interactions_b[id_a]
            return InteractionDetail(
                drug_a=drug_a.name,
                drug_b=drug_b.name,
                severity=info["severity"],
                description=info["description"],
                recommendation=self._get_recommendation(info["severity"]),
            )

        return None

    # ── Helpers ─────────────────────────────────────────────────────────────

    @staticmethod
    def _generic_to_drug_info(generic: dict) -> DrugInfo:
        """Convert a Supabase generic row to a DrugInfo model."""
        side_effects = []
        for se in generic.get("side_effects", []):
            side_effects.append(se.get("effect", ""))

        warnings = []
        for dg in generic.get("dosage_guidelines", []):
            if dg.get("notes"):
                warnings.append(dg["notes"])

        # Build interactions dict from drug_interactions if present
        interactions = {}

        # Extract brand drugs if present
        drugs = generic.get("drugs", [])
        drug_names = []
        if isinstance(drugs, list):
            for d in drugs:
                if d.get("brand_name"):
                    drug_names.append(d["brand_name"])

        dosages = []
        for dg in generic.get("dosage_guidelines", []):
            min_d = dg.get("min_dose", "")
            max_d = dg.get("max_dose", "")
            if min_d:
                dosages.append(min_d)
            if max_d and max_d != min_d:
                dosages.append(max_d)

        return DrugInfo(
            id=generic.get("id", ""),
            name=generic.get("name") or "Unknown",
            category=generic.get("therapeutic_class") or "",
            common_dosages=dosages or [],
            side_effects=side_effects or [],
            interactions=interactions,
            warnings=warnings or [],
            brand_names=drug_names,
        )

    def _enrich_drug_info(self, drug: DrugInfo) -> DrugInfo:
        """Inject common/brand name from aliases if brand_names is empty."""
        if not drug.brand_names:
            common_name = self._reverse_aliases.get(drug.name.lower())
            if common_name:
                drug.brand_names = [common_name]
        return drug

    @staticmethod
    def _get_recommendation(severity: str) -> str:
        """Generate recommendation based on severity."""
        if severity == "high":
            return "Consult a healthcare professional immediately. Do not combine without medical supervision."
        elif severity == "medium":
            return "Use with caution. Monitor for adverse effects and consult your doctor."
        else:
            return "Generally safe to combine. Monitor for any unusual symptoms."

    @property
    def all_drug_names(self) -> list[str]:
        """Get all drug names in the local database."""
        return [drug["name"] for drug in self._drugs.values()]


# Singleton instance
drug_service = DrugService()
