"""CureSync Backend - Medication schedule service.

Uses Supabase (user_medications, medication_schedules) as primary store.
Falls back to in-memory dict when Supabase is not configured.
"""
import uuid
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.models.schemas import MedicationCreate, MedicationUpdate, MedicationResponse


# Default user ID for MVP (no auth yet)
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"


class MedicationService:
    """Medication schedule management with APScheduler reminders.

    Primary: Supabase (user_medications + medication_schedules tables)
    Fallback: In-memory Python dict
    """

    def __init__(self):
        self._medications: dict[str, dict] = {}
        self._scheduler = BackgroundScheduler()
        self._scheduler_started = False
        self._db = None

    @property
    def db(self):
        """Lazy-load db_service."""
        if self._db is None:
            from app.services.db_service import db_service
            self._db = db_service
        return self._db

    def start_scheduler(self):
        """Start the background scheduler for medication reminders."""
        if not self._scheduler_started:
            self._scheduler.add_job(
                self._check_reminders,
                trigger=IntervalTrigger(minutes=1),
                id="medication_reminder",
                replace_existing=True,
            )
            self._scheduler.start()
            self._scheduler_started = True
            print("Medication reminder scheduler started.")

    def stop_scheduler(self):
        """Stop the background scheduler."""
        if self._scheduler_started:
            self._scheduler.shutdown(wait=False)
            self._scheduler_started = False
            print("Medication reminder scheduler stopped.")

    def _check_reminders(self):
        """Check if any medications are due now and log reminders."""
        now = datetime.now()
        current_time = now.strftime("%H:%M")

        if self.db.available:
            meds = self.db.get_user_medications(DEFAULT_USER_ID, active_only=True)
            for med in meds:
                drug_name = (
                    med.get("drugs", {}).get("generics", {}).get("name")
                    or med.get("drugs", {}).get("brand_name")
                    or med.get("medication_name")
                    or "Unknown"
                )
                for sched in med.get("medication_schedules", []):
                    sched_time = sched.get("time_of_day", "")
                    if sched_time and sched_time[:5] == current_time:
                        print(f"[REMINDER] {now.strftime('%Y-%m-%d %H:%M')} - Time to take: {drug_name} ({med.get('dosage', '')})")
        else:
            for med_id, med in self._medications.items():
                if not med.get("active", True):
                    continue
                for time_str in med.get("times", []):
                    if time_str == current_time:
                        print(f"[REMINDER] {now.strftime('%Y-%m-%d %H:%M')} - Time to take: {med['name']} ({med['dosage']})")

    # ── CRUD Operations ─────────────────────────────────────────────────────

    def create_medication(self, data: MedicationCreate, user_id: str = DEFAULT_USER_ID) -> MedicationResponse:
        """Add a new medication to the schedule."""
        if self.db.available:
            return self._create_medication_db(data, user_id)
        return self._create_medication_memory(data)

    def get_all_medications(self, active_only: bool = True, user_id: str = DEFAULT_USER_ID) -> list[MedicationResponse]:
        """Get all scheduled medications."""
        if self.db.available:
            return self._get_all_medications_db(active_only, user_id)
        return self._get_all_medications_memory(active_only)

    def get_medication(self, med_id: str, user_id: str = DEFAULT_USER_ID) -> MedicationResponse | None:
        """Get a single medication by ID."""
        if self.db.available:
            meds = self._get_all_medications_db(active_only=False, user_id=user_id)
            for m in meds:
                if m.id == med_id:
                    return m
            return None
        med = self._medications.get(med_id)
        if med:
            return MedicationResponse(**med)
        return None

    def update_medication(self, med_id: str, data: MedicationUpdate) -> MedicationResponse | None:
        """Update an existing medication."""
        if self.db.available:
            update_data = {}
            if data.name is not None:
                update_data["drug_id"] = data.name  # Would need generic lookup
            if data.dosage is not None:
                update_data["dosage"] = data.dosage
            if data.frequency is not None:
                update_data["frequency"] = data.frequency
            if not update_data:
                return self.get_medication(med_id)
            result = self.db.update_user_medication(med_id, update_data)
            if result:
                return self._db_row_to_response(result)
            return None

        # In-memory fallback
        med = self._medications.get(med_id)
        if not med:
            return None
        if data.name is not None:
            med["name"] = data.name
        if data.dosage is not None:
            med["dosage"] = data.dosage
        if data.frequency is not None:
            med["frequency"] = data.frequency
        if data.times is not None:
            med["times"] = data.times
        if data.notes is not None:
            med["notes"] = data.notes
        return MedicationResponse(**med)

    def delete_medication(self, med_id: str) -> bool:
        """Delete a medication from the schedule."""
        if self.db.available:
            return self.db.delete_user_medication(med_id)
        if med_id in self._medications:
            del self._medications[med_id]
            return True
        return False

    def deactivate_medication(self, med_id: str) -> MedicationResponse | None:
        """Mark a medication as inactive."""
        if self.db.available:
            result = self.db.update_user_medication(med_id, {"active": False})
            if result:
                return self._db_row_to_response(result)
            return None

        med = self._medications.get(med_id)
        if med:
            med["active"] = False
            return MedicationResponse(**med)
        return None

    # ── Supabase implementations ────────────────────────────────────────────

    def _create_medication_db(self, data: MedicationCreate, user_id: str) -> MedicationResponse:
        """Create medication in Supabase."""
        # Generate default times from frequency if times is empty
        times = data.times
        if not times and data.frequency:
            times = self._frequency_to_times(data.frequency)

        # Create user_medication row (store name directly for retrieval)
        med_data = {
            "user_id": user_id,
            "medication_name": data.name,
            "dosage": data.dosage,
            "frequency": data.frequency,
            "active": True,
            "start_date": datetime.now().strftime("%Y-%m-%d"),
        }
        result = self.db.create_user_medication(user_id, med_data)
        if not result:
            return self._create_medication_memory(data)

        med_id = result["id"]

        # Create schedule entries for each time
        for time_str in times:
            self.db.create_schedule(med_id, time_str)

        return MedicationResponse(
            id=med_id,
            name=data.name,
            dosage=data.dosage,
            frequency=data.frequency,
            times=times,
            notes=data.notes,
            active=True,
        )

    def _get_all_medications_db(self, active_only: bool, user_id: str) -> list[MedicationResponse]:
        """Get all medications from Supabase."""
        rows = self.db.get_user_medications(user_id, active_only)
        return [self._db_row_to_response(row) for row in rows]

    @staticmethod
    def _frequency_to_times(frequency: str) -> list[str]:
        """Convert a frequency string to default reminder times."""
        freq = frequency.lower()
        if "once" in freq or "1" in freq:
            return ["08:00"]
        elif "twice" in freq or "2" in freq:
            return ["08:00", "20:00"]
        elif "thrice" in freq or "3" in freq or "three" in freq:
            return ["08:00", "14:00", "20:00"]
        elif "4" in freq or "four" in freq:
            return ["06:00", "12:00", "18:00", "22:00"]
        return ["08:00"]

    @staticmethod
    def _db_row_to_response(row: dict) -> MedicationResponse:
        """Convert a Supabase user_medications row to MedicationResponse."""
        drug_info = row.get("drugs", {}) or {}
        generic_info = drug_info.get("generics", {}) or {}
        # Try drug relationship first, then fall back to stored medication_name
        name = (
            generic_info.get("name")
            or drug_info.get("brand_name")
            or row.get("medication_name")
            or "Unknown"
        )

        times = []
        for sched in row.get("medication_schedules", []):
            tod = sched.get("time_of_day", "")
            if tod:
                times.append(tod[:5])

        return MedicationResponse(
            id=str(row.get("id", "")),
            name=name,
            dosage=row.get("dosage", ""),
            frequency=row.get("frequency", ""),
            times=times,
            notes="",
            active=row.get("active", True),
        )

    # ── In-memory implementations ───────────────────────────────────────────

    def _create_medication_memory(self, data: MedicationCreate) -> MedicationResponse:
        med_id = str(uuid.uuid4())[:8]
        medication = {
            "id": med_id,
            "name": data.name,
            "dosage": data.dosage,
            "frequency": data.frequency,
            "times": data.times,
            "notes": data.notes,
            "active": True,
            "created_at": datetime.now().isoformat(),
        }
        self._medications[med_id] = medication
        return MedicationResponse(**medication)

    def _get_all_medications_memory(self, active_only: bool) -> list[MedicationResponse]:
        results = []
        for med in self._medications.values():
            if active_only and not med.get("active", True):
                continue
            results.append(MedicationResponse(**med))
        return results


# Singleton instance
medication_service = MedicationService()
