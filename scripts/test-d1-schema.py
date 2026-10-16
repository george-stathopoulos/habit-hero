#!/usr/bin/env python3
"""Offline validation for D1 migration v1 using SQLite semantics."""
import pathlib
import sqlite3
import unittest
from datetime import datetime, timezone

SCHEMA = pathlib.Path(__file__).resolve().parents[1] / "cloudflare/migrations/0001_initial.sql"
NOW = datetime.now(timezone.utc).isoformat()

class SchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys = ON")
        self.db.executescript(SCHEMA.read_text(encoding="utf-8"))
        self.db.execute("INSERT INTO families VALUES (?, ?, ?, ?, NULL)", ("f1", "Family 1", NOW, NOW))
        self.db.execute("INSERT INTO families VALUES (?, ?, ?, ?, NULL)", ("f2", "Family 2", NOW, NOW))
        self.db.execute("INSERT INTO parent_users VALUES (?, ?, ?, ?, ?, NULL)", ("p1", "parent1@example.test", "Parent", NOW, NOW))
        self.db.execute("INSERT INTO family_memberships VALUES (?, ?, ?, ?)", ("f1", "p1", "owner", NOW))
        self.db.execute("INSERT INTO child_profiles (id,family_id,display_name,created_at,updated_at) VALUES (?,?,?,?,?)", ("c1", "f1", "Kid", NOW, NOW))
        self.db.execute("INSERT INTO child_profiles (id,family_id,display_name,created_at,updated_at) VALUES (?,?,?,?,?)", ("c2", "f2", "Kid", NOW, NOW))
        self.db.execute("INSERT INTO habits (id,family_id,name_el,created_at,updated_at) VALUES (?,?,?,?,?)", ("h1", "f1", "Study", NOW, NOW))

    def tearDown(self):
        self.db.close()

    def test_reject_cross_family_habit_assignment(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO habit_assignments VALUES (?,?,?,?)", ("f1","h1","c2",NOW))

    def test_reject_cross_family_completion(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO completion_submissions
                (id,family_id,child_id,habit_id,occurrence_date,submitted_at,idempotency_key)
                VALUES (?,?,?,?,?,?,?)""", ("comp1","f1","c2","h1","2026-10-16",NOW,"request1"))

    def test_reject_cross_family_ledger(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO point_ledger
                (id,family_id,child_id,delta,reason,idempotency_key,created_at)
                VALUES (?,?,?,?,?,?,?)""", ("led1","f1","c2",10,"manual_adjustment","key",NOW))

    def test_ledger_immutable_and_idempotent(self):
        self.db.execute("""INSERT INTO point_ledger
            (id,family_id,child_id,delta,reason,idempotency_key,created_at)
            VALUES (?,?,?,?,?,?,?)""", ("led1","f1","c1",10,"manual_adjustment","key",NOW))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE point_ledger SET delta=999 WHERE id='led1'")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("DELETE FROM point_ledger WHERE id='led1'")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO point_ledger
                (id,family_id,child_id,delta,reason,idempotency_key,created_at)
                VALUES (?,?,?,?,?,?,?)""", ("led2","f1","c1",10,"manual_adjustment","key",NOW))

    def test_completion_parent_approval_must_belong_to_family(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO completion_submissions
                (id,family_id,child_id,habit_id,occurrence_date,status,points_awarded,
                submitted_at,reviewed_at,reviewed_by,idempotency_key)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                ("comp1","f2","c2","h1","2026-10-16","approved",10,NOW,NOW,"p1","key"))

    def test_valid_completion(self):
        self.db.execute("""INSERT INTO completion_submissions
            (id,family_id,child_id,habit_id,occurrence_date,submitted_at,idempotency_key)
            VALUES (?,?,?,?,?,?,?)""", ("comp1","f1","c1","h1","2026-10-16",NOW,"key"))
        self.assertEqual(self.db.execute("SELECT status FROM completion_submissions").fetchone()[0],"pending")

    def test_invalid_points_and_categories(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO reward_catalog (id,family_id,name_el,points_cost,created_at,updated_at) VALUES (?,?,?,?,?,?)",("r1","f1","Reward",-2,NOW,NOW))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO habits (id,family_id,name_el,frequency_type,created_at,updated_at) VALUES (?,?,?,?,?,?)",("h2","f1","Study","hourly",NOW,NOW))

    def test_relational_model_has_expected_tables(self):
        names={r[0] for r in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertTrue({"families","parent_users","family_memberships","child_profiles","habits","habit_assignments",
                         "completion_submissions","reward_catalog","reward_eligibility","reward_redemptions",
                         "point_ledger","auth_sessions","auth_challenges","audit_events"}.issubset(names))

if __name__ == "__main__":
    unittest.main()
