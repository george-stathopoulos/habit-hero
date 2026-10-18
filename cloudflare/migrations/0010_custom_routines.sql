CREATE TABLE custom_routines (
 id TEXT PRIMARY KEY,family_id TEXT NOT NULL REFERENCES families(id),name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 60),
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(family_id,id)
);
CREATE TABLE child_routine_steps (
 family_id TEXT NOT NULL,child_id TEXT NOT NULL,habit_id TEXT NOT NULL,routine_key TEXT NOT NULL,step_order INTEGER NOT NULL CHECK(step_order BETWEEN 1 AND 100),updated_at TEXT NOT NULL,
 PRIMARY KEY(family_id,child_id,habit_id),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 FOREIGN KEY(family_id,habit_id) REFERENCES habits(family_id,id)
);
