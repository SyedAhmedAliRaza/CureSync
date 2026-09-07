"""CureSync Backend - Supabase database client service."""
from supabase import create_client, Client
from app.config import settings


class DatabaseService:
    """Wrapper around the Supabase client for all database operations."""

    def __init__(self):
        self._client: Client | None = None
        self._admin_client: Client | None = None
        self._available = settings.has_supabase

        if self._available:
            try:
                self._client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_ANON_KEY,
                )
                print(f"Supabase connected: {settings.SUPABASE_URL}")
                # Create admin client with service_role key if available
                if settings.has_service_role_key:
                    self._admin_client = create_client(
                        settings.SUPABASE_URL,
                        settings.SUPABASE_SERVICE_ROLE_KEY,
                    )
                    print("Supabase admin client ready (service_role key)")
            except Exception as e:
                print(f"Supabase connection failed: {e}")
                self._available = False
                self._client = None
        else:
            print("Supabase not configured -- using local/in-memory fallbacks.")

    @property
    def available(self) -> bool:
        return self._available

    @property
    def client(self) -> Client | None:
        return self._client

    # ── Auth ──────────────────────────────────────────────────────────────────

    def signup(self, email: str, password: str, full_name: str = "") -> dict:
        """Sign up a new user via Supabase Auth.

        Creates the account only -- no session is returned because
        signup never logs the user in automatically. The user must
        log in separately.
        """
        if not self._client:
            raise RuntimeError("Supabase not configured")

        # Use admin client to create confirmed user (no email confirmation needed)
        if self._admin_client:
            try:
                user_data = {"full_name": full_name} if full_name else {}
                result = self._admin_client.auth.admin.create_user({
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": user_data,
                })
                user = result.user
                # No session on purpose: the user logs in separately
                return {
                    "access_token": "",
                    "refresh_token": "",
                    "user": {
                        "id": user.id,
                        "email": user.email or "",
                        "full_name": (user.user_metadata or {}).get("full_name", ""),
                    },
                    "email_confirmation_required": False,
                }
            except Exception as e:
                error_msg = str(e).lower()
                if "already" in error_msg or "duplicate" in error_msg or "registered" in error_msg:
                    raise RuntimeError("Email already registered")
                print(f"Admin signup error: {e}")
                raise

        # Fallback: regular sign_up (may require email confirmation)
        options = {}
        if full_name:
            options["data"] = {"full_name": full_name}
        result = self._client.auth.sign_up({
            "email": email,
            "password": password,
            "options": options,
        })
        response = self._auth_response_to_dict(result)
        # A missing session means the user must confirm their email before login
        response["email_confirmation_required"] = result.session is None
        return response

    def login(self, email: str, password: str) -> dict:
        """Sign in an existing user."""
        if not self._client:
            raise RuntimeError("Supabase not configured")
        result = self._client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        return self._auth_response_to_dict(result)

    def logout(self, access_token: str) -> None:
        """Sign out the current user."""
        if not self._client:
            return
        try:
            self._client.auth.sign_out(access_token)
        except Exception as e:
            print(f"DB logout error: {e}")

    def get_user_from_token(self, access_token: str) -> dict | None:
        """Get user info from a valid access token."""
        if not self._client:
            return None
        try:
            result = self._client.auth.get_user(access_token)
            user = result.user
            if not user:
                return None
            # Try to get profile for full_name
            full_name = ""
            try:
                profile = (
                    self._client.table("profiles")
                    .select("full_name")
                    .eq("id", user.id)
                    .single()
                    .execute()
                )
                if profile.data:
                    full_name = profile.data.get("full_name", "")
            except Exception:
                pass
            return {
                "id": user.id,
                "email": user.email or "",
                "full_name": full_name or (user.user_metadata or {}).get("full_name", ""),
            }
        except Exception as e:
            print(f"DB get_user_from_token error: {e}")
            return None

    @staticmethod
    def _auth_response_to_dict(result) -> dict:
        """Convert a Supabase AuthResponse to a dict."""
        user = result.user
        session = result.session
        return {
            "access_token": session.access_token if session else "",
            "refresh_token": session.refresh_token if session else "",
            "user": {
                "id": user.id,
                "email": user.email or "",
                "full_name": (user.user_metadata or {}).get("full_name", ""),
            },
        }

    # ── Generics / Drugs ────────────────────────────────────────────────────

    def search_generics(self, query: str, limit: int = 10) -> list[dict]:
        """Search generics by name (case-insensitive partial match)."""
        if not self._client:
            return []
        try:
            result = (
                self._client.table("generics")
                .select("*, drugs(*, pharma_companies(name))")
                .ilike("name", f"%{query}%")
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"DB search_generics error: {e}")
            return []

    def get_generic_by_id(self, generic_id: str) -> dict | None:
        """Get a single generic with its side effects and dosage guidelines."""
        if not self._client:
            return None
        try:
            result = (
                self._client.table("generics")
                .select("*, side_effects(*), dosage_guidelines(*)")
                .eq("id", generic_id)
                .single()
                .execute()
            )
            return result.data
        except Exception:
            return None

    def get_generic_by_name(self, name: str) -> dict | None:
        """Get a generic by exact or close name."""
        if not self._client:
            return None
        try:
            # Try exact match first
            result = (
                self._client.table("generics")
                .select("*, side_effects(*), dosage_guidelines(*)")
                .ilike("name", name)
                .limit(1)
                .execute()
            )
            if result.data:
                return result.data[0]
            return None
        except Exception:
            return None

    # ── Drug Interactions ───────────────────────────────────────────────────

    def get_interactions(self, generic_ids: list[str]) -> list[dict]:
        """Get all interactions between a set of generic IDs."""
        if not self._client or len(generic_ids) < 2:
            return []
        try:
            result = (
                self._client.table("drug_interactions")
                .select(
                    "*, "
                    "ga:generics!drug_interactions_generic_a_id_fkey(id, name), "
                    "gb:generics!drug_interactions_generic_b_id_fkey(id, name)"
                )
                .in_("generic_a_id", generic_ids)
                .in_("generic_b_id", generic_ids)
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"DB get_interactions error: {e}")
            return []

    # ── User Medications ────────────────────────────────────────────────────

    def get_user_medications(self, user_id: str, active_only: bool = True) -> list[dict]:
        """Get all medications for a user with schedules."""
        if not self._client:
            return []
        try:
            query = (
                self._client.table("user_medications")
                .select(
                    "*, drugs(brand_name, strength, dosage_form, generics(name)), "
                    "medication_schedules(*)"
                )
                .eq("user_id", user_id)
            )
            if active_only:
                query = query.eq("active", True)
            result = query.execute()
            return result.data or []
        except Exception as e:
            print(f"DB get_user_medications error: {e}")
            return []

    def create_user_medication(self, user_id: str, data: dict) -> dict | None:
        """Create a user medication entry."""
        if not self._client:
            return None
        try:
            data["user_id"] = user_id
            result = (
                self._client.table("user_medications")
                .insert(data)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB create_user_medication error: {e}")
            return None

    def update_user_medication(self, med_id: str, data: dict) -> dict | None:
        """Update a user medication."""
        if not self._client:
            return None
        try:
            result = (
                self._client.table("user_medications")
                .update(data)
                .eq("id", med_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB update_user_medication error: {e}")
            return None

    def delete_user_medication(self, med_id: str) -> bool:
        """Delete a user medication and its schedules."""
        if not self._client:
            return False
        try:
            self._client.table("medication_schedules").delete().eq(
                "user_medication_id", med_id
            ).execute()
            self._client.table("user_medications").delete().eq("id", med_id).execute()
            return True
        except Exception as e:
            print(f"DB delete_user_medication error: {e}")
            return False

    # ── Medication Schedules ────────────────────────────────────────────────

    def create_schedule(self, user_medication_id: str, time_of_day: str, days_of_week: list[int] | None = None) -> dict | None:
        """Create a medication schedule entry."""
        if not self._client:
            return None
        try:
            data = {
                "user_medication_id": user_medication_id,
                "time_of_day": time_of_day,
            }
            if days_of_week is not None:
                data["days_of_week"] = days_of_week
            result = (
                self._client.table("medication_schedules")
                .insert(data)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB create_schedule error: {e}")
            return None

    # ── Prescriptions ───────────────────────────────────────────────────────

    def create_prescription(self, user_id: str, source_type: str, raw_ocr_text: str = "", image_url: str = "") -> dict | None:
        """Create a prescription record."""
        if not self._client:
            return None
        try:
            result = (
                self._client.table("prescriptions")
                .insert({
                    "user_id": user_id,
                    "source_type": source_type,
                    "raw_ocr_text": raw_ocr_text,
                    "image_url": image_url,
                    "status": "processed",
                })
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB create_prescription error: {e}")
            return None

    def create_prescription_item(self, prescription_id: str, data: dict) -> dict | None:
        """Create a prescription item (individual medicine in a prescription)."""
        if not self._client:
            return None
        try:
            data["prescription_id"] = prescription_id
            result = (
                self._client.table("prescription_items")
                .insert(data)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB create_prescription_item error: {e}")
            return None

    # ── Chat ────────────────────────────────────────────────────────────────

    def create_chat_session(self, user_id: str) -> dict | None:
        """Create a new chat session."""
        if not self._client:
            return None
        try:
            result = (
                self._client.table("chat_sessions")
                .insert({"user_id": user_id})
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB create_chat_session error: {e}")
            return None

    def get_chat_history(self, session_id: str) -> list[dict]:
        """Get all messages in a chat session, ordered by creation time."""
        if not self._client:
            return []
        try:
            result = (
                self._client.table("chat_messages")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at")
                .execute()
            )
            return result.data or []
        except Exception as e:
            print(f"DB get_chat_history error: {e}")
            return []

    def save_chat_message(self, session_id: str, role: str, content: str, flagged_risk: bool = False) -> dict | None:
        """Save a chat message to a session."""
        if not self._client:
            return None
        try:
            result = (
                self._client.table("chat_messages")
                .insert({
                    "session_id": session_id,
                    "role": role,
                    "content": content,
                    "flagged_risk": flagged_risk,
                })
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"DB save_chat_message error: {e}")
            return None

    def list_chat_sessions(self, user_id: str) -> list[dict]:
        """List all chat sessions for a user with last message preview."""
        if not self._client:
            return []
        try:
            result = (
                self._client.table("chat_sessions")
                .select("id, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            sessions = result.data or []
            # Attach last message and count for each session
            for s in sessions:
                msgs = (
                    self._client.table("chat_messages")
                    .select("content")
                    .eq("session_id", s["id"])
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                count = (
                    self._client.table("chat_messages")
                    .select("id", count="exact")
                    .eq("session_id", s["id"])
                    .execute()
                )
                s["last_message"] = (msgs.data[0]["content"][:100] if msgs.data else "")
                s["message_count"] = len(count.data) if count.data else 0
                # Title from first user message
                first = (
                    self._client.table("chat_messages")
                    .select("content")
                    .eq("session_id", s["id"])
                    .eq("role", "user")
                    .order("created_at")
                    .limit(1)
                    .execute()
                )
                s["title"] = (first.data[0]["content"][:60] if first.data else "New Chat")
            return sessions
        except Exception as e:
            print(f"DB list_chat_sessions error: {e}")
            return []

    def get_chat_session(self, session_id: str) -> dict | None:
        """Get a chat session with all its messages."""
        if not self._client:
            return None
        try:
            session = (
                self._client.table("chat_sessions")
                .select("id, created_at")
                .eq("id", session_id)
                .single()
                .execute()
            )
            if not session.data:
                return None
            messages = (
                self._client.table("chat_messages")
                .select("id, role, content, created_at")
                .eq("session_id", session_id)
                .order("created_at")
                .execute()
            )
            return {
                "id": session.data["id"],
                "created_at": session.data["created_at"],
                "messages": messages.data or [],
            }
        except Exception as e:
            print(f"DB get_chat_session error: {e}")
            return None

    def delete_chat_session(self, session_id: str) -> bool:
        """Delete a chat session and all its messages."""
        if not self._client:
            return False
        try:
            self._client.table("chat_messages").delete().eq("session_id", session_id).execute()
            self._client.table("chat_sessions").delete().eq("id", session_id).execute()
            return True
        except Exception as e:
            print(f"DB delete_chat_session error: {e}")
            return False


# Singleton instance
db_service = DatabaseService()
