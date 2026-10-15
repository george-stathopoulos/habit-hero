from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import JSONResponse, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import hashlib
import secrets
import asyncio

# Push notification SDK
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)

# Brevo Email SDK
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'habit_hero')]

# Brevo Email Configuration
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@habit-hero.app')
BASE_URL = os.environ.get('BASE_URL', 'https://nav-polish.preview.emergentagent.com')

# Configure Brevo
brevo_config = sib_api_v3_sdk.Configuration()
brevo_config.api_key['api-key'] = BREVO_API_KEY

# Create the main app
app = FastAPI(title="Habit Hero API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class ParentCreate(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    pin: str  # 4-digit PIN

class Parent(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    pin_hash: str
    push_tokens: List[Dict[str, Any]] = []
    created_at: datetime

class ChildCreate(BaseModel):
    name: str
    gender: str  # "boy", "girl", "other"
    pin: str  # 4-digit PIN
    avatar_id: int = 1
    age: int = 8  # Age between 6-14

class Child(BaseModel):
    child_id: str
    parent_id: str
    name: str
    gender: str
    age: int = 8
    pin_hash: str
    avatar_id: int = 1
    avatar_level: int = 1
    total_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    badges: List[str] = []
    created_at: datetime

class ChildUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    avatar_id: Optional[int] = None
    age: Optional[int] = None

# Frequency types for habits
class FrequencyType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ONCE = "once"

# Weekly mode: either X times per week OR specific days
class WeeklyMode(str, Enum):
    COUNT = "count"      # X times per week (any day)
    SPECIFIC = "specific" # Specific days (Mon, Wed, Fri)

class HabitFrequency(BaseModel):
    frequency_type: str = "daily"  # daily, weekly, monthly, once
    frequency_count: int = 1       # how many times per period
    weekly_mode: str = "count"     # count or specific
    frequency_days: Optional[List[int]] = None  # for specific days [0=Sun, 1=Mon, ...]

class HabitCreate(BaseModel):
    name_el: str
    name_en: str
    points: int = 10
    category: str = "general"
    categories: Optional[List[str]] = None  # Support multiple categories
    verification_type: str = "self_reported"  # or "parent_verified"
    is_custom: bool = False
    emoji: str = "⭐"
    # Frequency settings
    frequency_type: str = "daily"
    frequency_count: int = 1
    weekly_mode: str = "count"
    frequency_days: Optional[List[int]] = None
    # Retry delay between completions (for ALL habits, not just parent_verified)
    retry_delay_value: Optional[int] = None  # e.g., 30
    retry_delay_unit: Optional[str] = None   # "minutes", "hours", "days"
    # Child assignments
    assigned_child_ids: Optional[List[str]] = None  # Assign to specific children on creation
    # Tips/Description fields (like presets)
    description_el: Optional[str] = None
    why_important_el: Optional[str] = None
    parent_tip_el: Optional[str] = None

class HabitUpdate(BaseModel):
    name_el: Optional[str] = None
    name_en: Optional[str] = None
    points: Optional[int] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None  # Support multiple categories
    verification_type: Optional[str] = None
    emoji: Optional[str] = None
    frequency_type: Optional[str] = None
    frequency_count: Optional[int] = None
    weekly_mode: Optional[str] = None
    frequency_days: Optional[List[int]] = None
    is_active: Optional[bool] = None
    # Retry delay between completions (for ALL habits)
    retry_delay_value: Optional[int] = None
    retry_delay_unit: Optional[str] = None
    # Child assignments
    assigned_child_ids: Optional[List[str]] = None  # Update child assignments
    # Tips/Description fields
    description_el: Optional[str] = None
    why_important_el: Optional[str] = None
    parent_tip_el: Optional[str] = None

# Custom category model
class CategoryCreate(BaseModel):
    name_el: str
    color: str = "#95A5A6"
    emoji: str = "📁"

class CategoryUpdate(BaseModel):
    name_el: Optional[str] = None
    color: Optional[str] = None
    emoji: Optional[str] = None

class Habit(BaseModel):
    habit_id: str
    parent_id: Optional[str] = None  # None for preset habits
    name_el: str
    name_en: str
    points: int
    category: str
    verification_type: str
    is_custom: bool
    is_active: bool = True
    emoji: str = "⭐"
    # Frequency settings
    frequency_type: str = "daily"
    frequency_count: int = 1
    weekly_mode: str = "count"
    frequency_days: Optional[List[int]] = None
    # For customized presets
    is_preset_modified: bool = False
    original_preset_id: Optional[str] = None
    created_at: datetime

class HabitCompletion(BaseModel):
    completion_id: str
    child_id: str
    habit_id: str
    date: str  # YYYY-MM-DD
    status: str  # "pending", "approved", "rejected"
    points_earned: int = 0
    completed_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class PendingApproval(BaseModel):
    completion_id: str
    child_id: str
    child_name: str
    habit_id: str
    habit_name: str
    date: str
    completed_at: datetime

class StreakInfo(BaseModel):
    habit_id: str
    habit_name: str
    current_streak: int
    longest_streak: int

class ChildHabitAssignment(BaseModel):
    child_id: str
    habit_ids: List[str]  # List of habit_ids assigned to this child

class Badge(BaseModel):
    badge_id: str
    name_el: str
    name_en: str
    description_el: str
    description_en: str
    icon: str
    requirement_type: str
    requirement_value: int

class PushTokenRegister(BaseModel):
    push_token: str
    platform: str
    device_name: Optional[str] = None

class PinLogin(BaseModel):
    pin: str

class ChildPinLogin(BaseModel):
    child_id: str
    pin: str

class RewardCreate(BaseModel):
    name_el: str
    name_en: str = ""
    description_el: str = ""
    points_cost: int = 50
    emoji: str = "🎁"
    child_ids: List[str] = []  # Empty = all children
    is_recurring: bool = True  # True = can be redeemed multiple times, False = one-off

class Reward(BaseModel):
    reward_id: str
    parent_id: str
    name_el: str
    name_en: str = ""
    description_el: str = ""
    points_cost: int
    emoji: str = "🎁"
    child_ids: List[str] = []  # Empty = all children
    is_recurring: bool = True
    is_active: bool = True
    created_at: datetime

# ==================== HELPER FUNCTIONS ====================

def get_gendered_text(gender: str, boy_text: str, girl_text: str) -> str:
    """Return gender-appropriate text in Greek"""
    if gender == "girl":
        return girl_text
    return boy_text  # Default to boy for "boy" or "other"

def get_gendered_hero(gender: str) -> str:
    """Return 'ήρωας' for boy or 'ηρωίδα' for girl"""
    return "ηρωίδα" if gender == "girl" else "ήρωας"

def get_gendered_super_hero(gender: str) -> str:
    """Return 'Σούπερ ήρωας' or 'Σούπερ ηρωίδα'"""
    return "Σούπερ ηρωίδα" if gender == "girl" else "Σούπερ ήρωας"

def get_gendered_champion(gender: str) -> str:
    """Return 'πρωταθλητής' or 'πρωταθλήτρια'"""
    return "πρωταθλήτρια" if gender == "girl" else "πρωταθλητής"

def get_gendered_adjective(gender: str, boy_adj: str, girl_adj: str) -> str:
    """Return gender-appropriate adjective"""
    return girl_adj if gender == "girl" else boy_adj

def hash_pin(pin: str) -> str:
    """Hash a 4-digit PIN"""
    return hashlib.sha256(pin.encode()).hexdigest()

def verify_pin(pin: str, pin_hash: str) -> bool:
    """Verify a PIN against its hash"""
    return hash_pin(pin) == pin_hash

async def get_session_token(request: Request) -> Optional[str]:
    """Extract session token from cookies or Authorization header"""
    # Try cookies first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Try Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    return None

async def get_current_parent(request: Request) -> Parent:
    """Get the current authenticated parent"""
    session_token = await get_session_token(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    parent = await db.parents.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    return Parent(**parent)

async def get_current_child_session(request: Request) -> Dict:
    """Get the current authenticated child session"""
    session_token = await get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.child_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

# ==================== PUSH NOTIFICATIONS ====================

async def send_push_notification(parent_id: str, title: str, body: str, data: dict = None):
    """Send push notification to a parent's registered devices"""
    try:
        # Get parent's push tokens
        parent = await db.parents.find_one(
            {"user_id": parent_id},
            {"push_tokens": 1}
        )
        
        if not parent or not parent.get("push_tokens"):
            logger.info(f"No push tokens found for parent {parent_id}")
            return {"sent": 0, "reason": "no_tokens"}
        
        tokens = parent["push_tokens"]
        active_tokens = [t for t in tokens if t.get("is_active", True)]
        
        if not active_tokens:
            logger.info(f"No active push tokens for parent {parent_id}")
            return {"sent": 0, "reason": "no_active_tokens"}
        
        # Create push client
        push_client = PushClient()
        messages = []
        
        for token_info in active_tokens:
            token = token_info.get("token")
            if token and token.startswith("ExponentPushToken"):
                messages.append(
                    PushMessage(
                        to=token,
                        title=title,
                        body=body,
                        data=data or {},
                        sound="default",
                        badge=1,
                    )
                )
        
        if not messages:
            return {"sent": 0, "reason": "no_valid_tokens"}
        
        # Send notifications
        try:
            tickets = push_client.publish_multiple(messages)
            
            # Process tickets to check for errors
            sent_count = 0
            for ticket in tickets:
                if ticket.status == "ok":
                    sent_count += 1
                else:
                    logger.warning(f"Push ticket error: {ticket.message}")
            
            logger.info(f"Sent {sent_count}/{len(messages)} push notifications to parent {parent_id}")
            return {"sent": sent_count, "total": len(messages)}
            
        except PushServerError as e:
            logger.error(f"Push server error: {e}")
            return {"sent": 0, "error": str(e)}
            
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return {"sent": 0, "error": str(e)}

# ==================== PRESET HABITS ====================

PRESET_HABITS = [
    {
        "name_el": "Βούρτσισμα δοντιών", 
        "name_en": "Brushing teeth", 
        "points": 10, 
        "category": "hygiene", 
        "verification_type": "parent_verified_optional",
        "description_el": "Βούρτσισε τα δοντάκια σου για 2 λεπτά, πάνω-κάτω και σε κύκλους! Έτσι τα δόντια σου θα είναι λαμπερά σαν αστέρια!",
        "why_important_el": "Τα δόντια μας μας βοηθούν να τρώμε και να χαμογελάμε. Αν τα φροντίζουμε, θα είναι δυνατά για πάντα!",
        "parent_tip_el": "Μπορείτε να βουρτσίζετε μαζί με το παιδί σας ή να βάλετε ένα τραγούδι 2 λεπτών.",
        "emoji": "🦷",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Πλύσιμο χεριών", 
        "name_en": "Washing hands", 
        "points": 5, 
        "category": "hygiene", 
        "verification_type": "self_reported",
        "description_el": "Βρέξε τα χέρια σου, βάλε σαπούνι και τρίψε τα για 20 δευτερόλεπτα (τραγούδα 'Χρόνια Πολλά' 2 φορές!). Ξέπλυνε και στέγνωσε!",
        "why_important_el": "Τα μικρόβια είναι αόρατα αλλά κάθονται παντού! Με καθαρά χέρια, μένουμε υγιείς και δυνατοί!",
        "parent_tip_el": "Κάντε το πλύσιμο παιχνίδι - ποιος κάνει τις περισσότερες φυσαλίδες;",
        "emoji": "🧼",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Στρώσιμο κρεβατιού", 
        "name_en": "Making bed", 
        "points": 10, 
        "category": "organization", 
        "verification_type": "self_reported",
        "description_el": "Τίναξε το σεντόνι, τέντωσε την κουβέρτα και τοποθέτησε τα μαξιλάρια. Το κρεβάτι σου θα μοιάζει σαν καινούργιο!",
        "why_important_el": "Ένα τακτοποιημένο δωμάτιο μας κάνει να νιώθουμε χαρούμενοι και έτοιμοι για περιπέτειες!",
        "parent_tip_el": "Στην αρχή στρώστε μαζί, δείχνοντας βήμα-βήμα. Σιγά-σιγά αφήστε το παιδί να το κάνει μόνο του.",
        "emoji": "🛏️",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Καθαρισμός δωματίου", 
        "name_en": "Cleaning room", 
        "points": 20, 
        "category": "organization", 
        "verification_type": "parent_verified_optional",
        "description_el": "Μάζεψε τα παιχνίδια, τα ρούχα στη θέση τους και τακτοποίησε το γραφείο σου. Είσαι σούπερ ήρωας της τάξης!",
        "why_important_el": "Σε ένα καθαρό δωμάτιο μπορούμε να παίξουμε καλύτερα και να βρίσκουμε τα πράγματά μας εύκολα!",
        "parent_tip_el": "Χωρίστε την εργασία σε μικρά βήματα: πρώτα τα παιχνίδια, μετά τα ρούχα κλπ.",
        "emoji": "🧹",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Κάνοντας τα μαθήματα", 
        "name_en": "Doing homework", 
        "points": 25, 
        "category": "education", 
        "verification_type": "parent_verified",
        "description_el": "Κάθισε σε ένα ήσυχο μέρος, άνοιξε τα βιβλία σου και κάνε τις ασκήσεις μία-μία. Μην ξεχάσεις να κάνεις μικρά διαλείμματα!",
        "why_important_el": "Τα μαθήματα μας κάνουν πιο έξυπνους και μας βοηθούν να μάθουμε νέα, συναρπαστικά πράγματα!",
        "parent_tip_el": "Δημιουργήστε μια σταθερή ρουτίνα μελέτης. Ένα ήσυχο μέρος χωρίς περισπασμούς βοηθάει πολύ.",
        "emoji": "📚",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Ανάγνωση 20–30 λεπτά", 
        "name_en": "Reading 20-30 min", 
        "points": 20, 
        "category": "education", 
        "verification_type": "self_reported",
        "description_el": "Διάλεξε ένα βιβλίο που σου αρέσει, βολέψου άνετα και ταξίδεψε σε μαγικούς κόσμους! Μπορείς να διαβάζεις δυνατά ή σιωπηλά.",
        "why_important_el": "Το διάβασμα μας ταξιδεύει σε φανταστικούς κόσμους, μας μαθαίνει νέες λέξεις και μας κάνει σούπερ έξυπνους!",
        "parent_tip_el": "Διαβάστε μαζί ή κάντε 'ώρα διαβάσματος' όπου όλη η οικογένεια διαβάζει ταυτόχρονα.",
        "emoji": "📖",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Ζωγραφική / Δημιουργική εργασία", 
        "name_en": "Drawing / Creative work", 
        "points": 15, 
        "category": "creativity", 
        "verification_type": "self_reported",
        "description_el": "Πάρε χαρτιά, μπογιές ή ό,τι σου αρέσει και δημιούργησε κάτι δικό σου! Μια ζωγραφιά, μια κατασκευή, ό,τι θέλεις!",
        "why_important_el": "Η δημιουργικότητα μας κάνει να σκεφτόμαστε διαφορετικά και να εκφράζουμε τα συναισθήματά μας!",
        "parent_tip_el": "Μην κρίνετε το αποτέλεσμα. Το σημαντικό είναι η διαδικασία και η χαρά της δημιουργίας.",
        "emoji": "🎨",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "30 λεπτά φυσική δραστηριότητα", 
        "name_en": "30 min physical activity", 
        "points": 20, 
        "category": "health", 
        "verification_type": "self_reported",
        "description_el": "Τρέξε, χόρεψε, παίξε μπάλα ή κάνε γυμναστική! Κίνησε το σώμα σου και διασκέδασε!",
        "why_important_el": "Η άσκηση κάνει τους μύες μας δυνατούς, την καρδιά μας υγιή και μας δίνει πολλή ενέργεια!",
        "parent_tip_el": "Συμμετέχετε! Οικογενειακοί περίπατοι ή παιχνίδια στο πάρκο είναι τέλεια.",
        "emoji": "🏃",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Μοιράζομαι με αδέρφια / φίλους", 
        "name_en": "Sharing with siblings/friends", 
        "points": 15, 
        "category": "social", 
        "verification_type": "self_reported",
        "description_el": "Μοιράσου ένα παιχνίδι, ένα σνακ ή τον χρόνο σου με κάποιον που αγαπάς!",
        "why_important_el": "Όταν μοιραζόμαστε, κάνουμε τους άλλους χαρούμενους και δημιουργούμε φιλίες που κρατούν για πάντα!",
        "parent_tip_el": "Επιβραβεύστε τη συμπεριφορά με λόγια: 'Είδα που μοιράστηκες, αυτό ήταν πολύ καλό!'",
        "emoji": "🤝",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Ανακύκλωση", 
        "name_en": "Recycling", 
        "points": 10, 
        "category": "environment", 
        "verification_type": "self_reported",
        "description_el": "Βάλε τα σκουπίδια στον σωστό κάδο: πλαστικά, χαρτιά, γυαλί. Σώζεις τον πλανήτη!",
        "why_important_el": "Η ανακύκλωση βοηθάει τη Γη μας να μείνει καθαρή και όμορφη για εμάς και τα ζωάκια!",
        "parent_tip_el": "Βάλτε χρωματιστούς κάδους στο σπίτι και κάντε το σαν παιχνίδι ταξινόμησης.",
        "emoji": "♻️",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Τακτοποίηση παιχνιδιών", 
        "name_en": "Tidying up toys", 
        "points": 10, 
        "category": "organization", 
        "verification_type": "self_reported",
        "description_el": "Μετά το παιχνίδι, μάζεψε τα παιχνίδια σου στη θέση τους. Κάθε παιχνίδι έχει το σπιτάκι του!",
        "why_important_el": "Έτσι δεν θα χάνονται τα αγαπημένα σου παιχνίδια και θα τα βρίσκεις πάντα!",
        "parent_tip_el": "Κάντε τραγούδι καθαρισμού: 'Ώρα για μάζεμα, ώρα για μάζεμα!'",
        "emoji": "🧸",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Καθαρισμός τραπεζιού μετά το φαγητό", 
        "name_en": "Cleaning table after meals", 
        "points": 10, 
        "category": "responsibility", 
        "verification_type": "self_reported",
        "description_el": "Πάρε το πιάτο σου και βάλε το στη θέση του. Σκούπισε τα ψίχουλα αν χρειάζεται!",
        "why_important_el": "Βοηθώντας στο σπίτι, δείχνουμε ότι νοιαζόμαστε για την οικογένειά μας!",
        "parent_tip_el": "Ξεκινήστε με μικρές εργασίες κατάλληλες για την ηλικία του παιδιού.",
        "emoji": "🍽️",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Προετοιμασία για ύπνο στην ώρα τους", 
        "name_en": "Getting ready for bed on time", 
        "points": 15, 
        "category": "routine", 
        "verification_type": "parent_verified_optional",
        "description_el": "Φόρα τις πιτζάμες σου, βούρτσισε τα δόντια και ετοιμάσου για όνειρα γεμάτα περιπέτεια!",
        "why_important_el": "Ο καλός ύπνος μας δίνει δύναμη για να παίξουμε και να μάθουμε την επόμενη μέρα!",
        "parent_tip_el": "Δημιουργήστε μια σταθερή ρουτίνα πριν τον ύπνο: μπάνιο, πιτζάμες, βιβλίο, ύπνος.",
        "emoji": "😴",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Πρωινό ξύπνημα στην ώρα του", 
        "name_en": "Waking up on time", 
        "points": 15, 
        "category": "routine", 
        "verification_type": "parent_verified_optional",
        "description_el": "Ξύπνα με το ξυπνητήρι, τεντώσου σαν γατάκι και ετοιμάσου για μια υπέροχη μέρα!",
        "why_important_el": "Ξυπνώντας στην ώρα μας, έχουμε χρόνο να ετοιμαστούμε χωρίς βιασύνη!",
        "parent_tip_el": "Βάλτε ένα αγαπημένο τραγούδι ως ξυπνητήρι. Κάντε το ξύπνημα κάτι θετικό.",
        "emoji": "🌅",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Φροντίδα κατοικίδιου", 
        "name_en": "Taking care of a pet", 
        "points": 20, 
        "category": "responsibility", 
        "verification_type": "parent_verified_optional",
        "description_el": "Δώσε φαγητό και νερό στο κατοικίδιό σου, παίξε μαζί του ή βούρτσισέ το!",
        "why_important_el": "Τα ζωάκια μας εξαρτώνται από εμάς. Φροντίζοντάς τα, μαθαίνουμε να νοιαζόμαστε!",
        "parent_tip_el": "Αναθέστε συγκεκριμένες εργασίες (π.χ. βάλε νερό) ανάλογα με την ηλικία.",
        "emoji": "🐕",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Συμμετοχή σε ομαδικά παιχνίδια", 
        "name_en": "Participating in group games", 
        "points": 15, 
        "category": "social", 
        "verification_type": "self_reported",
        "description_el": "Παίξε με τους φίλους σου ένα παιχνίδι που απολαμβάνουν όλοι. Θυμήσου: το σημαντικό είναι να διασκεδάζουμε!",
        "why_important_el": "Παίζοντας με άλλους, μαθαίνουμε να συνεργαζόμαστε και να κάνουμε φίλους!",
        "parent_tip_el": "Διοργανώστε playdates ή οικογενειακά παιχνίδια για να εξασκήσει κοινωνικές δεξιότητες.",
        "emoji": "⚽",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Φροντίδα φυτών", 
        "name_en": "Taking care of plants", 
        "points": 10, 
        "category": "responsibility", 
        "verification_type": "self_reported",
        "description_el": "Πότισε τα φυτά στο σπίτι ή στο μπαλκόνι. Πρόσεξε να μην πνίγεις τις ρίζες τους!",
        "why_important_el": "Τα φυτά μας δίνουν οξυγόνο και κάνουν το σπίτι μας πιο όμορφο!",
        "parent_tip_el": "Φυτέψτε μαζί ένα φυτό και αφήστε το παιδί υπεύθυνο για τη φροντίδα του.",
        "emoji": "🌱",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Βοήθεια σε μικρά αδέλφια", 
        "name_en": "Helping younger siblings", 
        "points": 20, 
        "category": "social", 
        "verification_type": "parent_verified_optional",
        "description_el": "Βοήθησε το μικρό σου αδελφάκι σε κάτι: ντύσιμο, παιχνίδι ή διάβασμα!",
        "why_important_el": "Είσαι το πρότυπο για τα μικρότερα αδέλφια σου. Δείχνοντάς τους, τα βοηθάς να μεγαλώσουν!",
        "parent_tip_el": "Επιβραβεύστε την υπομονή και τη βοήθεια. Μην το κάνετε υποχρέωση.",
        "emoji": "👫",
        "min_age": 7, "max_age": 14
    },
    {
        "name_el": "Δημιουργία κατασκευών", 
        "name_en": "Building crafts", 
        "points": 20, 
        "category": "creativity", 
        "verification_type": "self_reported",
        "description_el": "Φτιάξε κάτι με τα χέρια σου! Lego, χαρτί, πλαστελίνη - ό,τι θέλεις!",
        "why_important_el": "Οι κατασκευές μας μαθαίνουν να λύνουμε προβλήματα και να είμαστε δημιουργικοί!",
        "parent_tip_el": "Συμμετέχετε σε projects μαζί. Δείξτε τις δικές σας ιδέες αλλά αφήστε το παιδί να οδηγήσει.",
        "emoji": "🔧",
        "min_age": 6, "max_age": 14
    },
    {
        "name_el": "Οργάνωση χρόνου", 
        "name_en": "Organizing time", 
        "points": 15, 
        "category": "routine", 
        "verification_type": "self_reported",
        "description_el": "Σκέψου τι θες να κάνεις σήμερα: λίγο παιχνίδι, λίγο διάβασμα, λίγη ξεκούραση!",
        "why_important_el": "Όταν οργανώνουμε τον χρόνο μας, προλαβαίνουμε να κάνουμε όλα όσα αγαπάμε!",
        "parent_tip_el": "Φτιάξτε μαζί ένα πρόγραμμα με εικόνες για τις καθημερινές δραστηριότητες.",
        "emoji": "⏰",
        "min_age": 8, "max_age": 14
    },
]

BADGES = [
    {"badge_id": "first_task", "name_el": "Πρώτη Αποστολή", "name_en": "First Mission", "description_el": "Ολοκλήρωσε την πρώτη σου συνήθεια", "description_en": "Complete your first habit", "icon": "🌟", "requirement_type": "tasks_completed", "requirement_value": 1},
    {"badge_id": "streak_3", "name_el": "Τριήμερο Σερί", "name_en": "3-Day Streak", "description_el": "Διατήρησε 3 μέρες σερί", "description_en": "Maintain a 3-day streak", "icon": "🔥", "requirement_type": "streak", "requirement_value": 3},
    {"badge_id": "streak_7", "name_el": "Εβδομαδιαίος Ήρωας", "name_en": "Weekly Hero", "description_el": "Διατήρησε 7 μέρες σερί", "description_en": "Maintain a 7-day streak", "icon": "⚡", "requirement_type": "streak", "requirement_value": 7},
    {"badge_id": "streak_30", "name_el": "Μηνιαίος Πρωταθλητής", "name_en": "Monthly Champion", "description_el": "Διατήρησε 30 μέρες σερί", "description_en": "Maintain a 30-day streak", "icon": "🏆", "requirement_type": "streak", "requirement_value": 30},
    {"badge_id": "points_100", "name_el": "Συλλέκτης Πόντων", "name_en": "Point Collector", "description_el": "Συγκέντρωσε 100 πόντους", "description_en": "Collect 100 points", "icon": "💎", "requirement_type": "total_points", "requirement_value": 100},
    {"badge_id": "points_500", "name_el": "Θησαυροφύλακας", "name_en": "Treasure Keeper", "description_el": "Συγκέντρωσε 500 πόντους", "description_en": "Collect 500 points", "icon": "👑", "requirement_type": "total_points", "requirement_value": 500},
    {"badge_id": "points_1000", "name_el": "Χρυσός Ήρωας", "name_en": "Golden Hero", "description_el": "Συγκέντρωσε 1000 πόντους", "description_en": "Collect 1000 points", "icon": "🥇", "requirement_type": "total_points", "requirement_value": 1000},
    {"badge_id": "helper", "name_el": "Βοηθός", "name_en": "Helper", "description_el": "Βοήθησε 5 φορές", "description_en": "Help 5 times", "icon": "🤝", "requirement_type": "category_tasks", "requirement_value": 5},
    {"badge_id": "creative", "name_el": "Δημιουργός", "name_en": "Creator", "description_el": "Ολοκλήρωσε 10 δημιουργικές δραστηριότητες", "description_en": "Complete 10 creative activities", "icon": "🎨", "requirement_type": "category_tasks", "requirement_value": 10},
    {"badge_id": "active", "name_el": "Αθλητής", "name_en": "Athlete", "description_el": "Ολοκλήρωσε 10 φυσικές δραστηριότητες", "description_en": "Complete 10 physical activities", "icon": "🏃", "requirement_type": "category_tasks", "requirement_value": 10},
    # Independence badges (no help requests)
    {"badge_id": "independent_1day", "name_el": "Ανεξάρτητος Μαχητής", "name_en": "Independent Fighter", "description_el": "1 μέρα χωρίς να ζητήσεις βοήθεια", "description_en": "1 day without asking for help", "icon": "💪", "requirement_type": "no_help_days", "requirement_value": 1},
    {"badge_id": "independent_7days", "name_el": "Αυτόνομος Ήρωας", "name_en": "Self-Reliant Hero", "description_el": "1 εβδομάδα χωρίς να ζητήσεις βοήθεια", "description_en": "1 week without asking for help", "icon": "🦸", "requirement_type": "no_help_days", "requirement_value": 7},
    {"badge_id": "independent_30days", "name_el": "Μάστερ Ανεξαρτησίας", "name_en": "Independence Master", "description_el": "1 μήνας χωρίς να ζητήσεις βοήθεια", "description_en": "1 month without asking for help", "icon": "🎖️", "requirement_type": "no_help_days", "requirement_value": 30},
    # Focus badges (no postpones)
    {"badge_id": "focused_1day", "name_el": "Εστιασμένος", "name_en": "Focused", "description_el": "1 μέρα χωρίς αναβολές", "description_en": "1 day without postponing", "icon": "🎯", "requirement_type": "no_postpone_days", "requirement_value": 1},
    {"badge_id": "focused_7days", "name_el": "Συγκεντρωμένος Ήρωας", "name_en": "Concentrated Hero", "description_el": "1 εβδομάδα χωρίς αναβολές", "description_en": "1 week without postponing", "icon": "🧠", "requirement_type": "no_postpone_days", "requirement_value": 7},
    {"badge_id": "focused_30days", "name_el": "Μάστερ Εστίασης", "name_en": "Focus Master", "description_el": "1 μήνας χωρίς αναβολές", "description_en": "1 month without postponing", "icon": "🏅", "requirement_type": "no_postpone_days", "requirement_value": 30},
    # Spending badge
    {"badge_id": "big_spender", "name_el": "Μεγάλος Ξοδευτής", "name_en": "Big Spender", "description_el": "Ξόδεψε 500+ πόντους σε έπαθλα", "description_en": "Spend 500+ points on rewards", "icon": "💸", "requirement_type": "points_spent", "requirement_value": 500},
    # Custom avatar badge (unlocks at 500 points if parent enables with points mode)
    {"badge_id": "photo_star", "name_el": "Αστέρι Φωτογραφίας", "name_en": "Photo Star", "description_el": "Ξεκλείδωσε τη δική σου φωτογραφία!", "description_en": "Unlock your own photo avatar!", "icon": "📸", "requirement_type": "custom_avatar_unlock", "requirement_value": 500},
]

AVATAR_LEVELS = [
    {"level": 1, "name_el": "Αρχάριος Ήρωας", "name_en": "Beginner Hero", "points_required": 0, "emoji": "🌱"},
    {"level": 2, "name_el": "Ανερχόμενος Ήρωας", "name_en": "Rising Hero", "points_required": 100, "emoji": "⭐"},
    {"level": 3, "name_el": "Έμπειρος Ήρωας", "name_en": "Experienced Hero", "points_required": 300, "emoji": "🌟"},
    {"level": 4, "name_el": "Σούπερ Ήρωας", "name_en": "Super Hero", "points_required": 600, "emoji": "💫"},
    {"level": 5, "name_el": "Θρυλικός Ήρωας", "name_en": "Legendary Hero", "points_required": 1000, "emoji": "🏆"},
    {"level": 6, "name_el": "Επικός Ήρωας", "name_en": "Epic Hero", "points_required": 1500, "emoji": "👑"},
    {"level": 7, "name_el": "Μυθικός Ήρωας", "name_en": "Mythical Hero", "points_required": 2000, "emoji": "🔥"},
    {"level": 8, "name_el": "Αστέρι της Οικογένειας", "name_en": "Family Star", "points_required": 2750, "emoji": "🌠"},
    {"level": 9, "name_el": "Διαμάντι Ήρωας", "name_en": "Diamond Hero", "points_required": 3500, "emoji": "💎"},
    {"level": 10, "name_el": "Πλατινένιος Ήρωας", "name_en": "Platinum Hero", "points_required": 4500, "emoji": "🎖️"},
    {"level": 11, "name_el": "Χρυσός Πολεμιστής", "name_en": "Golden Warrior", "points_required": 5500, "emoji": "⚔️"},
    {"level": 12, "name_el": "Μάστερ Ήρωας", "name_en": "Master Hero", "points_required": 6750, "emoji": "🎯"},
    {"level": 13, "name_el": "Αρχηγός Ηρώων", "name_en": "Hero Leader", "points_required": 8000, "emoji": "🦸"},
    {"level": 14, "name_el": "Θεϊκός Ήρωας", "name_en": "Divine Hero", "points_required": 9000, "emoji": "✨"},
    {"level": 15, "name_el": "Απόλυτος Θρύλος", "name_en": "Ultimate Legend", "points_required": 10000, "emoji": "🌈"},
]

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Habit Hero API", "version": "1.0.0"}

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session data (Emergent Auth flow)"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth API error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")
    
    # Check if parent exists
    existing_parent = await db.parents.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_parent:
        # Parent exists - return info for PIN verification (multi-device support)
        # Get children for this parent
        children = await db.children.find(
            {"parent_id": existing_parent["user_id"]},
            {"_id": 0, "child_id": 1, "name": 1, "avatar_id": 1}
        ).to_list(20)
        
        return {
            "needs_pin_setup": False,
            "needs_pin_verification": True,
            "user_id": existing_parent["user_id"],
            "email": existing_parent["email"],
            "name": existing_parent["name"],
            "picture": existing_parent.get("picture"),
            "temp_session_token": user_data["session_token"],
            "children": children
        }
    else:
        # New user - needs PIN setup
        return {
            "needs_pin_setup": True,
            "needs_pin_verification": False,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "temp_session_id": session_id
        }

class VerifyPinForNewDevice(BaseModel):
    user_id: str
    pin: str
    temp_session_token: str

@api_router.post("/auth/verify-pin-new-device")
async def verify_pin_new_device(data: VerifyPinForNewDevice, response: Response):
    """Verify PIN for existing parent logging in on new device"""
    parent = await db.parents.find_one(
        {"user_id": data.user_id},
        {"_id": 0}
    )
    
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    if not verify_pin(data.pin, parent["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # PIN verified - create session
    session_token = data.temp_session_token
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": parent["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Get children
    children = await db.children.find(
        {"parent_id": parent["user_id"]},
        {"_id": 0, "child_id": 1, "name": 1, "avatar_id": 1}
    ).to_list(20)
    
    return {
        "success": True,
        "user_id": parent["user_id"],
        "email": parent["email"],
        "name": parent["name"],
        "picture": parent.get("picture"),
        "session_token": session_token,
        "children": children
    }

@api_router.post("/auth/setup-pin")
async def setup_parent_pin(request: Request, response: Response):
    """Complete parent registration with PIN setup"""
    body = await request.json()
    
    session_id = body.get("temp_session_id")
    pin = body.get("pin")
    
    if not session_id or not pin:
        raise HTTPException(status_code=400, detail="Session ID and PIN required")
    
    if len(pin) != 4 or not pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    # Verify session_id again
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth API error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")
    
    # Create parent account
    user_id = f"parent_{uuid.uuid4().hex[:12]}"
    
    parent_doc = {
        "user_id": user_id,
        "email": user_data["email"],
        "name": user_data["name"],
        "picture": user_data.get("picture"),
        "pin_hash": hash_pin(pin),
        "push_tokens": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.parents.insert_one(parent_doc)
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": user_data["email"],
        "name": user_data["name"],
        "picture": user_data.get("picture"),
        "session_token": session_token
    }

class EmailLookup(BaseModel):
    email: str

@api_router.post("/auth/lookup-by-email")
async def lookup_by_email(data: EmailLookup):
    """Look up a parent account by email address"""
    email = data.email.lower().strip()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    parent = await db.parents.find_one(
        {"email": email},
        {"_id": 0, "pin_hash": 0, "push_tokens": 0}
    )
    
    if not parent:
        return {"found": False}
    
    # Get children
    children = await db.children.find(
        {"parent_id": parent["user_id"]},
        {"_id": 0, "pin_hash": 0}
    ).to_list(length=20)
    
    return {
        "found": True,
        "user_id": parent["user_id"],
        "name": parent["name"],
        "email": parent["email"],
        "picture": parent.get("picture"),
        "children": children
    }

class ParentPinLogin(BaseModel):
    parent_id: str
    pin: str

@api_router.post("/auth/parent-pin-login")
async def parent_pin_login(login: ParentPinLogin, response: Response):
    """Login parent with PIN (for returning users on shared device)"""
    logger.info(f"Parent PIN login attempt for: {login.parent_id}")
    
    parent = await db.parents.find_one(
        {"user_id": login.parent_id},
        {"_id": 0}
    )
    
    if not parent:
        logger.warning(f"Parent not found: {login.parent_id}")
        raise HTTPException(status_code=404, detail="Parent not found")
    
    if not verify_pin(login.pin, parent["pin_hash"]):
        logger.warning(f"Invalid PIN for parent: {login.parent_id}")
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Create new session
    session_token = f"parent_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": parent["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Update any pending magic link for this user so the app can poll and get the session
    update_result = await db.magic_links.update_one(
        {"email": parent["email"], "used": True, "verified": False},
        {"$set": {"verified": True, "session_token": session_token, "user_id": parent["user_id"]}}
    )
    logger.info(f"Magic link update for {parent['email']}: matched={update_result.matched_count}, modified={update_result.modified_count}")
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "success": True,
        "user_id": parent["user_id"],
        "name": parent["name"],
        "email": parent["email"],
        "picture": parent.get("picture"),
        "session_token": session_token,
        "role": "parent"
    }

@api_router.get("/family/{parent_id}")
async def get_family_info(parent_id: str):
    """Get family info for a device (public endpoint for login screen)"""
    parent = await db.parents.find_one(
        {"user_id": parent_id},
        {"_id": 0, "pin_hash": 0, "push_tokens": 0}
    )
    
    if not parent:
        raise HTTPException(status_code=404, detail="Family not found")
    
    children = await db.children.find(
        {"parent_id": parent_id},
        {"_id": 0, "pin_hash": 0}
    ).to_list(100)
    
    return {
        "parent": {
            "user_id": parent["user_id"],
            "name": parent["name"],
        },
        "children": [{"child_id": c["child_id"], "name": c["name"], "avatar_id": c["avatar_id"]} for c in children]
    }

@api_router.post("/auth/child-login")
async def child_login(login: ChildPinLogin, response: Response):
    """Login as a child with PIN"""
    child = await db.children.find_one(
        {"child_id": login.child_id},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    if not verify_pin(login.pin, child["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Create child session
    session_token = f"child_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=12)
    
    await db.child_sessions.insert_one({
        "child_id": child["child_id"],
        "parent_id": child["parent_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=12 * 60 * 60,
        path="/"
    )
    
    return {
        "success": True,
        "child_id": child["child_id"],
        "name": child["name"],
        "gender": child.get("gender", "boy"),  # Return gender for gendered text
        "avatar_id": child["avatar_id"],
        "avatar_level": child["avatar_level"],
        "total_points": child["total_points"],
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user (parent)"""
    parent = await get_current_parent(request)
    return {
        "user_id": parent.user_id,
        "email": parent.email,
        "name": parent.name,
        "picture": parent.picture,
        "role": "parent"
    }

@api_router.get("/auth/child/me")
async def get_current_child(request: Request):
    """Get current authenticated child"""
    session = await get_current_child_session(request)
    child = await db.children.find_one(
        {"child_id": session["child_id"]},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return Child(**child)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout current session"""
    session_token = await get_session_token(request)
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
        await db.child_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"success": True}

# ==================== MAGIC LINK AUTH ====================

class MagicLinkRequest(BaseModel):
    email: str

class MagicLinkVerify(BaseModel):
    token: str

async def send_magic_link_email(email: str, magic_token: str, user_name: str = None):
    """Send magic link email via Brevo"""
    try:
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(brevo_config))
        
        # Use the standalone HTML verification page (bypasses Expo web bundle issues)
        magic_link = f"{BASE_URL}/api/magic-verify?token={magic_token}"
        
        greeting = f"Γεια σου {user_name}!" if user_name else "Γεια σου!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0; }}
                .button:hover {{ background: #5a6fd6; }}
                .footer {{ text-align: center; color: #888; font-size: 12px; margin-top: 20px; }}
                .emoji {{ font-size: 48px; }}
                .note {{ font-size: 13px; color: #666; margin-top: 20px; padding: 15px; background: #fff; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="emoji">🦸‍♂️</div>
                    <h1>Habit Hero</h1>
                </div>
                <div class="content">
                    <h2>{greeting}</h2>
                    <p>Πάτησε το κουμπί παρακάτω για να συνδεθείς στο Habit Hero:</p>
                    <center>
                        <a href="{magic_link}" class="button">🔐 Σύνδεση στο Habit Hero</a>
                    </center>
                    <div class="note">
                        <strong>📱 Χρησιμοποιείς το κινητό;</strong><br>
                        Άνοιξε αυτό το email στο κινητό σου και πάτησε το κουμπί. 
                        Θα ανοίξει στον browser όπου μπορείς να ολοκληρώσεις τη σύνδεση.
                    </div>
                    <p><small>Ο σύνδεσμος λήγει σε 15 λεπτά.</small></p>
                    <p><small>Αν δεν ζήτησες αυτό το email, αγνόησέ το.</small></p>
                </div>
                <div class="footer">
                    <p>© 2026 Habit Hero - Βοηθάμε τα παιδιά να χτίσουν καλές συνήθειες</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={"name": "Habit Hero", "email": SENDER_EMAIL},
            subject="🔐 Σύνδεση στο Habit Hero",
            html_content=html_content
        )
        
        api_instance.send_transac_email(send_smtp_email)
        logger.info(f"Magic link email sent to: {email}")
        return True
    except ApiException as e:
        logger.error(f"Brevo API error sending email to {email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Error sending magic link email to {email}: {e}")
        return False


# Standalone HTML Magic Link Verification Page (bypasses Expo web bundle)
@api_router.get("/magic-verify", response_class=HTMLResponse)
async def magic_verify_page(token: str = None, request: Request = None):
    """Standalone HTML page for magic link verification"""
    
    html_content = """
    <!DOCTYPE html>
    <html lang="el">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Habit Hero - Σύνδεση</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px 30px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .logo { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
            p { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px; }
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f0f0f0;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            .error { color: #e74c3c; }
            .success { color: #27ae60; }
            input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                font-size: 16px;
                margin-bottom: 15px;
                text-align: center;
            }
            input:focus { border-color: #667eea; outline: none; }
            button {
                width: 100%;
                padding: 15px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 10px;
            }
            button:hover { background: #5a6fd6; }
            button:disabled { background: #ccc; cursor: not-allowed; }
            .pin-inputs {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 20px 0;
            }
            .pin-input {
                width: 50px;
                height: 60px;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
            }
            .pin-input:focus { border-color: #667eea; }
            .hidden { display: none; }
            .form-group { margin-bottom: 20px; text-align: left; }
            .form-group label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
            .message { padding: 15px; border-radius: 10px; margin: 15px 0; }
            .message.error { background: #fdeaea; color: #c0392b; }
            .message.success { background: #eafde9; color: #27ae60; }
            
            /* Success page styles */
            .success-box {
                background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
                border-radius: 16px;
                padding: 24px;
                margin: 20px 0;
                border: 2px solid #81c784;
            }
            .success-checkmark {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                animation: scaleIn 0.5s ease-out;
            }
            .success-checkmark svg {
                width: 40px;
                height: 40px;
                stroke: white;
                stroke-width: 3;
                fill: none;
                animation: checkmark 0.5s ease-out 0.3s forwards;
                stroke-dasharray: 50;
                stroke-dashoffset: 50;
            }
            @keyframes scaleIn {
                0% { transform: scale(0); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            @keyframes checkmark {
                to { stroke-dashoffset: 0; }
            }
            .step-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: white;
                border-radius: 12px;
                margin: 12px 0;
                text-align: left;
            }
            .step-number {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #667eea;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                flex-shrink: 0;
            }
            .step-text {
                color: #333;
                font-size: 15px;
                line-height: 1.4;
            }
            .app-icon {
                width: 60px;
                height: 60px;
                border-radius: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
                font-size: 32px;
            }
            .close-hint {
                color: #888;
                font-size: 13px;
                margin-top: 16px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Loading State -->
            <div id="loading">
                <div class="logo">🦸‍♂️</div>
                <h1>Habit Hero</h1>
                <div class="spinner"></div>
                <p>Επαλήθευση συνδέσμου...</p>
            </div>
            
            <!-- Error State -->
            <div id="error" class="hidden">
                <div class="logo">❌</div>
                <h1>Σφάλμα</h1>
                <p id="error-message">Κάτι πήγε στραβά</p>
                <button onclick="window.location.reload()">Δοκιμάστε ξανά</button>
            </div>
            
            <!-- New User Setup -->
            <div id="new-user" class="hidden">
                <div class="logo">🎉</div>
                <h1>Καλωσήρθατε!</h1>
                <p>Ολοκληρώστε την εγγραφή σας</p>
                
                <div class="form-group">
                    <label>Το όνομά σας</label>
                    <input type="text" id="name-input" placeholder="Εισάγετε το όνομά σας">
                </div>
                
                <div class="form-group">
                    <label>Δημιουργήστε PIN (4 ψηφία)</label>
                    <div class="pin-inputs">
                        <input type="tel" maxlength="1" class="pin-input" id="pin1">
                        <input type="tel" maxlength="1" class="pin-input" id="pin2">
                        <input type="tel" maxlength="1" class="pin-input" id="pin3">
                        <input type="tel" maxlength="1" class="pin-input" id="pin4">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Επιβεβαιώστε το PIN</label>
                    <div class="pin-inputs">
                        <input type="tel" maxlength="1" class="pin-input" id="confirm1">
                        <input type="tel" maxlength="1" class="pin-input" id="confirm2">
                        <input type="tel" maxlength="1" class="pin-input" id="confirm3">
                        <input type="tel" maxlength="1" class="pin-input" id="confirm4">
                    </div>
                </div>
                
                <div id="setup-message" class="message hidden"></div>
                
                <button id="setup-btn" onclick="completeSetup()">Συνέχεια</button>
            </div>
            
            <!-- Existing User PIN -->
            <div id="existing-user" class="hidden">
                <div class="logo">👋</div>
                <h1>Καλώς ήρθατε πίσω!</h1>
                <p id="user-name">Εισάγετε το PIN σας</p>
                
                <div class="pin-inputs">
                    <input type="tel" maxlength="1" class="pin-input" id="verify1">
                    <input type="tel" maxlength="1" class="pin-input" id="verify2">
                    <input type="tel" maxlength="1" class="pin-input" id="verify3">
                    <input type="tel" maxlength="1" class="pin-input" id="verify4">
                </div>
                
                <div id="verify-message" class="message hidden"></div>
                
                <button id="verify-btn" onclick="verifyPin()">Σύνδεση</button>
            </div>
            
            <!-- Success -->
            <div id="success" class="hidden">
                <div class="success-checkmark">
                    <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h1 style="color: #2e7d32;">Επιτυχής Σύνδεση!</h1>
                <p id="success-message" style="color: #388e3c; font-weight: 500;">Ο λογαριασμός σας επαληθεύτηκε</p>
                
                <div class="success-box">
                    <div class="app-icon">🦸</div>
                    <p style="font-weight: 600; color: #333; margin-bottom: 8px;">Τώρα επιστρέψτε στην εφαρμογή</p>
                    
                    <div class="step-indicator">
                        <div class="step-number">1</div>
                        <div class="step-text">Κλείστε αυτή την καρτέλα του browser</div>
                    </div>
                    
                    <div class="step-indicator">
                        <div class="step-number">2</div>
                        <div class="step-text">Ανοίξτε την εφαρμογή <strong>Habit Hero</strong> στο κινητό σας</div>
                    </div>
                    
                    <div class="step-indicator">
                        <div class="step-number">3</div>
                        <div class="step-text">Πατήστε <strong>"Έχω ήδη λογαριασμό"</strong> και συνδεθείτε με το email και PIN σας</div>
                    </div>
                </div>
                
                <p class="close-hint">Μπορείτε να κλείσετε αυτή τη σελίδα με ασφάλεια.</p>
            </div>
        </div>
        
        <script>
            let userData = null;
            const token = new URLSearchParams(window.location.search).get('token');
            
            // Setup PIN input auto-focus
            function setupPinInputs(prefix) {
                for (let i = 1; i <= 4; i++) {
                    const input = document.getElementById(prefix + i);
                    input.addEventListener('input', function() {
                        // Only allow digits
                        this.value = this.value.replace(/[^0-9]/g, '');
                        if (this.value.length === 1 && i < 4) {
                            document.getElementById(prefix + (i + 1)).focus();
                        }
                    });
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Backspace' && this.value === '' && i > 1) {
                            document.getElementById(prefix + (i - 1)).focus();
                        }
                    });
                }
            }
            
            function getPin(prefix) {
                return document.getElementById(prefix + '1').value +
                       document.getElementById(prefix + '2').value +
                       document.getElementById(prefix + '3').value +
                       document.getElementById(prefix + '4').value;
            }
            
            function showSection(id) {
                ['loading', 'error', 'new-user', 'existing-user', 'success'].forEach(s => {
                    document.getElementById(s).classList.add('hidden');
                });
                document.getElementById(id).classList.remove('hidden');
            }
            
            function showError(message) {
                document.getElementById('error-message').textContent = message;
                showSection('error');
            }
            
            async function verifyToken() {
                if (!token) {
                    showError('Δεν βρέθηκε token στον σύνδεσμο');
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/magic-link/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token }),
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        showError(data.detail || 'Μη έγκυρος ή ληγμένος σύνδεσμος');
                        return;
                    }
                    
                    userData = data;
                    
                    if (data.needs_pin_setup) {
                        document.getElementById('name-input').value = data.name || '';
                        setupPinInputs('pin');
                        setupPinInputs('confirm');
                        showSection('new-user');
                        document.getElementById('name-input').focus();
                    } else if (data.needs_pin_verification) {
                        document.getElementById('user-name').textContent = data.name;
                        setupPinInputs('verify');
                        showSection('existing-user');
                        document.getElementById('verify1').focus();
                    }
                } catch (err) {
                    console.error('Verify error:', err);
                    showError('Αποτυχία επικοινωνίας με τον server');
                }
            }
            
            async function completeSetup() {
                const name = document.getElementById('name-input').value.trim();
                const pin = getPin('pin');
                const confirmPin = getPin('confirm');
                const msgEl = document.getElementById('setup-message');
                const btn = document.getElementById('setup-btn');
                
                if (!name) {
                    msgEl.textContent = 'Παρακαλώ εισάγετε το όνομά σας';
                    msgEl.className = 'message error';
                    msgEl.classList.remove('hidden');
                    return;
                }
                
                if (pin.length !== 4) {
                    msgEl.textContent = 'Το PIN πρέπει να είναι 4 ψηφία';
                    msgEl.className = 'message error';
                    msgEl.classList.remove('hidden');
                    return;
                }
                
                if (pin !== confirmPin) {
                    msgEl.textContent = 'Τα PIN δεν ταιριάζουν';
                    msgEl.className = 'message error';
                    msgEl.classList.remove('hidden');
                    return;
                }
                
                btn.disabled = true;
                btn.textContent = 'Περιμένετε...';
                
                try {
                    const response = await fetch('/api/auth/magic-link/complete-setup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userData.email, name, pin }),
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showSection('success');
                        document.getElementById('success-message').textContent = 
                            'Ο λογαριασμός σας δημιουργήθηκε επιτυχώς!';
                    } else {
                        msgEl.textContent = data.detail || 'Αποτυχία εγγραφής';
                        msgEl.className = 'message error';
                        msgEl.classList.remove('hidden');
                        btn.disabled = false;
                        btn.textContent = 'Συνέχεια';
                    }
                } catch (err) {
                    console.error('Setup error:', err);
                    msgEl.textContent = 'Αποτυχία επικοινωνίας με τον server';
                    msgEl.className = 'message error';
                    msgEl.classList.remove('hidden');
                    btn.disabled = false;
                    btn.textContent = 'Συνέχεια';
                }
            }
            
            async function verifyPin() {
                const pin = getPin('verify');
                const msgEl = document.getElementById('verify-message');
                const btn = document.getElementById('verify-btn');
                
                if (pin.length !== 4) {
                    msgEl.textContent = 'Εισάγετε 4 ψηφία';
                    msgEl.className = 'message error';
                    msgEl.classList.remove('hidden');
                    return;
                }
                
                btn.disabled = true;
                btn.textContent = 'Περιμένετε...';
                
                try {
                    const response = await fetch('/api/auth/parent-pin-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ parent_id: userData.user_id, pin }),
                        credentials: 'include'
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showSection('success');
                        document.getElementById('success-message').textContent = 
                            'Η σύνδεση ολοκληρώθηκε επιτυχώς!';
                    } else {
                        msgEl.textContent = data.detail || 'Λάθος PIN';
                        msgEl.className = 'message error';
                        msgEl.classList.remove('hidden');
                        // Clear PIN inputs
                        for (let i = 1; i <= 4; i++) {
                            document.getElementById('verify' + i).value = '';
                        }
                        document.getElementById('verify1').focus();
                        btn.disabled = false;
                        btn.textContent = 'Σύνδεση';
                    }
                } catch (err) {
                    console.error('Login error:', err);
                    msgEl.textContent = 'Αποτυχία επικοινωνίας με τον server';
                    msgEl.className = 'message error';
                    msgEl.classList.remove('hidden');
                    btn.disabled = false;
                    btn.textContent = 'Σύνδεση';
                }
            }
            
            // Start verification on page load
            verifyToken();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@api_router.post("/auth/magic-link/request")
async def request_magic_link(data: MagicLinkRequest):
    """Request a magic link for passwordless login"""
    email = data.email.lower().strip()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Generate a secure token for the email link
    magic_token = secrets.token_urlsafe(32)
    # Generate a poll token for the app to check status
    poll_token = secrets.token_urlsafe(16)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Check if user exists (to show their name in email)
    existing_parent = await db.parents.find_one({"email": email}, {"_id": 0, "name": 1, "user_id": 1})
    user_name = existing_parent.get("name") if existing_parent else None
    
    # Store the magic link token with poll_token reference
    await db.magic_links.insert_one({
        "token": magic_token,
        "poll_token": poll_token,
        "email": email,
        "created_at": datetime.now(timezone.utc),
        "expires_at": expires_at,
        "used": False,
        "verified": False,  # Set to True when browser completes verification
        "session_token": None,  # Will be set when session is created
        "user_id": existing_parent.get("user_id") if existing_parent else None
    })
    
    # Send the email
    email_sent = await send_magic_link_email(email, magic_token, user_name)
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send magic link email")
    
    return {
        "success": True,
        "message": "Magic link sent to your email",
        "is_existing_user": existing_parent is not None,
        "poll_token": poll_token  # Return this so app can poll for status
    }


class MagicLinkPollRequest(BaseModel):
    poll_token: str

@api_router.post("/auth/magic-link/poll")
async def poll_magic_link_status(data: MagicLinkPollRequest):
    """Poll to check if magic link has been verified (called by mobile app)"""
    poll_token = data.poll_token.strip()
    
    if not poll_token:
        raise HTTPException(status_code=400, detail="Poll token is required")
    
    # Find the magic link by poll token
    magic_link = await db.magic_links.find_one({"poll_token": poll_token})
    
    if not magic_link:
        raise HTTPException(status_code=404, detail="Invalid poll token")
    
    # Check if expired
    expires_at = magic_link["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > expires_at:
        return {"status": "expired", "verified": False}
    
    # Check if verified
    if magic_link.get("verified") and magic_link.get("session_token"):
        # Get user info
        user_id = magic_link.get("user_id")
        if user_id:
            parent = await db.parents.find_one({"user_id": user_id}, {"_id": 0})
            if parent:
                return {
                    "status": "verified",
                    "verified": True,
                    "session_token": magic_link["session_token"],
                    "user_id": parent["user_id"],
                    "name": parent["name"],
                    "email": parent["email"],
                    "picture": parent.get("picture")
                }
    
    return {"status": "pending", "verified": False}

@api_router.post("/auth/magic-link/verify")
async def verify_magic_link(data: MagicLinkVerify, response: Response):
    """Verify a magic link token and authenticate user"""
    token = data.token.strip()
    
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    # Find the magic link
    magic_link = await db.magic_links.find_one({
        "token": token,
        "used": False
    })
    
    if not magic_link:
        raise HTTPException(status_code=400, detail="Invalid or expired magic link")
    
    # Check if expired - handle both timezone-aware and naive datetimes
    expires_at = magic_link["expires_at"]
    now = datetime.now(timezone.utc)
    
    # If expires_at is timezone-naive, make it timezone-aware (assume UTC)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if now > expires_at:
        await db.magic_links.update_one({"token": token}, {"$set": {"used": True}})
        raise HTTPException(status_code=400, detail="Magic link has expired")
    
    # Mark as used
    await db.magic_links.update_one({"token": token}, {"$set": {"used": True}})
    
    email = magic_link["email"]
    
    # Check if parent exists
    existing_parent = await db.parents.find_one({"email": email}, {"_id": 0})
    
    if existing_parent:
        # Existing user - get children for PIN verification
        children = await db.children.find(
            {"parent_id": existing_parent["user_id"]},
            {"_id": 0, "child_id": 1, "name": 1, "avatar_id": 1}
        ).to_list(20)
        
        return {
            "needs_pin_setup": False,
            "needs_pin_verification": True,
            "user_id": existing_parent["user_id"],
            "email": existing_parent["email"],
            "name": existing_parent["name"],
            "picture": existing_parent.get("picture"),
            "children": children
        }
    else:
        # New user - needs PIN setup
        return {
            "needs_pin_setup": True,
            "needs_pin_verification": False,
            "email": email,
            "name": email.split("@")[0].title(),  # Default name from email
            "picture": None
        }

@api_router.post("/auth/magic-link/complete-setup")
async def complete_magic_link_setup(request: Request, response: Response):
    """Complete setup for a new user who logged in via magic link"""
    body = await request.json()
    
    email = body.get("email", "").lower().strip()
    name = body.get("name", "").strip()
    pin = body.get("pin", "")
    
    if not email or not name or not pin:
        raise HTTPException(status_code=400, detail="Email, name, and PIN are required")
    
    if len(pin) != 4 or not pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    # Check if user already exists
    existing = await db.parents.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists")
    
    # Create new parent
    user_id = f"parent_{uuid.uuid4().hex[:12]}"
    pin_hash = hashlib.sha256(pin.encode()).hexdigest()
    
    new_parent = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": None,
        "pin_hash": pin_hash,
        "created_at": datetime.now(timezone.utc),
        "auth_method": "magic_link"
    }
    
    await db.parents.insert_one(new_parent)
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "user_agent": request.headers.get("user-agent", ""),
        "ip_address": request.client.host if request.client else None
    })
    
    # Update the magic link record so the app can poll and get the session
    await db.magic_links.update_one(
        {"email": email, "used": True},
        {"$set": {"verified": True, "session_token": session_token, "user_id": user_id}},
        upsert=False
    )
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/"
    )
    
    logger.info(f"New parent created via magic link: {user_id} ({email})")
    
    return {
        "success": True,
        "user_id": user_id,
        "name": name,
        "email": email,
        "session_token": session_token
    }

# ==================== OAUTH CALLBACK WEB PAGE ====================
# This handles Google OAuth redirects for native mobile apps

@api_router.get("/oauth-callback", response_class=HTMLResponse)
async def oauth_callback_page(session_id: str = None, request: Request = None):
    """Web-based OAuth callback that bridges Google Auth to native app"""
    
    app_scheme = "habit-hero"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="el">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Habit Hero - Σύνδεση</title>
        <style>
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{ 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .container {{
                background: white;
                border-radius: 20px;
                padding: 40px 30px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }}
            .logo {{ font-size: 64px; margin-bottom: 20px; }}
            h1 {{ color: #333; font-size: 24px; margin-bottom: 10px; }}
            p {{ color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px; }}
            .spinner {{
                width: 40px;
                height: 40px;
                border: 4px solid #f0f0f0;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }}
            @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
            .error {{ color: #e74c3c; }}
            .success {{ color: #27ae60; }}
            .button {{
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 15px 30px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                margin-top: 10px;
                cursor: pointer;
                border: none;
            }}
            .button:hover {{ background: #5a6fd6; }}
            .success-box {{
                background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
                border-radius: 16px;
                padding: 24px;
                margin: 20px 0;
                border: 2px solid #81c784;
            }}
            .success-checkmark {{
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
            }}
            .checkmark {{ font-size: 40px; color: white; }}
            .hidden {{ display: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Loading State -->
            <div id="loading">
                <div class="logo">🦸‍♂️</div>
                <h1>Habit Hero</h1>
                <div class="spinner"></div>
                <p>Επεξεργασία σύνδεσης...</p>
            </div>
            
            <!-- Error State -->
            <div id="error" class="hidden">
                <div class="logo">❌</div>
                <h1>Σφάλμα</h1>
                <p id="error-message">Δεν βρέθηκε session. Παρακαλώ δοκιμάστε ξανά.</p>
                <button class="button" onclick="window.close()">Κλείσιμο</button>
            </div>
            
            <!-- Success State -->
            <div id="success" class="hidden">
                <div class="success-checkmark">
                    <span class="checkmark">✓</span>
                </div>
                <h1 style="color: #2e7d32;">Επιτυχής Σύνδεση!</h1>
                <div class="success-box">
                    <p style="font-weight: 600; color: #333; margin-bottom: 8px;">Επιστρέψτε στην εφαρμογή</p>
                    <p style="font-size: 14px; color: #666;">Η σελίδα αυτή θα κλείσει αυτόματα...</p>
                </div>
                <button class="button" id="open-app-btn">Άνοιγμα Εφαρμογής</button>
            </div>
        </div>
        
        <script>
            const sessionId = '{session_id or ""}';
            const appScheme = '{app_scheme}';
            
            function showSection(id) {{
                ['loading', 'error', 'success'].forEach(s => {{
                    document.getElementById(s).classList.add('hidden');
                }});
                document.getElementById(id).classList.remove('hidden');
            }}
            
            function showError(message) {{
                document.getElementById('error-message').textContent = message;
                showSection('error');
            }}
            
            function openApp() {{
                // Try to redirect to the app with the session_id
                const appUrl = appScheme + '://auth/google-callback?session_id=' + sessionId;
                window.location.href = appUrl;
            }}
            
            async function processAuth() {{
                // Check if we have a session_id
                let sid = sessionId;
                
                // Also check URL params (in case session_id comes via query or hash)
                if (!sid) {{
                    const urlParams = new URLSearchParams(window.location.search);
                    sid = urlParams.get('session_id');
                }}
                if (!sid && window.location.hash) {{
                    const hash = window.location.hash;
                    if (hash.includes('session_id=')) {{
                        sid = hash.split('session_id=')[1].split('&')[0];
                    }}
                }}
                
                if (!sid) {{
                    showError('Δεν βρέθηκε session. Παρακαλώ δοκιμάστε ξανά.');
                    return;
                }}
                
                // Store the session_id temporarily so the app can poll for it
                try {{
                    await fetch('/api/auth/oauth-session-store', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{ session_id: sid }})
                    }});
                }} catch (e) {{
                    console.log('Could not store session:', e);
                }}
                
                // Show success and try to redirect to app
                showSection('success');
                
                // Set up the button to open app
                document.getElementById('open-app-btn').onclick = function() {{
                    const appUrl = appScheme + '://auth/google-callback?session_id=' + sid;
                    window.location.href = appUrl;
                }};
                
                // Try automatic redirect after a short delay
                setTimeout(function() {{
                    const appUrl = appScheme + '://auth/google-callback?session_id=' + sid;
                    window.location.href = appUrl;
                }}, 1000);
            }}
            
            // Start processing
            processAuth();
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

# Endpoint to store OAuth session temporarily for polling
class OAuthSessionStore(BaseModel):
    session_id: str

@api_router.post("/auth/oauth-session-store")
async def store_oauth_session(data: OAuthSessionStore):
    """Store OAuth session_id temporarily for app polling"""
    # Store with 5 minute expiry
    await db.oauth_sessions.update_one(
        {"session_id": data.session_id},
        {
            "$set": {
                "session_id": data.session_id,
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
            }
        },
        upsert=True
    )
    return {"success": True}

class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str

class UpdateNameRequest(BaseModel):
    name: str

@api_router.put("/parent/update-name")
async def update_parent_name(name_data: UpdateNameRequest, request: Request):
    """Update parent display name"""
    parent = await get_current_parent(request)
    
    new_name = name_data.name.strip()
    if not new_name or len(new_name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    if len(new_name) > 50:
        raise HTTPException(status_code=400, detail="Name too long")
    
    await db.parents.update_one(
        {"user_id": parent.user_id},
        {"$set": {"name": new_name}}
    )
    
    logger.info(f"Parent {parent.user_id} updated name to: {new_name}")
    
    return {"success": True, "name": new_name}

# Alias for parent name update (alternative endpoint)
@api_router.put("/parent/name")
async def update_parent_name_alias(name_data: UpdateNameRequest, request: Request):
    """Update parent display name (alias endpoint)"""
    return await update_parent_name(name_data, request)

# ==================== PARENT AVATAR ====================

class ParentAvatarRequest(BaseModel):
    avatar: str
    avatar_type: str = "emoji"  # "emoji" or "photo"

@api_router.put("/parent/avatar")
async def update_parent_avatar(avatar_data: ParentAvatarRequest, request: Request):
    """Update parent avatar"""
    parent = await get_current_parent(request)
    
    await db.parents.update_one(
        {"user_id": parent.user_id},
        {"$set": {
            "avatar": avatar_data.avatar,
            "avatar_type": avatar_data.avatar_type
        }}
    )
    
    logger.info(f"Parent {parent.user_id} updated avatar to: {avatar_data.avatar_type}")
    
    return {"success": True}

@api_router.get("/parent/avatar")
async def get_parent_avatar(request: Request):
    """Get parent avatar"""
    parent = await get_current_parent(request)
    
    parent_data = await db.parents.find_one(
        {"user_id": parent.user_id},
        {"_id": 0, "avatar": 1, "avatar_type": 1}
    )
    
    return {
        "avatar": parent_data.get("avatar") if parent_data else None,
        "avatar_type": parent_data.get("avatar_type", "default") if parent_data else "default"
    }

# ==================== CUSTOM AVATAR SETTINGS ====================

class CustomAvatarSettingsRequest(BaseModel):
    child_id: str
    enabled: bool
    mode: str = "free"  # "free" or "points" (500 points required)

@api_router.get("/parent/child/{child_id}/custom-avatar-settings")
async def get_custom_avatar_settings(child_id: str, request: Request):
    """Get custom avatar settings for a child"""
    parent = await get_current_parent(request)
    
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0, "custom_avatar_enabled": 1, "custom_avatar_mode": 1, "custom_avatar": 1, "total_points": 1}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return {
        "enabled": child.get("custom_avatar_enabled", False),
        "mode": child.get("custom_avatar_mode", "free"),
        "has_custom_avatar": bool(child.get("custom_avatar")),
        "total_points": child.get("total_points", 0)
    }

@api_router.put("/parent/child/{child_id}/custom-avatar-settings")
async def update_custom_avatar_settings(child_id: str, settings: CustomAvatarSettingsRequest, request: Request):
    """Update custom avatar settings for a child"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Check previous state to determine if we need to notify
    was_enabled = child.get("custom_avatar_enabled", False)
    
    await db.children.update_one(
        {"child_id": child_id},
        {"$set": {
            "custom_avatar_enabled": settings.enabled,
            "custom_avatar_mode": settings.mode
        }}
    )
    
    logger.info(f"Parent {parent.user_id} updated custom avatar settings for child {child_id}: enabled={settings.enabled}, mode={settings.mode}")
    
    # Send notification to child if setting was changed to enabled
    if settings.enabled and not was_enabled:
        notification_id = f"notif_{uuid.uuid4().hex[:12]}"
        child_name = child.get("name", "")
        
        if settings.mode == "free":
            title = "🎨 Νέα Δυνατότητα: Φωτογραφία Avatar!"
            message = f"Καλά νέα, {child_name}! Ο γονέας σου ξεκλείδωσε τη δυνατότητα να βάλεις τη δική σου φωτογραφία ως avatar! 📸 Πήγαινε στο προφίλ σου για να το δοκιμάσεις!"
        else:
            title = "🎁 Νέο Έπαθλο: Φωτογραφία Avatar!"
            message = f"Καλά νέα, {child_name}! Μπορείς τώρα να αγοράσεις τη δυνατότητα να βάλεις τη δική σου φωτογραφία ως avatar με 500 πόντους! 📸 Μάζεψε πόντους για να το ξεκλειδώσεις!"
        
        await db.child_notifications.insert_one({
            "notification_id": notification_id,
            "child_id": child_id,
            "type": "feature_unlocked",
            "title": title,
            "message": message,
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"success": True}

# ==================== INACTIVITY PENALTY SETTINGS ====================

class InactivityPenaltySettings(BaseModel):
    enabled: bool
    points_deduction: int = 10  # 5, 10, or 15
    time_period_hours: int = 24  # 12 (half day), 24 (1 day), 72 (3 days), 168 (1 week)

@api_router.get("/parent/child/{child_id}/inactivity-penalty-settings")
async def get_inactivity_penalty_settings(child_id: str, request: Request):
    """Get inactivity penalty settings for a child"""
    parent = await get_current_parent(request)
    
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0, "inactivity_penalty_enabled": 1, "inactivity_points_deduction": 1, "inactivity_time_period_hours": 1}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    return {
        "enabled": child.get("inactivity_penalty_enabled", False),
        "points_deduction": child.get("inactivity_points_deduction", 10),
        "time_period_hours": child.get("inactivity_time_period_hours", 24)
    }

@api_router.put("/parent/child/{child_id}/inactivity-penalty-settings")
async def update_inactivity_penalty_settings(child_id: str, settings: InactivityPenaltySettings, request: Request):
    """Enable/disable inactivity penalty for a child"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Validate points_deduction
    if settings.points_deduction not in [5, 10, 15]:
        raise HTTPException(status_code=400, detail="Points deduction must be 5, 10, or 15")
    
    # Validate time_period_hours
    if settings.time_period_hours not in [12, 24, 72, 168]:
        raise HTTPException(status_code=400, detail="Time period must be 12, 24, 72, or 168 hours")
    
    # Check previous state to determine if we need to notify
    was_enabled = child.get("inactivity_penalty_enabled", False)
    
    # Update setting
    await db.children.update_one(
        {"child_id": child_id},
        {"$set": {
            "inactivity_penalty_enabled": settings.enabled,
            "inactivity_points_deduction": settings.points_deduction,
            "inactivity_time_period_hours": settings.time_period_hours,
            "last_activity_check": datetime.now(timezone.utc) if settings.enabled else None
        }}
    )
    
    logger.info(f"Parent {parent.user_id} updated inactivity penalty for child {child_id}: enabled={settings.enabled}, points={settings.points_deduction}, hours={settings.time_period_hours}")
    
    # Send notification to child if setting was changed
    child_name = child.get("name", "")
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    # Convert time period to human-readable format
    time_text_map = {12: "12 ώρες", 24: "1 ημέρα", 72: "3 ημέρες", 168: "1 εβδομάδα"}
    time_text = time_text_map.get(settings.time_period_hours, f"{settings.time_period_hours} ώρες")
    
    if settings.enabled and not was_enabled:
        # Penalty was just enabled
        title = "⚠️ Νέος Κανόνας: Ποινή Αδράνειας"
        message = f"Προσοχή, {child_name}! Ο γονέας σου ενεργοποίησε την ποινή αδράνειας. Αν δεν κάνεις καμία δραστηριότητα για {time_text}, θα χάσεις {settings.points_deduction} πόντους. Μείνε ενεργός/ή! 💪"
        
        await db.child_notifications.insert_one({
            "notification_id": notification_id,
            "child_id": child_id,
            "type": "penalty_enabled",
            "title": title,
            "message": message,
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })
    elif not settings.enabled and was_enabled:
        # Penalty was just disabled
        title = "🎉 Καλά νέα!"
        message = f"Τέλεια, {child_name}! Ο γονέας σου απενεργοποίησε την ποινή αδράνειας. Δεν θα χάνεις πλέον πόντους αν δεν κάνεις δραστηριότητες!"
        
        await db.child_notifications.insert_one({
            "notification_id": notification_id,
            "child_id": child_id,
            "type": "penalty_disabled",
            "title": title,
            "message": message,
            "read": False,
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"success": True}

class CustomAvatarUploadRequest(BaseModel):
    image_base64: str  # Base64 encoded image

@api_router.post("/child/custom-avatar")
async def upload_custom_avatar(avatar_data: CustomAvatarUploadRequest, request: Request):
    """Upload custom avatar for child (stores as base64, no server processing)"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    # Get child to check if feature is enabled
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Check if custom avatar is enabled by parent
    if not child.get("custom_avatar_enabled", False):
        raise HTTPException(status_code=403, detail="Custom avatar not enabled by parent")
    
    # Check if points mode and child has enough points
    mode = child.get("custom_avatar_mode", "free")
    if mode == "points":
        if child.get("total_points", 0) < 500:
            raise HTTPException(status_code=403, detail="Need 500 points to unlock custom avatar")
    
    # Store the image as base64 (privacy: stored on device through sync, not processed)
    await db.children.update_one(
        {"child_id": child_id},
        {"$set": {"custom_avatar": avatar_data.image_base64}}
    )
    
    # Award the "photo_star" badge for uploading a custom avatar (always, regardless of mode)
    badges = set(child.get("badges", []))
    if "photo_star" not in badges:
        badges.add("photo_star")
        await db.children.update_one(
            {"child_id": child_id},
            {"$set": {"badges": list(badges)}}
        )
        logger.info(f"Badge 'photo_star' awarded to {child_id} for uploading custom avatar")
    
    logger.info(f"Child {child_id} uploaded custom avatar")
    
    return {"success": True, "message": "Avatar uploaded successfully", "badge_awarded": "photo_star" not in child.get("badges", [])}

@api_router.delete("/child/custom-avatar")
async def remove_custom_avatar(request: Request):
    """Remove custom avatar for child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    await db.children.update_one(
        {"child_id": child_id},
        {"$unset": {"custom_avatar": ""}}
    )
    
    return {"success": True}

@api_router.get("/child/custom-avatar-status")
async def get_custom_avatar_status(request: Request):
    """Get custom avatar status for child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    child = await db.children.find_one(
        {"child_id": child_id},
        {"_id": 0, "custom_avatar_enabled": 1, "custom_avatar_mode": 1, "custom_avatar": 1, "total_points": 1, "badges": 1}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    enabled = child.get("custom_avatar_enabled", False)
    mode = child.get("custom_avatar_mode", "free")
    total_points = child.get("total_points", 0)
    
    # Can use if: enabled AND (mode is free OR has 500+ points)
    can_use = enabled and (mode == "free" or total_points >= 500)
    
    return {
        "enabled": enabled,
        "mode": mode,
        "can_use": can_use,
        "has_custom_avatar": bool(child.get("custom_avatar")),
        "custom_avatar": child.get("custom_avatar"),
        "total_points": total_points,
        "points_needed": 500 - total_points if mode == "points" and total_points < 500 else 0,
        "has_photo_badge": "photo_star" in child.get("badges", [])
    }

@api_router.post("/auth/change-pin")
async def change_parent_pin(change_data: ChangePinRequest, request: Request):
    """Change parent PIN"""
    parent = await get_current_parent(request)
    
    # Get current parent data to verify PIN
    parent_doc = await db.parents.find_one({"user_id": parent.user_id})
    if not parent_doc:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    # Verify current PIN
    if parent_doc.get("pin_hash") != hash_pin(change_data.current_pin):
        raise HTTPException(status_code=401, detail="Incorrect current PIN")
    
    # Validate new PIN
    if len(change_data.new_pin) != 4 or not change_data.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    # Update PIN
    await db.parents.update_one(
        {"user_id": parent.user_id},
        {"$set": {"pin_hash": hash_pin(change_data.new_pin)}}
    )
    
    return {"success": True, "message": "PIN changed successfully"}

class ChangeChildPinRequest(BaseModel):
    new_pin: str

@api_router.post("/children/{child_id}/change-pin")
async def change_child_pin(child_id: str, change_data: ChangeChildPinRequest, request: Request):
    """Change child PIN (parent only)"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one({
        "child_id": child_id,
        "parent_id": parent.user_id
    })
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Validate new PIN
    if len(change_data.new_pin) != 4 or not change_data.new_pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    # Update PIN
    await db.children.update_one(
        {"child_id": child_id},
        {"$set": {"pin_hash": hash_pin(change_data.new_pin)}}
    )
    
    logger.info(f"PIN changed for child {child_id}")
    
    return {"success": True, "message": "Child PIN changed successfully"}

@api_router.delete("/auth/delete-account")
async def delete_account(request: Request, response: Response):
    """Delete parent account and all associated data"""
    parent = await get_current_parent(request)
    parent_id = parent.user_id
    
    # Delete all children associated with this parent
    children = await db.children.find({"parent_id": parent_id}).to_list(100)
    child_ids = [c["child_id"] for c in children]
    
    # Delete all habit completions for these children
    if child_ids:
        await db.habit_completions.delete_many({"child_id": {"$in": child_ids}})
    
    # Delete all children
    await db.children.delete_many({"parent_id": parent_id})
    
    # Delete all custom habits created by this parent
    await db.habits.delete_many({"parent_id": parent_id})
    
    # Delete all sessions (parent and child)
    await db.user_sessions.delete_many({"user_id": parent_id})
    if child_ids:
        await db.child_sessions.delete_many({"child_id": {"$in": child_ids}})
    
    # Delete the parent account
    await db.parents.delete_one({"user_id": parent_id})
    
    # Clear cookies
    response.delete_cookie(key="session_token", path="/")
    
    logger.info(f"Account deleted: {parent_id} with {len(child_ids)} children")
    
    return {
        "success": True,
        "message": "Account and all associated data deleted successfully",
        "deleted_children": len(child_ids)
    }

@api_router.post("/parent/reset-app")
async def reset_app(request: Request):
    """Reset app data without deleting accounts - keeps parent and child accounts, PINs
    Deletes: habits, completions, stats, badges, points, love credits, rewards, notifications
    """
    parent = await get_current_parent(request)
    parent_id = parent.user_id
    
    # Get all children for this parent
    children = await db.children.find({"parent_id": parent_id}).to_list(100)
    child_ids = [c["child_id"] for c in children]
    
    deleted_counts = {}
    
    # Delete ALL data related to children
    if child_ids:
        # Habit related
        result = await db.habit_completions.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["habit_completions"] = result.deleted_count
        
        result = await db.help_requests.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["help_requests"] = result.deleted_count
        
        result = await db.habit_postpones.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["postpones"] = result.deleted_count
        
        # Points and credits
        result = await db.love_credits.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["love_credits"] = result.deleted_count
        
        result = await db.reward_redemptions.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["redemptions"] = result.deleted_count
        
        # Notifications
        result = await db.child_notifications.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["notifications"] = result.deleted_count
        
        # Assigned habits
        result = await db.child_habits.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["child_habits"] = result.deleted_count
        
        # Child sessions
        result = await db.child_sessions.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["child_sessions"] = result.deleted_count
        
        # Scheduled notifications
        result = await db.scheduled_notifications.delete_many({"child_id": {"$in": child_ids}})
        deleted_counts["scheduled_notifications"] = result.deleted_count
    
    # Delete parent-related data
    result = await db.habits.delete_many({"parent_id": parent_id})
    deleted_counts["custom_habits"] = result.deleted_count
    
    result = await db.rewards.delete_many({"parent_id": parent_id})
    deleted_counts["custom_rewards"] = result.deleted_count
    
    result = await db.parent_love_stats.delete_many({"parent_id": parent_id})
    deleted_counts["parent_love_stats"] = result.deleted_count
    
    # Also delete any help requests by parent
    result = await db.help_requests.delete_many({"parent_id": parent_id})
    deleted_counts["parent_help_requests"] = result.deleted_count
    
    # Reset children to fresh state - like just created
    for child in children:
        await db.children.update_one(
            {"child_id": child["child_id"]},
            {
                "$set": {
                    "total_points": 0,
                    "current_streak": 0,  # Correct field name
                    "longest_streak": 0,   # Reset longest streak too
                    "badges": [],
                    "love_credits": 0,
                    "last_activity": None,
                    "last_inactivity_penalty": None,
                    "inactivity_penalty_enabled": False,
                    "inactivity_points_deduction": 10,
                    "inactivity_time_period_hours": 24,
                    "custom_avatar_enabled": False,
                    "custom_avatar_mode": "free",
                    "avatar_id": 1,  # Correct field name - reset to default avatar
                    "avatar_level": 1
                },
                "$unset": {
                    "custom_avatar": ""  # Remove custom photo avatar
                }
            }
        )
    
    # DO NOT recreate default habits - leave it empty like fresh account
    # Parent will need to assign habits manually through onboarding flow
    
    logger.info(f"App FULL reset for parent {parent_id}: {deleted_counts}")
    
    return {
        "success": True,
        "message": "Application has been reset successfully",
        "deleted_counts": deleted_counts,
        "children_reset": len(children)
    }

# ==================== CHILDREN ENDPOINTS ====================

@api_router.get("/children")
async def get_children(request: Request):
    """Get all children for the current parent"""
    parent = await get_current_parent(request)
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return children

@api_router.post("/children")
async def create_child(child_data: ChildCreate, request: Request):
    """Create a new child account"""
    parent = await get_current_parent(request)
    
    if len(child_data.pin) != 4 or not child_data.pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
    
    # Validate age
    if child_data.age < 6 or child_data.age > 14:
        raise HTTPException(status_code=400, detail="Age must be between 6 and 14")
    
    child_id = f"child_{uuid.uuid4().hex[:12]}"
    
    child_doc = {
        "child_id": child_id,
        "parent_id": parent.user_id,
        "name": child_data.name,
        "gender": child_data.gender,
        "age": child_data.age,
        "pin_hash": hash_pin(child_data.pin),
        "avatar_id": child_data.avatar_id,
        "avatar_level": 1,
        "total_points": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "badges": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.children.insert_one(child_doc)
    
    # Remove pin_hash and _id from response
    child_doc.pop("pin_hash", None)
    child_doc.pop("_id", None)
    return child_doc

@api_router.put("/children/{child_id}")
async def update_child(child_id: str, update: ChildUpdate, request: Request):
    """Update a child's profile"""
    parent = await get_current_parent(request)
    
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    if update_data:
        await db.children.update_one(
            {"child_id": child_id},
            {"$set": update_data}
        )
    
    updated_child = await db.children.find_one(
        {"child_id": child_id},
        {"_id": 0, "pin_hash": 0}
    )
    
    return updated_child

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str, request: Request):
    """Delete a child account"""
    parent = await get_current_parent(request)
    
    result = await db.children.delete_one({
        "child_id": child_id,
        "parent_id": parent.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Clean up related data
    await db.habit_completions.delete_many({"child_id": child_id})
    await db.child_sessions.delete_many({"child_id": child_id})
    
    return {"success": True}

@api_router.get("/children/by-parent/{parent_id}")
async def get_children_by_parent(parent_id: str):
    """Get children for a specific parent (public for login screen)"""
    children = await db.children.find(
        {"parent_id": parent_id},
        {"_id": 0, "pin_hash": 0}
    ).to_list(100)
    
    return [{"child_id": c["child_id"], "name": c["name"], "avatar_id": c["avatar_id"]} for c in children]

# ==================== HABITS ENDPOINTS ====================

@api_router.get("/habits/preset")
async def get_preset_habits(age: Optional[int] = None):
    """Get all preset habits, optionally filtered by age"""
    if age is None:
        return PRESET_HABITS
    
    # Filter habits by age range
    filtered_habits = []
    for habit in PRESET_HABITS:
        min_age = habit.get("min_age", 6)
        max_age = habit.get("max_age", 14)
        if min_age <= age <= max_age:
            filtered_habits.append(habit)
    
    return filtered_habits

@api_router.get("/parent/habits-usage")
async def get_habits_usage(request: Request):
    """Get habits that are already used by this parent's children"""
    parent = await get_current_parent(request)
    
    # Get all habit assignments for parent's children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"child_id": 1, "_id": 0}
    ).to_list(20)
    
    child_ids = [c["child_id"] for c in children]
    
    # Get all assigned habits
    used_habits = set()
    for child_id in child_ids:
        assignment = await db.child_habits.find_one(
            {"child_id": child_id},
            {"habit_ids": 1, "_id": 0}
        )
        if assignment and assignment.get("habit_ids"):
            used_habits.update(assignment["habit_ids"])
    
    return {
        "used_habit_ids": list(used_habits),
        "total_used": len(used_habits)
    }

@api_router.get("/habits/suggestions/{child_id}")
async def get_habit_suggestions(child_id: str, request: Request):
    """Get habit suggestions for a specific child based on age"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    child_age = child.get("age", 8)
    
    # Get already assigned habits
    assignment = await db.child_habits.find_one({"child_id": child_id}, {"_id": 0})
    assigned_ids = set(assignment.get("habit_ids", [])) if assignment else set()
    
    # Filter habits by age and exclude already assigned
    suggestions = []
    for i, habit in enumerate(PRESET_HABITS):
        habit_id = f"preset_{i}"
        min_age = habit.get("min_age", 6)
        max_age = habit.get("max_age", 14)
        
        if min_age <= child_age <= max_age and habit_id not in assigned_ids:
            suggestions.append({
                "habit_id": habit_id,
                "is_custom": False,
                **habit
            })
    
    # Sort by points (higher first) and category variety
    suggestions.sort(key=lambda x: (-x["points"], x["category"]))
    
    return {
        "child_id": child_id,
        "child_name": child.get("name"),
        "child_age": child_age,
        "suggestions": suggestions[:10],  # Return top 10 suggestions
        "total_available": len(suggestions)
    }

@api_router.get("/habits")
async def get_all_habits(request: Request):
    """Get all habits (preset + custom) for the current parent"""
    parent = await get_current_parent(request)
    
    # Get custom habits created by this parent (including modified presets)
    custom_habits = await db.habits.find(
        {"parent_id": parent.user_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # Build a set of preset IDs that have been customized by this parent
    customized_preset_ids = set()
    for habit in custom_habits:
        if habit.get("original_preset_id"):
            customized_preset_ids.add(habit["original_preset_id"])
    
    # Combine with preset habits (but skip presets that have customized versions)
    all_habits = []
    
    for i, habit in enumerate(PRESET_HABITS):
        preset_id = f"preset_{i}"
        
        # Skip this preset if parent has a customized version
        if preset_id in customized_preset_ids:
            continue
            
        all_habits.append({
            "habit_id": preset_id,
            "parent_id": None,
            "is_custom": False,
            "is_active": True,
            # Default frequency for presets: once per day
            "frequency_type": "daily",
            "frequency_count": 1,
            "weekly_mode": "count",
            "frequency_days": None,
            **habit
        })
    
    # Ensure custom habits have frequency fields and proper display
    for habit in custom_habits:
        if "frequency_type" not in habit:
            habit["frequency_type"] = "daily"
        if "frequency_count" not in habit:
            habit["frequency_count"] = 1
        if "weekly_mode" not in habit:
            habit["weekly_mode"] = "count"
        if "frequency_days" not in habit:
            habit["frequency_days"] = None
        # Modified presets should show as custom for proper grouping
        if habit.get("is_preset_modified"):
            habit["is_custom"] = True
    
    all_habits.extend(custom_habits)
    
    return all_habits

@api_router.post("/habits")
async def create_custom_habit(habit_data: HabitCreate, request: Request):
    """Create a custom habit"""
    parent = await get_current_parent(request)
    
    habit_id = f"habit_{uuid.uuid4().hex[:12]}"
    
    # Handle categories - support both single category and multiple categories
    categories = habit_data.categories if habit_data.categories else [habit_data.category]
    
    habit_doc = {
        "habit_id": habit_id,
        "parent_id": parent.user_id,
        "name_el": habit_data.name_el,
        "name_en": habit_data.name_en,
        "points": habit_data.points,
        "category": categories[0] if categories else "general",  # Primary category for backward compat
        "categories": categories,  # All categories
        "verification_type": habit_data.verification_type,
        "emoji": habit_data.emoji,
        "is_custom": True,
        "is_active": True,
        # Frequency settings
        "frequency_type": habit_data.frequency_type,
        "frequency_count": habit_data.frequency_count,
        "weekly_mode": habit_data.weekly_mode,
        "frequency_days": habit_data.frequency_days,
        # Tips/Description (optional)
        "description_el": habit_data.description_el,
        "why_important_el": habit_data.why_important_el,
        "parent_tip_el": habit_data.parent_tip_el,
        # Retry delay (for ALL habits)
        "retry_delay_value": habit_data.retry_delay_value,
        "retry_delay_unit": habit_data.retry_delay_unit,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.habits.insert_one(habit_doc)
    
    # If child assignments provided, assign the habit to those children
    if habit_data.assigned_child_ids:
        for child_id in habit_data.assigned_child_ids:
            # Verify child belongs to parent
            child = await db.children.find_one({"child_id": child_id, "parent_id": parent.user_id})
            if child:
                await db.child_habits.update_one(
                    {"child_id": child_id},
                    {
                        "$addToSet": {"habit_ids": habit_id},
                        "$set": {"parent_id": parent.user_id, "updated_at": datetime.now(timezone.utc)}
                    },
                    upsert=True
                )
        habit_doc["assigned_child_ids"] = habit_data.assigned_child_ids
    
    # Remove _id from response
    habit_doc.pop("_id", None)
    return habit_doc

@api_router.put("/habits/{habit_id}")
async def update_habit(habit_id: str, habit_data: HabitUpdate, request: Request):
    """Update a habit (custom or customize a preset)"""
    parent = await get_current_parent(request)
    
    # First check if it's a preset habit
    preset_habit = None
    if habit_id.startswith("preset_"):
        try:
            idx = int(habit_id.replace("preset_", ""))
            if 0 <= idx < len(PRESET_HABITS):
                preset_habit = PRESET_HABITS[idx].copy()
                preset_habit["habit_id"] = habit_id
        except ValueError:
            logger.error(f"Invalid preset index: {habit_id}")
            pass
    
    # Find the habit in database
    habit = await db.habits.find_one({"habit_id": habit_id})
    
    # If neither in DB nor a preset, return 404
    if not habit and not preset_habit:
        logger.error(f"Habit not found: {habit_id}")
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Build update dict with only provided fields
    update_fields = {}
    
    if habit_data.name_el is not None:
        update_fields["name_el"] = habit_data.name_el
    if habit_data.name_en is not None:
        update_fields["name_en"] = habit_data.name_en
    if habit_data.points is not None:
        update_fields["points"] = habit_data.points
    if habit_data.category is not None:
        update_fields["category"] = habit_data.category
    if habit_data.categories is not None:
        update_fields["categories"] = habit_data.categories
        # Also update primary category for backward compatibility
        if habit_data.categories:
            update_fields["category"] = habit_data.categories[0]
    if habit_data.verification_type is not None:
        update_fields["verification_type"] = habit_data.verification_type
    if habit_data.emoji is not None:
        update_fields["emoji"] = habit_data.emoji
    if habit_data.frequency_type is not None:
        update_fields["frequency_type"] = habit_data.frequency_type
    if habit_data.frequency_count is not None:
        update_fields["frequency_count"] = habit_data.frequency_count
    if habit_data.weekly_mode is not None:
        update_fields["weekly_mode"] = habit_data.weekly_mode
    if habit_data.frequency_days is not None:
        update_fields["frequency_days"] = habit_data.frequency_days
    if habit_data.is_active is not None:
        update_fields["is_active"] = habit_data.is_active
    if habit_data.retry_delay_value is not None:
        update_fields["retry_delay_value"] = habit_data.retry_delay_value
    if habit_data.retry_delay_unit is not None:
        update_fields["retry_delay_unit"] = habit_data.retry_delay_unit
    # Tips/Description fields
    if habit_data.description_el is not None:
        update_fields["description_el"] = habit_data.description_el
    if habit_data.why_important_el is not None:
        update_fields["why_important_el"] = habit_data.why_important_el
    if habit_data.parent_tip_el is not None:
        update_fields["parent_tip_el"] = habit_data.parent_tip_el
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Handle preset habits - create a customized copy
    if preset_habit:
        # Check if parent already has a customized version
        existing_custom = await db.habits.find_one({
            "original_preset_id": habit_id,
            "parent_id": parent.user_id
        })
        
        if existing_custom:
            # Update the existing customized version
            await db.habits.update_one(
                {"habit_id": existing_custom["habit_id"]},
                {"$set": update_fields}
            )
            updated = await db.habits.find_one({"habit_id": existing_custom["habit_id"]}, {"_id": 0})
            return updated
        else:
            # Create a customized copy of the preset
            new_habit_id = f"habit_{uuid.uuid4().hex[:12]}"
            custom_habit = {
                **preset_habit,
                "habit_id": new_habit_id,
                "parent_id": parent.user_id,
                "is_preset_modified": True,
                "original_preset_id": habit_id,
                "is_custom": False,
                "is_active": True,  # Important: must be True for query to find it
                **update_fields,
                "created_at": datetime.now(timezone.utc)
            }
            logger.info(f"New custom habit data: {custom_habit}")
            result = await db.habits.insert_one(custom_habit)
            logger.info(f"Insert result: {result.inserted_id}")
            custom_habit.pop("_id", None)
            return custom_habit
    
    # Handle custom habits or already-customized presets in DB
    if habit:
        # If it's a preset in DB (no parent_id), create a customized copy
        if habit.get("parent_id") is None:
            # Check if parent already has a customized version
            existing_custom = await db.habits.find_one({
                "original_preset_id": habit_id,
                "parent_id": parent.user_id
            })
            
            if existing_custom:
                await db.habits.update_one(
                    {"habit_id": existing_custom["habit_id"]},
                    {"$set": update_fields}
                )
                updated = await db.habits.find_one({"habit_id": existing_custom["habit_id"]}, {"_id": 0})
                return updated
            else:
                new_habit_id = f"habit_{uuid.uuid4().hex[:12]}"
                custom_habit = {
                    **habit,
                    "habit_id": new_habit_id,
                    "parent_id": parent.user_id,
                    "is_preset_modified": True,
                    "original_preset_id": habit_id,
                    "is_custom": False,
                    **update_fields,
                    "created_at": datetime.now(timezone.utc)
                }
                custom_habit.pop("_id", None)
                await db.habits.insert_one(custom_habit)
                return custom_habit
        else:
            # It's a custom habit, verify ownership
            if habit.get("parent_id") != parent.user_id:
                raise HTTPException(status_code=403, detail="Not authorized to edit this habit")
            
            await db.habits.update_one(
                {"habit_id": habit_id},
                {"$set": update_fields}
            )
            
            updated = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
            return updated
    
    raise HTTPException(status_code=404, detail="Habit not found")

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, request: Request):
    """Delete a custom habit"""
    parent = await get_current_parent(request)
    
    result = await db.habits.delete_one({
        "habit_id": habit_id,
        "parent_id": parent.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    return {"success": True}

# ==================== CHILD HABIT ASSIGNMENTS ====================

@api_router.get("/children/{child_id}/habits")
async def get_child_habits(child_id: str, request: Request):
    """Get habits assigned to a specific child"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id}
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get assigned habit IDs
    assignment = await db.child_habits.find_one(
        {"child_id": child_id},
        {"_id": 0}
    )
    
    assigned_habit_ids = assignment.get("habit_ids", []) if assignment else []
    
    # Get all custom habits (including modified presets) for this parent
    custom_habits = await db.habits.find(
        {"parent_id": parent.user_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # Build a map of original_preset_id -> custom_habit for modified presets
    modified_presets = {}
    for habit in custom_habits:
        if habit.get("original_preset_id"):
            modified_presets[habit["original_preset_id"]] = habit
    
    # Build the habit list
    assigned_habits = []
    
    # Add preset habits (skip if there's a modified version)
    for i, habit in enumerate(PRESET_HABITS):
        preset_id = f"preset_{i}"
        
        # If this preset has been modified, use the modified version instead
        if preset_id in modified_presets:
            custom_habit = modified_presets[preset_id]
            # Check if either the preset_id OR the custom habit_id is assigned
            if preset_id in assigned_habit_ids or custom_habit["habit_id"] in assigned_habit_ids:
                assigned_habits.append({
                    **custom_habit,
                    "frequency_type": custom_habit.get("frequency_type", "daily"),
                    "frequency_count": custom_habit.get("frequency_count", 1),
                    "weekly_mode": custom_habit.get("weekly_mode", "count"),
                    "frequency_days": custom_habit.get("frequency_days"),
                })
        elif preset_id in assigned_habit_ids:
            assigned_habits.append({
                "habit_id": preset_id,
                "parent_id": None,
                "is_custom": False,
                "is_active": True,
                "frequency_type": "daily",
                "frequency_count": 1,
                "weekly_mode": "count",
                "frequency_days": None,
                **habit
            })
    
    # Add custom habits (excluding modified presets which are already handled above)
    for habit in custom_habits:
        if not habit.get("original_preset_id") and habit["habit_id"] in assigned_habit_ids:
            # Ensure frequency fields exist
            if "frequency_type" not in habit:
                habit["frequency_type"] = "daily"
            if "frequency_count" not in habit:
                habit["frequency_count"] = 1
            assigned_habits.append(habit)
    
    return {
        "child_id": child_id,
        "child_name": child.get("name"),
        "assigned_habits": assigned_habits,
        "habit_ids": assigned_habit_ids
    }

@api_router.put("/children/{child_id}/habits")
async def assign_habits_to_child(child_id: str, assignment: ChildHabitAssignment, request: Request):
    """Assign habits to a specific child"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id}
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Upsert the assignment
    await db.child_habits.update_one(
        {"child_id": child_id},
        {
            "$set": {
                "child_id": child_id,
                "parent_id": parent.user_id,
                "habit_ids": assignment.habit_ids,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    logger.info(f"Assigned {len(assignment.habit_ids)} habits to child {child_id}")
    
    return {
        "success": True,
        "child_id": child_id,
        "habit_ids": assignment.habit_ids
    }

# ==================== REWARDS ENDPOINTS ====================

@api_router.get("/rewards")
async def get_rewards(request: Request):
    """Get all rewards created by the parent"""
    parent = await get_current_parent(request)
    
    rewards = await db.rewards.find(
        {"parent_id": parent.user_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return rewards

@api_router.post("/rewards")
async def create_reward(reward_data: RewardCreate, request: Request):
    """Create a new reward"""
    parent = await get_current_parent(request)
    
    reward_id = f"reward_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc)
    
    reward_doc = {
        "reward_id": reward_id,
        "parent_id": parent.user_id,
        "name_el": reward_data.name_el,
        "name_en": reward_data.name_en or reward_data.name_el,
        "description_el": reward_data.description_el,
        "points_cost": reward_data.points_cost,
        "emoji": reward_data.emoji,
        "child_ids": reward_data.child_ids,  # Empty = all children
        "is_recurring": reward_data.is_recurring,  # NEW: Recurring vs one-off
        "is_active": True,
        "created_at": created_at
    }
    
    await db.rewards.insert_one(reward_doc)
    
    logger.info(f"Created reward: {reward_data.name_el} ({reward_data.points_cost} points, recurring={reward_data.is_recurring})")
    
    # Return clean response without MongoDB _id
    return {
        "reward_id": reward_id,
        "parent_id": parent.user_id,
        "name_el": reward_data.name_el,
        "name_en": reward_data.name_en or reward_data.name_el,
        "description_el": reward_data.description_el,
        "points_cost": reward_data.points_cost,
        "emoji": reward_data.emoji,
        "child_ids": reward_data.child_ids,
        "is_recurring": reward_data.is_recurring,
        "is_active": True,
        "created_at": created_at.isoformat()
    }

@api_router.delete("/rewards/{reward_id}")
async def delete_reward(reward_id: str, request: Request):
    """Delete a reward"""
    parent = await get_current_parent(request)
    
    result = await db.rewards.update_one(
        {"reward_id": reward_id, "parent_id": parent.user_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    return {"success": True}

class RewardUpdate(BaseModel):
    name_el: Optional[str] = None
    description_el: Optional[str] = None
    points_cost: Optional[int] = None
    emoji: Optional[str] = None
    is_recurring: Optional[bool] = None
    available_from: Optional[str] = None  # ISO date string
    available_until: Optional[str] = None  # ISO date string

@api_router.put("/rewards/{reward_id}")
async def update_reward(reward_id: str, reward_data: RewardUpdate, request: Request):
    """Update an existing reward"""
    parent = await get_current_parent(request)
    
    # Build update dict with only provided fields
    update_fields = {}
    if reward_data.name_el is not None:
        update_fields["name_el"] = reward_data.name_el
    if reward_data.description_el is not None:
        update_fields["description_el"] = reward_data.description_el
    if reward_data.points_cost is not None:
        if reward_data.points_cost < 10:
            raise HTTPException(status_code=400, detail="Points cost must be at least 10")
        update_fields["points_cost"] = reward_data.points_cost
    if reward_data.emoji is not None:
        update_fields["emoji"] = reward_data.emoji
    if reward_data.is_recurring is not None:
        update_fields["is_recurring"] = reward_data.is_recurring
    # Handle date availability
    if reward_data.available_from is not None:
        if reward_data.available_from == "":
            update_fields["available_from"] = None
        else:
            update_fields["available_from"] = datetime.fromisoformat(reward_data.available_from.replace("Z", "+00:00"))
    if reward_data.available_until is not None:
        if reward_data.available_until == "":
            update_fields["available_until"] = None
        else:
            update_fields["available_until"] = datetime.fromisoformat(reward_data.available_until.replace("Z", "+00:00"))
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.rewards.update_one(
        {"reward_id": reward_id, "parent_id": parent.user_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found or no changes made")
    
    # Get updated reward
    updated_reward = await db.rewards.find_one(
        {"reward_id": reward_id},
        {"_id": 0}
    )
    
    return updated_reward

@api_router.get("/parent/redemptions/count")
async def get_pending_redemptions_count(request: Request):
    """Get count of pending reward redemptions"""
    parent = await get_current_parent(request)
    
    count = await db.reward_redemptions.count_documents({
        "parent_id": parent.user_id,
        "status": "pending"
    })
    
    return {"count": count}

@api_router.get("/child/rewards")
async def get_child_rewards(request: Request):
    """Get available rewards for the current child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    parent_id = session["parent_id"]
    
    # Get child's current points
    child = await db.children.find_one(
        {"child_id": child_id},
        {"total_points": 1, "_id": 0}
    )
    current_points = child.get("total_points", 0) if child else 0
    
    # Get rewards available to this child
    rewards = await db.rewards.find(
        {
            "parent_id": parent_id,
            "is_active": True,
            "$or": [
                {"child_ids": {"$size": 0}},  # Available to all
                {"child_ids": child_id}  # Specifically assigned
            ]
        },
        {"_id": 0}
    ).to_list(100)
    
    now = datetime.now(timezone.utc)
    
    # Add can_redeem flag and date availability info
    for reward in rewards:
        # Check date availability
        available_from = reward.get("available_from")
        available_until = reward.get("available_until")
        
        is_available_now = True
        availability_message = None
        
        if available_from and available_from > now:
            is_available_now = False
            availability_message = f"Διαθέσιμο από {available_from.strftime('%d/%m/%Y')}"
        elif available_until and available_until < now:
            is_available_now = False
            availability_message = "Η διαθεσιμότητα έληξε"
        
        reward["is_available_now"] = is_available_now
        reward["availability_message"] = availability_message
        reward["can_redeem"] = is_available_now and current_points >= reward["points_cost"]
        reward["points_needed"] = max(0, reward["points_cost"] - current_points)
    
    return {
        "rewards": rewards,
        "current_points": current_points
    }

@api_router.post("/child/rewards/{reward_id}/redeem")
async def redeem_reward(reward_id: str, request: Request):
    """Redeem a reward using points"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    parent_id = session["parent_id"]
    
    # Get reward
    reward = await db.rewards.find_one(
        {
            "reward_id": reward_id,
            "parent_id": parent_id,
            "is_active": True
        },
        {"_id": 0}
    )
    
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Check if child can access this reward
    if reward.get("child_ids") and child_id not in reward["child_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized for this reward")
    
    # Get child's points
    child = await db.children.find_one(
        {"child_id": child_id},
        {"total_points": 1, "name": 1, "_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    current_points = child.get("total_points", 0)
    
    if current_points < reward["points_cost"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Δεν έχεις αρκετούς πόντους. Χρειάζεσαι {reward['points_cost'] - current_points} ακόμα!"
        )
    
    # Deduct points
    new_points = current_points - reward["points_cost"]
    await db.children.update_one(
        {"child_id": child_id},
        {"$set": {"total_points": new_points}}
    )
    
    # Record redemption
    redemption_doc = {
        "redemption_id": f"redeem_{uuid.uuid4().hex[:12]}",
        "child_id": child_id,
        "parent_id": parent_id,
        "reward_id": reward_id,
        "reward_name": reward["name_el"],
        "points_spent": reward["points_cost"],
        "status": "pending",  # Parent needs to fulfill it
        "redeemed_at": datetime.now(timezone.utc)
    }
    
    await db.reward_redemptions.insert_one(redemption_doc)
    
    logger.info(f"Child {child['name']} redeemed reward: {reward['name_el']} for {reward['points_cost']} points")
    
    # Send push notification to parent
    try:
        parent = await db.parents.find_one({"user_id": parent_id}, {"_id": 0})
        if parent:
            await send_push_notification(
                parent,
                title=f"🎁 Εξαργύρωση από {child['name']}!",
                body=f"{child['name']} εξαργύρωσε το '{reward['name_el']}' ({reward['points_cost']} πόντοι)",
                data={"type": "redemption", "child_id": child_id, "reward_id": reward_id}
            )
    except Exception as e:
        logger.warning(f"Failed to send redemption notification: {e}")
    
    return {
        "success": True,
        "reward_name": reward["name_el"],
        "points_spent": reward["points_cost"],
        "remaining_points": new_points,
        "message": f"🎉 Μπράβο! Εξαργύρωσες το '{reward['name_el']}'!"
    }

@api_router.get("/parent/redemptions")
async def get_pending_redemptions(request: Request):
    """Get pending reward redemptions for parent to fulfill"""
    parent = await get_current_parent(request)
    
    redemptions = await db.reward_redemptions.find(
        {"parent_id": parent.user_id, "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    # Add child names and reward names
    for redemption in redemptions:
        child = await db.children.find_one(
            {"child_id": redemption["child_id"]},
            {"name": 1, "_id": 0}
        )
        redemption["child_name"] = child["name"] if child else "Unknown"
        
        reward = await db.rewards.find_one(
            {"reward_id": redemption["reward_id"]},
            {"name_el": 1, "emoji": 1, "_id": 0}
        )
        redemption["reward_name"] = reward["name_el"] if reward else "Unknown"
        redemption["reward_emoji"] = reward.get("emoji", "🎁") if reward else "🎁"
    
    return redemptions

@api_router.post("/parent/redemptions/{redemption_id}/fulfill")
async def fulfill_redemption(redemption_id: str, request: Request):
    """Mark a redemption as fulfilled"""
    parent = await get_current_parent(request)
    
    result = await db.reward_redemptions.update_one(
        {"redemption_id": redemption_id, "parent_id": parent.user_id},
        {
            "$set": {
                "status": "fulfilled",
                "fulfilled_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Redemption not found")
    
    return {"success": True}

# ==================== POINTS HISTORY ENDPOINTS ====================

@api_router.get("/child/points-history")
async def get_child_points_history(request: Request):
    """Get points spending history for the current child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    # Get child's current info
    child = await db.children.find_one(
        {"child_id": child_id},
        {"_id": 0, "total_points": 1, "name": 1}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get all redemptions for this child
    redemptions = await db.reward_redemptions.find(
        {"child_id": child_id},
        {"_id": 0}
    ).sort("redeemed_at", -1).to_list(50)
    
    # Calculate total spent
    total_spent = sum(r.get("points_spent", 0) for r in redemptions)
    
    # Get all habit completions to calculate total earned
    completions = await db.habit_completions.find(
        {"child_id": child_id, "status": "approved"},
        {"_id": 0, "points_earned": 1, "completed_at": 1, "habit_id": 1}
    ).sort("completed_at", -1).to_list(100)
    
    total_earned = sum(c.get("points_earned", 0) for c in completions)
    
    return {
        "child_name": child.get("name"),
        "current_points": child.get("total_points", 0),
        "total_earned": total_earned,
        "total_spent": total_spent,
        "redemption_history": redemptions,
        "recent_earnings": completions[:20]  # Last 20 earnings
    }

@api_router.get("/parent/children-points-history")
async def get_parent_children_points_history(request: Request):
    """Get points history for all children of the parent"""
    parent = await get_current_parent(request)
    
    # Get all children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).to_list(20)
    
    result = []
    
    for child in children:
        child_id = child["child_id"]
        
        # Get redemptions
        redemptions = await db.reward_redemptions.find(
            {"child_id": child_id},
            {"_id": 0}
        ).sort("redeemed_at", -1).to_list(20)
        
        total_spent = sum(r.get("points_spent", 0) for r in redemptions)
        
        # Get completions
        completions = await db.habit_completions.find(
            {"child_id": child_id, "status": "approved"},
            {"_id": 0, "points_earned": 1}
        ).to_list(200)
        
        total_earned = sum(c.get("points_earned", 0) for c in completions)
        
        result.append({
            "child_id": child_id,
            "child_name": child.get("name"),
            "avatar_id": child.get("avatar_id", 1),
            "current_points": child.get("total_points", 0),
            "total_earned": total_earned,
            "total_spent": total_spent,
            "recent_redemptions": redemptions[:5]  # Last 5 redemptions
        })
    
    return result


@api_router.get("/parent/comprehensive-points-history/{child_id}")
async def get_comprehensive_points_history(child_id: str, days: int = 30, request: Request = None):
    """Get comprehensive points history for a specific child with all transaction types"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days) if days > 0 else None
    
    transactions = []
    
    def safe_format_date(dt):
        """Safely format a date to string"""
        if dt is None:
            return None
        if isinstance(dt, str):
            return dt[:10] if len(dt) >= 10 else dt
        try:
            return dt.strftime("%Y-%m-%d")
        except:
            return None
    
    def safe_get_timestamp(record, *keys):
        """Get the first valid timestamp from a record"""
        for key in keys:
            val = record.get(key)
            if val:
                return val
        return None
    
    # 1. Get habit completions (points earned) - limit for performance
    try:
        completion_filter = {"child_id": child_id, "status": "approved"}
        if start_date:
            completion_filter["completed_at"] = {"$gte": start_date}
        
        completions = await db.habit_completions.find(
            completion_filter,
            {"_id": 0, "completion_id": 1, "habit_id": 1, "habit_name": 1, "points_earned": 1, 
             "completed_at": 1, "approved_at": 1, "date": 1, "needed_help": 1, "was_postponed": 1}
        ).sort("completed_at", -1).to_list(100)  # Limit to 100 for performance
        
        # Get habit names for completions (batch query)
        habit_ids = list(set(c.get("habit_id") for c in completions if c.get("habit_id")))
        habits = await db.habits.find(
            {"habit_id": {"$in": habit_ids}}, 
            {"_id": 0, "habit_id": 1, "name_el": 1, "emoji": 1}
        ).to_list(100)
        habit_map = {h["habit_id"]: h for h in habits}
        
        for c in completions:
            habit = habit_map.get(c.get("habit_id"), {})
            timestamp = safe_get_timestamp(c, "completed_at", "approved_at")
            transactions.append({
                "id": c.get("completion_id"),
                "type": "habit_completion",
                "category": "earned",
                "title": habit.get("name_el", c.get("habit_name", "Συνήθεια")),
                "emoji": habit.get("emoji", "✅"),
                "points": c.get("points_earned", 0),
                "timestamp": timestamp,
                "date": c.get("date") or safe_format_date(timestamp),
                "details": {
                    "needed_help": c.get("needed_help", False),
                    "was_postponed": c.get("was_postponed", False),
                }
            })
    except Exception as e:
        logger.error(f"Error loading completions: {e}")
    
    # 2. Get love credits received
    try:
        love_filter = {"child_id": child_id}
        if start_date:
            love_filter["created_at"] = {"$gte": start_date}
        
        love_credits = await db.love_credits.find(
            love_filter,
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)  # Limit for performance
        
        for lc in love_credits:
            timestamp = lc.get("created_at")
            transactions.append({
                "id": lc.get("credit_id", ""),
                "type": "love_credit",
                "category": "earned",
                "title": lc.get("message", "Love Credits"),
                "emoji": "💕",
                "points": lc.get("amount", 0),
                "timestamp": timestamp,
                "date": safe_format_date(timestamp),
                "details": {
                    "claimed": lc.get("claimed", False),
                }
            })
    except Exception as e:
        logger.error(f"Error loading love credits: {e}")
    
    # 3. Get reward redemptions (points spent)
    try:
        redemption_filter = {"child_id": child_id}
        if start_date:
            redemption_filter["redeemed_at"] = {"$gte": start_date}
        
        redemptions = await db.reward_redemptions.find(
            redemption_filter,
            {"_id": 0}
        ).sort("redeemed_at", -1).to_list(50)  # Limit for performance
        
        # Get reward details (batch query)
        reward_ids = list(set(r.get("reward_id") for r in redemptions if r.get("reward_id")))
        rewards = await db.rewards.find(
            {"reward_id": {"$in": reward_ids}}, 
            {"_id": 0, "reward_id": 1, "name_el": 1, "emoji": 1}
        ).to_list(100)
        reward_map = {r["reward_id"]: r for r in rewards}
        
        for r in redemptions:
            reward = reward_map.get(r.get("reward_id"), {})
            is_fulfilled = r.get("fulfilled", False) or r.get("status") == "fulfilled"
            timestamp = r.get("redeemed_at")
            transactions.append({
                "id": r.get("redemption_id"),
                "type": "reward_redemption",
                "category": "spent",
                "title": reward.get("name_el", r.get("reward_title", "Έπαθλο")),
                "emoji": reward.get("emoji", "🎁"),
                "points": -r.get("points_spent", 0),
                "timestamp": timestamp,
                "date": safe_format_date(timestamp),
                "details": {
                    "fulfilled": is_fulfilled,
                }
            })
    except Exception as e:
        logger.error(f"Error loading redemptions: {e}")
    
    # 4. Get points history (inactivity penalties and other deductions)
    try:
        history_filter = {"child_id": child_id}
        if start_date:
            history_filter["created_at"] = {"$gte": start_date}
        
        points_history = await db.points_history.find(
            history_filter,
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        for ph in points_history:
            timestamp = ph.get("created_at")
            points_value = ph.get("points", 0)
            reason = ph.get("reason", "unknown")
            
            # Determine category based on points value
            if points_value < 0:
                category = "lost"
                emoji = "⚠️"
                if reason == "inactivity_penalty":
                    emoji = "😢"
            else:
                category = "earned"
                emoji = "🎁"
            
            transactions.append({
                "id": ph.get("history_id", f"ph_{timestamp}"),
                "type": reason,
                "category": category,
                "title": ph.get("description_el", ph.get("description_en", "Αλλαγή πόντων")),
                "emoji": emoji,
                "points": points_value,
                "timestamp": timestamp,
                "date": safe_format_date(timestamp),
                "details": {
                    "reason": reason,
                }
            })
    except Exception as e:
        logger.error(f"Error loading points history: {e}")
    
    # Sort all transactions by timestamp (most recent first)
    def sort_key(t):
        ts = t.get("timestamp")
        if ts is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        if isinstance(ts, str):
            try:
                return datetime.fromisoformat(ts.replace('Z', '+00:00'))
            except:
                return datetime.min.replace(tzinfo=timezone.utc)
        return ts
    
    transactions.sort(key=sort_key, reverse=True)
    
    # Calculate summary
    total_earned = sum(t["points"] for t in transactions if t["category"] == "earned")
    total_spent = abs(sum(t["points"] for t in transactions if t["category"] == "spent"))
    total_lost = abs(sum(t["points"] for t in transactions if t["category"] == "lost"))
    
    # Group by category
    grouped = {
        "earned": [t for t in transactions if t["category"] == "earned"],
        "spent": [t for t in transactions if t["category"] == "spent"],
        "lost": [t for t in transactions if t["category"] == "lost"],
    }
    
    return {
        "child_id": child_id,
        "child_name": child.get("name"),
        "avatar_id": child.get("avatar_id", 1),
        "current_balance": child.get("total_points", 0),
        "period_days": days,
        "summary": {
            "total_earned": total_earned,
            "total_spent": total_spent,
            "total_lost": total_lost,
            "net_change": total_earned - total_spent - total_lost,
            "transaction_count": len(transactions),
        },
        "transactions": transactions,
        "grouped": grouped,
    }


@api_router.get("/child/dashboard-summary")
async def get_child_dashboard_summary(request: Request):
    """Get a summary for the child's playful homepage"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get child info
    child = await db.children.find_one(
        {"child_id": child_id},
        {"_id": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get today's completions
    today_completions = await db.habit_completions.find(
        {"child_id": child_id, "date": today, "status": "approved"},
        {"_id": 0}
    ).to_list(50)
    
    # Get total tasks assigned
    assignment = await db.child_habits.find_one(
        {"child_id": child_id},
        {"_id": 0}
    )
    total_tasks = len(assignment.get("habit_ids", [])) if assignment else 0
    
    # Get recent achievements (last 7 days completions)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    recent_completions = await db.habit_completions.find(
        {"child_id": child_id, "date": {"$gte": week_ago}, "status": "approved"},
        {"_id": 0, "habit_id": 1, "points_earned": 1, "date": 1}
    ).sort("completed_at", -1).to_list(50)
    
    # Get recent redemptions
    recent_redemptions = await db.reward_redemptions.find(
        {"child_id": child_id},
        {"_id": 0}
    ).sort("redeemed_at", -1).to_list(5)
    
    # Calculate stats
    points_earned_today = sum(c.get("points_earned", 0) for c in today_completions)
    points_earned_week = sum(c.get("points_earned", 0) for c in recent_completions)
    
    # Get habit names for recent completions
    habit_names = {}
    for i, habit in enumerate(PRESET_HABITS):
        habit_names[f"preset_{i}"] = habit["name_el"]
    
    # Custom habits
    custom_habits = await db.habits.find(
        {"parent_id": session["parent_id"]},
        {"_id": 0, "habit_id": 1, "name_el": 1}
    ).to_list(50)
    
    for habit in custom_habits:
        habit_names[habit["habit_id"]] = habit["name_el"]
    
    # Build recent achievements with names
    achievements = []
    for comp in recent_completions[:10]:
        achievements.append({
            "habit_name": habit_names.get(comp["habit_id"], "Συνήθεια"),
            "points": comp.get("points_earned", 0),
            "date": comp.get("date")
        })
    
    return {
        "child_name": child.get("name"),
        "avatar_id": child.get("avatar_id", 1),
        "avatar_level": child.get("avatar_level", 1),
        "current_points": child.get("total_points", 0),
        "current_streak": child.get("current_streak", 0),
        "longest_streak": child.get("longest_streak", 0),
        "badges": child.get("badges", []),
        "today": {
            "completed": len(today_completions),
            "total": total_tasks,
            "points_earned": points_earned_today
        },
        "week": {
            "total_completions": len(recent_completions),
            "points_earned": points_earned_week
        },
        "recent_achievements": achievements,
        "recent_redemptions": recent_redemptions
    }

# ==================== HABIT COMPLETION ENDPOINTS ====================

@api_router.get("/child/tasks")
async def get_child_tasks(request: Request):
    """Get today's tasks for the current child (only assigned habits)"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    parent_id = session["parent_id"]
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    
    # Get parent's info
    parent = await db.parents.find_one(
        {"user_id": parent_id},
        {"_id": 0}
    )
    
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    # Get assigned habit IDs for this child
    assignment = await db.child_habits.find_one(
        {"child_id": child_id},
        {"_id": 0}
    )
    
    assigned_habit_ids = assignment.get("habit_ids", []) if assignment else []
    
    # If no habits assigned, return empty list
    if not assigned_habit_ids:
        return []
    
    # Get all custom habits (including modified presets) for this parent
    custom_habits = await db.habits.find(
        {"parent_id": parent_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # Build a map of original_preset_id -> custom_habit for modified presets
    modified_presets = {}
    for habit in custom_habits:
        if habit.get("original_preset_id"):
            modified_presets[habit["original_preset_id"]] = habit
    
    # Build the habit list from assigned habits only
    all_habits = []
    
    for i, habit in enumerate(PRESET_HABITS):
        preset_id = f"preset_{i}"
        
        # Check if this preset has been modified
        if preset_id in modified_presets:
            custom_habit = modified_presets[preset_id]
            # Check if either the preset_id OR the custom habit_id is assigned
            if preset_id in assigned_habit_ids or custom_habit["habit_id"] in assigned_habit_ids:
                all_habits.append({
                    **custom_habit,
                    "frequency_type": custom_habit.get("frequency_type", "daily"),
                    "frequency_count": custom_habit.get("frequency_count", 1),
                    "weekly_mode": custom_habit.get("weekly_mode", "count"),
                    "frequency_days": custom_habit.get("frequency_days"),
                })
        elif preset_id in assigned_habit_ids:
            all_habits.append({
                "habit_id": preset_id,
                "parent_id": None,
                "is_custom": False,
                "is_active": True,
                "frequency_type": "daily",
                "frequency_count": 1,
                "weekly_mode": "count",
                "frequency_days": None,
                **habit
            })
    
    # Get custom habits (excluding modified presets which are already handled above)
    for habit in custom_habits:
        if not habit.get("original_preset_id") and habit["habit_id"] in assigned_habit_ids:
            # Ensure frequency fields exist
            if "frequency_type" not in habit:
                habit["frequency_type"] = "daily"
            if "frequency_count" not in habit:
                habit["frequency_count"] = 1
            all_habits.append(habit)
    
    # Calculate week start for weekly habits
    week_start = now - timedelta(days=now.weekday())
    week_start_str = week_start.strftime("%Y-%m-%d")
    month_start = now.replace(day=1).strftime("%Y-%m-%d")
    
    # Get completions for all time periods we might need
    all_completions = await db.habit_completions.find(
        {"child_id": child_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Build completion counts by habit and period (only count APPROVED completions)
    completion_counts = {}
    pending_counts = {}
    last_completion_times = {}  # Track most recent completion (any status) for retry delay
    
    for habit in all_habits:
        habit_id = habit["habit_id"]
        freq_type = habit.get("frequency_type", "daily")
        
        # IDs to check (habit itself + original preset if modified)
        ids_to_check = [habit_id]
        if habit.get("original_preset_id"):
            ids_to_check.append(habit["original_preset_id"])
        
        approved_count = 0
        pending_count = 0
        latest_completion = None
        
        for comp in all_completions:
            if comp.get("habit_id") not in ids_to_check and comp.get("original_habit_id") not in ids_to_check:
                continue
            
            comp_date = comp.get("date", "")
            comp_status = comp.get("status", "approved")
            completed_at = comp.get("completed_at")
            
            # Check if this completion is in the relevant period
            in_period = False
            if freq_type == "daily" and comp_date == today:
                in_period = True
            elif freq_type == "weekly" and comp_date >= week_start_str:
                in_period = True
            elif freq_type == "monthly" and comp_date >= month_start:
                in_period = True
            elif freq_type == "once":
                in_period = True
            
            if in_period:
                if comp_status == "approved":
                    approved_count += 1
                elif comp_status == "pending":
                    pending_count += 1
                
                # Track most recent completion (any status) for retry delay
                if completed_at and (latest_completion is None or completed_at > latest_completion):
                    latest_completion = completed_at
        
        completion_counts[habit_id] = approved_count
        pending_counts[habit_id] = pending_count
        if latest_completion:
            last_completion_times[habit_id] = latest_completion
    
    # Get pending help requests for this child
    pending_help = await db.help_requests.find(
        {"child_id": child_id, "status": "pending"},
        {"_id": 0}
    ).to_list(100)
    
    pending_help_habits = {h["habit_id"]: h for h in pending_help}
    
    # Build task list with completion progress
    tasks = []
    for habit in all_habits:
        habit_id = habit["habit_id"]
        freq_count = habit.get("frequency_count", 1)
        completed_count = completion_counts.get(habit_id, 0)  # Only approved
        pending_count = pending_counts.get(habit_id, 0)
        
        # IDs to check for help requests
        help_request = pending_help_habits.get(habit_id)
        if not help_request and habit.get("original_preset_id"):
            help_request = pending_help_habits.get(habit["original_preset_id"])
        
        # Determine if fully completed for the period
        is_fully_completed = completed_count >= freq_count
        
        # Check retry delay based on last completion time (any status)
        can_retry = True
        retry_blocked_until = None
        last_completion = last_completion_times.get(habit_id)
        
        retry_delay_value = habit.get("retry_delay_value")
        retry_delay_unit = habit.get("retry_delay_unit")
        
        # If not fully completed AND has retry delay AND has a recent completion
        if not is_fully_completed and retry_delay_value and retry_delay_unit and last_completion:
            # Ensure last_completion is timezone-aware
            if last_completion.tzinfo is None:
                last_completion = last_completion.replace(tzinfo=timezone.utc)
            
            if retry_delay_unit == "minutes":
                retry_blocked_until = last_completion + timedelta(minutes=retry_delay_value)
            elif retry_delay_unit == "hours":
                retry_blocked_until = last_completion + timedelta(hours=retry_delay_value)
            elif retry_delay_unit == "days":
                retry_blocked_until = last_completion + timedelta(days=retry_delay_value)
            
            if retry_blocked_until and now < retry_blocked_until:
                can_retry = False
        
        tasks.append({
            **habit,
            "completed": is_fully_completed,
            "completed_count": completed_count,
            "pending_count": pending_count,
            "required_count": freq_count,
            "remaining_count": max(0, freq_count - completed_count),
            "progress_text": f"{completed_count}/{freq_count}" if freq_count > 1 else None,
            "status": "completed" if is_fully_completed else ("pending" if pending_count > 0 else ("in_progress" if completed_count > 0 else None)),
            "help_requested": help_request is not None,
            "help_request_id": help_request["help_id"] if help_request else None,
            "can_retry": can_retry,
            "retry_blocked_until": retry_blocked_until.isoformat() if retry_blocked_until else None,
        })
    
    return tasks

@api_router.post("/child/tasks/{habit_id}/complete")
async def complete_task(habit_id: str, request: Request):
    """Mark a task as complete"""
    session = await get_current_child_session(request)
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    
    # Get habit info (check for modified preset first)
    habit = None
    original_habit_id = habit_id
    
    # First check if there's a modified version of this preset
    if habit_id.startswith("preset_"):
        # Check if parent has a customized version
        modified_habit = await db.habits.find_one({
            "original_preset_id": habit_id,
            "is_active": True
        }, {"_id": 0})
        
        if modified_habit:
            habit = modified_habit
            original_habit_id = habit_id  # Keep original for compatibility
        else:
            idx = int(habit_id.replace("preset_", ""))
            if 0 <= idx < len(PRESET_HABITS):
                habit = {
                    **PRESET_HABITS[idx], 
                    "habit_id": habit_id,
                    "frequency_type": "daily",
                    "frequency_count": 1
                }
    else:
        habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Get frequency settings
    frequency_type = habit.get("frequency_type", "daily")
    frequency_count = habit.get("frequency_count", 1)
    weekly_mode = habit.get("weekly_mode", "count")
    frequency_days = habit.get("frequency_days", [])
    
    # Calculate the period for checking completions
    if frequency_type == "daily":
        # Check completions for today
        period_start = today
        period_query = {"date": today}
    elif frequency_type == "weekly":
        # Check completions for this week (Monday to Sunday)
        week_start = now - timedelta(days=now.weekday())
        week_start_str = week_start.strftime("%Y-%m-%d")
        period_query = {"date": {"$gte": week_start_str}}
    elif frequency_type == "monthly":
        # Check completions for this month
        month_start = now.replace(day=1).strftime("%Y-%m-%d")
        period_query = {"date": {"$gte": month_start}}
    elif frequency_type == "once":
        # Check if ever completed
        period_query = {}
    else:
        period_query = {"date": today}
    
    # Count existing completions in the period by status
    # Use both the original habit_id and any modified version's habit_id
    habit_ids_to_check = [habit_id]
    if habit.get("habit_id") != habit_id:
        habit_ids_to_check.append(habit["habit_id"])
    if habit.get("original_preset_id"):
        habit_ids_to_check.append(habit["original_preset_id"])
    
    # Get all completions for this period
    period_completions = await db.habit_completions.find({
        "child_id": session["child_id"],
        "habit_id": {"$in": habit_ids_to_check},
        **period_query
    }, {"_id": 0, "status": 1, "rejected_at": 1, "completed_at": 1}).to_list(100)
    
    # Count by status
    approved_count = sum(1 for c in period_completions if c.get("status") == "approved")
    pending_count = sum(1 for c in period_completions if c.get("status") == "pending")
    rejected_count = sum(1 for c in period_completions if c.get("status") == "rejected")
    
    # Calculate "active" completions (approved + pending)
    active_completions = approved_count + pending_count
    
    # Check if already at the limit (approved + pending >= frequency_count)
    if active_completions >= frequency_count:
        if frequency_type == "daily":
            if pending_count > 0:
                raise HTTPException(status_code=400, detail=f"Έχεις ήδη {pending_count} αίτημα που περιμένει έγκριση. Περίμενε τον γονέα!")
            raise HTTPException(status_code=400, detail=f"Η συνήθεια έχει ολοκληρωθεί {frequency_count} φορές σήμερα")
        elif frequency_type == "weekly":
            if pending_count > 0:
                raise HTTPException(status_code=400, detail=f"Έχεις ήδη {pending_count} αίτημα που περιμένει έγκριση. Περίμενε τον γονέα!")
            raise HTTPException(status_code=400, detail=f"Η συνήθεια έχει ολοκληρωθεί {frequency_count} φορές αυτή την εβδομάδα")
        elif frequency_type == "monthly":
            if pending_count > 0:
                raise HTTPException(status_code=400, detail=f"Έχεις ήδη {pending_count} αίτημα που περιμένει έγκριση. Περίμενε τον γονέα!")
            raise HTTPException(status_code=400, detail=f"Η συνήθεια έχει ολοκληρωθεί {frequency_count} φορές αυτόν τον μήνα")
        elif frequency_type == "once":
            if pending_count > 0:
                raise HTTPException(status_code=400, detail="Έχεις ήδη αίτημα που περιμένει έγκριση. Περίμενε τον γονέα!")
            raise HTTPException(status_code=400, detail="Η συνήθεια έχει ήδη ολοκληρωθεί")
        else:
            raise HTTPException(status_code=400, detail="Task already completed")
    
    # Check retry delay if there was a rejection
    if rejected_count > 0:
        retry_delay_value = habit.get("retry_delay_value")
        retry_delay_unit = habit.get("retry_delay_unit")
        
        if retry_delay_value and retry_delay_unit:
            # Find most recent rejection
            latest_rejection = None
            for c in period_completions:
                if c.get("status") == "rejected":
                    rejected_at = c.get("rejected_at") or c.get("completed_at")
                    if rejected_at:
                        # Ensure timezone awareness
                        if rejected_at.tzinfo is None:
                            rejected_at = rejected_at.replace(tzinfo=timezone.utc)
                        if latest_rejection is None or rejected_at > latest_rejection:
                            latest_rejection = rejected_at
            
            if latest_rejection:
                # Ensure timezone awareness for latest_rejection
                if latest_rejection.tzinfo is None:
                    latest_rejection = latest_rejection.replace(tzinfo=timezone.utc)
                if retry_delay_unit == "minutes":
                    retry_allowed_at = latest_rejection + timedelta(minutes=retry_delay_value)
                elif retry_delay_unit == "hours":
                    retry_allowed_at = latest_rejection + timedelta(hours=retry_delay_value)
                elif retry_delay_unit == "days":
                    retry_allowed_at = latest_rejection + timedelta(days=retry_delay_value)
                else:
                    retry_allowed_at = latest_rejection
                
                if now < retry_allowed_at:
                    remaining = retry_allowed_at - now
                    if retry_delay_unit == "minutes":
                        raise HTTPException(status_code=400, detail=f"Μπορείς να ξαναδοκιμάσεις σε {int(remaining.total_seconds() / 60)} λεπτά")
                    elif retry_delay_unit == "hours":
                        raise HTTPException(status_code=400, detail=f"Μπορείς να ξαναδοκιμάσεις σε {int(remaining.total_seconds() / 3600)} ώρες")
                    else:
                        raise HTTPException(status_code=400, detail=f"Μπορείς να ξαναδοκιμάσεις σε {remaining.days} ημέρες")
    
    # For weekly specific mode, check if today is one of the allowed days
    if frequency_type == "weekly" and weekly_mode == "specific" and frequency_days:
        today_weekday = now.weekday()  # 0=Monday, 6=Sunday
        # Convert to our format (0=Sunday, 1=Monday, etc.)
        today_weekday_adjusted = (today_weekday + 1) % 7
        if today_weekday_adjusted not in frequency_days:
            day_names = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο']
            allowed_days = [day_names[d] for d in frequency_days]
            raise HTTPException(
                status_code=400, 
                detail=f"Αυτή η συνήθεια είναι μόνο για: {', '.join(allowed_days)}"
            )
    
    # Determine initial status based on verification type
    verification_type = habit.get("verification_type", "self_reported")
    if verification_type in ["parent_verified", "parent_verified_optional"]:
        status = "pending"
        points_earned = 0
    else:
        status = "approved"
        points_earned = habit["points"]
    
    completion_id = f"comp_{uuid.uuid4().hex[:12]}"
    
    # Calculate completion number (approved + pending + 1)
    completion_number = approved_count + pending_count + 1
    
    completion_doc = {
        "completion_id": completion_id,
        "child_id": session["child_id"],
        "habit_id": habit.get("habit_id", habit_id),  # Use the actual habit ID
        "original_habit_id": original_habit_id,  # Keep track of original for queries
        "date": today,
        "status": status,
        "points_earned": points_earned,
        "completed_at": now,
        "completion_number": completion_number,  # Track which completion this is (1st, 2nd, etc.)
        "approved_at": now if status == "approved" else None,
        "approved_by": None
    }
    
    await db.habit_completions.insert_one(completion_doc)
    
    # Mark any active postpone for this habit as completed
    await db.habit_postpones.update_many(
        {
            "child_id": session["child_id"],
            "habit_id": {"$in": [habit_id, habit.get("habit_id", habit_id)]},
            "date": today,
            "completed": False
        },
        {"$set": {"completed": True, "completed_at": now}}
    )
    
    # Update child's last activity timestamp (for inactivity penalty tracking)
    await db.children.update_one(
        {"child_id": session["child_id"]},
        {"$set": {"last_activity": now}}
    )
    
    # If auto-approved, update child's points and check badges
    if status == "approved":
        try:
            await update_child_stats(session["child_id"], points_earned)
        except Exception as e:
            logger.error(f"Error updating child stats after task completion: {e}")
            # Don't fail the request - task is already saved
    
    return {
        "completion_id": completion_id,
        "status": status,
        "points_earned": points_earned,
        "completion_number": completion_number,
        "total_required": frequency_count,
        "approved_count": approved_count + (1 if status == "approved" else 0),
        "pending_count": pending_count + (1 if status == "pending" else 0),
        "remaining": frequency_count - (approved_count + (1 if status == "approved" else 0))
    }

class HelpRequest(BaseModel):
    habit_id: str
    message: Optional[str] = None

@api_router.post("/child/tasks/{habit_id}/help")
async def request_help(habit_id: str, request: Request):
    """Request help from parent for a habit"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    parent_id = session["parent_id"]
    
    # Get child info
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get habit info
    habit = None
    if habit_id.startswith("preset_"):
        idx = int(habit_id.replace("preset_", ""))
        if 0 <= idx < len(PRESET_HABITS):
            habit = {**PRESET_HABITS[idx], "habit_id": habit_id}
    else:
        habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Create help request
    help_id = f"help_{uuid.uuid4().hex[:12]}"
    
    help_doc = {
        "help_id": help_id,
        "child_id": child_id,
        "child_name": child["name"],
        "parent_id": parent_id,
        "habit_id": habit_id,
        "habit_name": habit["name_el"],
        "habit_description": habit.get("description_el", ""),
        "parent_tip": habit.get("parent_tip_el", ""),
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "resolved_at": None
    }
    
    await db.help_requests.insert_one(help_doc)
    
    # Mark any active postpone for this habit as completed (since child is taking action)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.habit_postpones.update_many(
        {
            "child_id": child_id,
            "habit_id": habit_id,
            "date": today,
            "completed": False
        },
        {"$set": {"completed": True, "completed_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"Help request created: {child['name']} needs help with {habit['name_el']}")
    
    # Send push notification to parent
    notification_title = f"🆘 {child['name']} χρειάζεται βοήθεια!"
    notification_body = f"Με τη συνήθεια: {habit['name_el']}"
    notification_data = {
        "type": "help_request",
        "help_id": help_id,
        "child_id": child_id,
        "habit_id": habit_id,
    }
    
    push_result = await send_push_notification(
        parent_id=parent_id,
        title=notification_title,
        body=notification_body,
        data=notification_data
    )
    logger.info(f"Push notification result: {push_result}")
    
    return {
        "help_id": help_id,
        "message": "Το αίτημα βοήθειας στάλθηκε στον γονέα σου!",
        "habit_name": habit["name_el"],
        "notification_sent": push_result.get("sent", 0) > 0
    }

# ==================== POSTPONE (DO LATER) FEATURE ====================

@api_router.post("/child/tasks/{habit_id}/postpone")
async def postpone_task(habit_id: str, request: Request):
    """Child postpones a task - triggers 30 min reminder"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    parent_id = session["parent_id"]
    
    # Get child info
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get habit info
    habit = None
    if habit_id.startswith("preset_"):
        idx = int(habit_id.replace("preset_", ""))
        if 0 <= idx < len(PRESET_HABITS):
            habit = {**PRESET_HABITS[idx], "habit_id": habit_id}
    else:
        habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    reminder_time = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    # Create or update postpone record
    postpone_id = f"postpone_{uuid.uuid4().hex[:12]}"
    
    postpone_doc = {
        "postpone_id": postpone_id,
        "child_id": child_id,
        "child_name": child["name"],
        "parent_id": parent_id,
        "habit_id": habit_id,
        "habit_name": habit["name_el"],
        "habit_emoji": habit.get("emoji", "⏰"),
        "date": today,
        "postponed_at": datetime.now(timezone.utc),
        "reminder_at": reminder_time,
        "reminder_sent": False,
        "completed": False
    }
    
    await db.habit_postpones.insert_one(postpone_doc)
    
    logger.info(f"Task postponed: {child['name']} will do '{habit['name_el']}' later (reminder at {reminder_time})")
    
    # Schedule notification for 30 mins later (stored in DB, cron job sends them)
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    gender = child.get("gender", "boy")
    hero_text = get_gendered_super_hero(gender)
    scheduled_notification = {
        "notification_id": notification_id,
        "child_id": child_id,
        "type": "postpone_reminder",
        "scheduled_at": reminder_time,
        "sent": False,
        "habit_id": habit_id,
        "habit_name": habit["name_el"],
        "habit_emoji": habit.get("emoji", "⏰"),
        "message_el": f"⏰ Ώρα να κάνεις: {habit['name_el']}! Πέρασαν 30 λεπτά, {hero_text}! 💪",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.scheduled_notifications.insert_one(scheduled_notification)
    
    return {
        "postpone_id": postpone_id,
        "message": "Θα σου θυμίσω σε 30 λεπτά! ⏰",
        "reminder_at": reminder_time.isoformat(),
        "habit_name": habit["name_el"]
    }

@api_router.get("/child/postponed-tasks")
async def get_postponed_tasks(request: Request):
    """Get tasks that child has postponed today"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    postponed = await db.habit_postpones.find({
        "child_id": child_id,
        "date": today,
        "completed": False
    }, {"_id": 0}).to_list(50)
    
    # Return as a set of habit_ids with their reminder times
    return {
        "postponed_habits": {
            p["habit_id"]: {
                "postponed_at": p["postponed_at"].isoformat() if hasattr(p["postponed_at"], 'isoformat') else p["postponed_at"],
                "reminder_at": p["reminder_at"].isoformat() if hasattr(p["reminder_at"], 'isoformat') else p["reminder_at"],
                "postpone_count": 1  # Will be aggregated below
            }
            for p in postponed
        },
        "total_postponed": len(postponed)
    }

@api_router.post("/process-scheduled-notifications")
async def process_scheduled_notifications():
    """Process due scheduled notifications (call this via cron job every 5 mins)"""
    now = datetime.now(timezone.utc)
    
    # Find notifications that are due
    due_notifications = await db.scheduled_notifications.find({
        "scheduled_at": {"$lte": now},
        "sent": False
    }).to_list(100)
    
    sent_count = 0
    
    for notif in due_notifications:
        child_id = notif["child_id"]
        
        # Create child notification
        child_notif = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "child_id": child_id,
            "type": notif.get("type", "reminder"),
            "message_el": notif.get("message_el", "Υπενθύμιση!"),
            "habit_id": notif.get("habit_id"),
            "is_read": False,
            "created_at": now
        }
        
        await db.child_notifications.insert_one(child_notif)
        
        # Mark as sent
        await db.scheduled_notifications.update_one(
            {"_id": notif["_id"]},
            {"$set": {"sent": True, "sent_at": now}}
        )
        
        sent_count += 1
        logger.info(f"Sent scheduled notification to child {child_id}: {notif.get('message_el', '')[:50]}")
    
    return {"processed": sent_count}

@api_router.get("/parent/help-requests")
async def get_help_requests(request: Request):
    """Get pending help requests for parent"""
    parent = await get_current_parent(request)
    
    requests = await db.help_requests.find(
        {"parent_id": parent.user_id, "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    return requests

@api_router.post("/parent/help-requests/{help_id}/resolve")
async def resolve_help_request(help_id: str, request: Request):
    """Mark a help request as declined/dismissed by parent"""
    parent = await get_current_parent(request)
    
    # Get help request first to get child_id and habit info
    help_request = await db.help_requests.find_one(
        {"help_id": help_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not help_request:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    result = await db.help_requests.update_one(
        {"help_id": help_id, "parent_id": parent.user_id},
        {
            "$set": {
                "status": "declined",
                "resolved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    # Get child's gender for gendered messages
    child = await db.children.find_one({"child_id": help_request["child_id"]}, {"_id": 0, "gender": 1})
    gender = child.get("gender", "boy") if child else "boy"
    
    # Create notification for child - help was declined
    habit_name = help_request.get("habit_name", "τη δραστηριότητα")
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    # Gender-aware text
    alone = get_gendered_adjective(gender, "μόνος", "μόνη")
    strong = get_gendered_adjective(gender, "δυνατός", "δυνατή")
    title_alone = get_gendered_adjective(gender, "μόνος", "μόνη")
    
    import random
    messages = [
        f"Ο γονέας σου πιστεύει ότι μπορείς να τα καταφέρεις {alone} σου με '{habit_name}'! 💪 Προσπάθησε ξανά!",
        f"Αυτή τη φορά δοκίμασε {alone} σου το '{habit_name}'! 🌟 Ο γονέας σου ξέρει ότι μπορείς!",
        f"Μην ανησυχείς! 🚀 Δοκίμασε το '{habit_name}' ξανά. Είσαι {strong}!",
    ]
    message = random.choice(messages)
    
    await db.child_notifications.insert_one({
        "notification_id": notification_id,
        "child_id": help_request["child_id"],
        "type": "help_declined",
        "title": f"Δοκίμασε {title_alone}! 💪",
        "message": message,
        "habit_name": habit_name,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True}

@api_router.post("/parent/help-requests/{help_id}/encourage-retry")
async def encourage_retry_help_request(help_id: str, request: Request):
    """Encourage child to retry on their own with a supportive message"""
    parent = await get_current_parent(request)
    
    # Get help request first to get child_id and habit info
    help_request = await db.help_requests.find_one(
        {"help_id": help_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not help_request:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    # Mark help request as "retry" status
    result = await db.help_requests.update_one(
        {"help_id": help_id, "parent_id": parent.user_id},
        {
            "$set": {
                "status": "retry_encouraged",
                "resolved_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    # Get child's gender for gendered messages
    child = await db.children.find_one({"child_id": help_request["child_id"]}, {"_id": 0, "gender": 1})
    gender = child.get("gender", "boy") if child else "boy"
    
    # Create encouraging notification for child
    habit_name = help_request.get("habit_name", "τη δραστηριότητα")
    child_name = help_request.get("child_name", "")
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    # Gender-aware messages
    hero = get_gendered_super_hero(gender)
    strong = get_gendered_adjective(gender, "δυνατός", "δυνατή")
    alone = get_gendered_adjective(gender, "μόνος", "μόνη")
    
    import random
    messages = [
        f"Ο γονέας σου πιστεύει σε σένα! 💪 Ξέρεις, μπορείς να τα καταφέρεις με το '{habit_name}'! Δοκίμασε ξανά!",
        f"Μην τα παρατάς! 🌟 Ο γονέας σου ξέρει ότι μπορείς να κάνεις το '{habit_name}' {alone} σου! Είσαι {strong}!",
        f"{hero}! 🦸 Δοκίμασε ξανά το '{habit_name}'! Ο γονέας σου πιστεύει ότι μπορείς!",
        f"Πάμε ξανά! 🚀 Ξέρεις τι; Ο γονέας σου πιστεύει ότι μπορείς να κάνεις το '{habit_name}'! Κάνε μια προσπάθεια!",
        f"Είσαι πιο {strong} απ' ό,τι νομίζεις! 💫 Δοκίμασε ξανά το '{habit_name}'! Ο γονέας σου σε εμπιστεύεται!",
    ]
    message = random.choice(messages)
    
    await db.child_notifications.insert_one({
        "notification_id": notification_id,
        "child_id": help_request["child_id"],
        "type": "encourage_retry",
        "title": "Πιστεύουμε σε σένα! 💪",
        "message": message,
        "habit_name": habit_name,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": "Το ενθαρρυντικό μήνυμα στάλθηκε!"}

@api_router.post("/parent/help-requests/{help_id}/complete")
async def complete_from_help_request(help_id: str, request: Request):
    """Complete a task on behalf of the child from a help request"""
    parent = await get_current_parent(request)
    
    # Get the help request
    help_request = await db.help_requests.find_one(
        {"help_id": help_id, "parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not help_request:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    child_id = help_request["child_id"]
    habit_id = help_request["habit_id"]
    
    # Get habit info
    habit = None
    if habit_id.startswith("preset_"):
        idx = int(habit_id.replace("preset_", ""))
        if 0 <= idx < len(PRESET_HABITS):
            habit = PRESET_HABITS[idx]
    else:
        habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Create completion record
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    completion_id = f"comp_{uuid.uuid4().hex[:12]}"
    points_earned = habit.get("points", 10)
    
    completion_doc = {
        "completion_id": completion_id,
        "child_id": child_id,
        "habit_id": habit_id,
        "date": today,
        "status": "approved",  # Auto-approved by parent
        "completed_at": datetime.now(timezone.utc),
        "approved_at": datetime.now(timezone.utc),
        "approved_by": parent.user_id,
        "points_earned": points_earned,
        "from_help_request": help_id,
        "note": "Ολοκληρώθηκε από γονέα"
    }
    
    await db.habit_completions.insert_one(completion_doc)
    
    # Update child stats
    await update_child_stats(child_id, points_earned)
    
    # Mark help request as completed
    await db.help_requests.update_one(
        {"help_id": help_id},
        {
            "$set": {
                "status": "completed",
                "resolved_at": datetime.now(timezone.utc),
                "completed_by_parent": True
            }
        }
    )
    
    # Create notification for child - parent helped complete the task
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    habit_name = habit.get("name_el", "τη δραστηριότητα")
    
    await db.child_notifications.insert_one({
        "notification_id": notification_id,
        "child_id": child_id,
        "type": "help_completed",
        "title": "Ο γονέας βοήθησε! 🤝",
        "message": f"Ο γονέας σου σε βοήθησε να ολοκληρώσεις '{habit_name}'! Κέρδισες {points_earned} πόντους! 🌟",
        "habit_name": habit_name,
        "points": points_earned,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Get child name for response
    child = await db.children.find_one({"child_id": child_id}, {"name": 1, "_id": 0})
    
    return {
        "success": True,
        "completion_id": completion_id,
        "points_earned": points_earned,
        "message": f"Η εργασία ολοκληρώθηκε για {child['name'] if child else 'το παιδί'}!"
    }

async def update_child_stats(child_id: str, points: int):
    """Update child's points, streak, and check for new badges"""
    logger.info(f"update_child_stats called for child {child_id} with {points} points")
    
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    
    if not child:
        logger.warning(f"Child {child_id} not found in update_child_stats")
        return
    
    logger.info(f"Child found: {child.get('name')}, current badges: {child.get('badges', [])}")
    
    new_total = child["total_points"] + points
    
    # Calculate streak
    today = datetime.now(timezone.utc).date()
    yesterday = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    
    yesterday_completion = await db.habit_completions.find_one({
        "child_id": child_id,
        "date": yesterday,
        "status": "approved"
    })
    
    if yesterday_completion:
        new_streak = child["current_streak"] + 1
    else:
        # Check if there's any completion today already
        today_str = today.strftime("%Y-%m-%d")
        today_completions = await db.habit_completions.count_documents({
            "child_id": child_id,
            "date": today_str,
            "status": "approved"
        })
        
        if today_completions > 1:
            new_streak = child["current_streak"]
        else:
            new_streak = 1
    
    longest_streak = max(child["longest_streak"], new_streak)
    
    # Calculate avatar level
    avatar_level = 1
    for level in AVATAR_LEVELS:
        if new_total >= level["points_required"]:
            avatar_level = level["level"]
    
    # Check for new badges
    current_badges = set(child.get("badges", []))
    logger.info(f"Starting badge check. Current badges: {current_badges}")
    
    for badge in BADGES:
        if badge["badge_id"] in current_badges:
            continue
        
        try:
            if badge["requirement_type"] == "tasks_completed":
                total_completions = await db.habit_completions.count_documents({
                    "child_id": child_id,
                    "status": "approved"
                })
                logger.info(f"Badge {badge['badge_id']}: total_completions={total_completions}, required={badge['requirement_value']}")
                if total_completions >= badge["requirement_value"]:
                    current_badges.add(badge["badge_id"])
                    logger.info(f"Badge {badge['badge_id']} awarded!")
            
            elif badge["requirement_type"] == "streak":
                if new_streak >= badge["requirement_value"]:
                    current_badges.add(badge["badge_id"])
            
            elif badge["requirement_type"] == "total_points":
                if new_total >= badge["requirement_value"]:
                    current_badges.add(badge["badge_id"])
            
            elif badge["requirement_type"] == "no_help_days":
                # Check if child completed ALL their daily tasks for X consecutive days without asking for help
                required_days = badge["requirement_value"]
                now = datetime.now(timezone.utc)
                
                # For 1-day badge, check yesterday (completed day)
                # For multi-day badges, check the last X completed days
                consecutive_clean_days = 0
                
                for day_offset in range(1, required_days + 30):  # Check up to 30 days back
                    check_date = (now - timedelta(days=day_offset)).date()
                    day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc)
                    day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc)
                    
                    # Get completions for this day
                    day_completions = await db.habit_completions.count_documents({
                        "child_id": child_id,
                        "status": "approved",
                        "completed_at": {"$gte": day_start, "$lte": day_end}
                    })
                    
                    # Skip days with no completions (not active that day)
                    if day_completions == 0:
                        continue
                    
                    # Check for help requests on this day
                    help_count = await db.help_requests.count_documents({
                        "child_id": child_id,
                        "created_at": {"$gte": day_start, "$lte": day_end}
                    })
                    
                    help_completions = await db.habit_completions.count_documents({
                        "child_id": child_id,
                        "help_requested": True,
                        "completed_at": {"$gte": day_start, "$lte": day_end}
                    })
                    
                    if help_count == 0 and help_completions == 0:
                        # Clean day - completed tasks without asking for help
                        consecutive_clean_days += 1
                        if consecutive_clean_days >= required_days:
                            current_badges.add(badge["badge_id"])
                            break
                    else:
                        # Had help requests, reset counter
                        consecutive_clean_days = 0
            
            elif badge["requirement_type"] == "no_postpone_days":
                # Check if child completed tasks for X consecutive days without postponing
                required_days = badge["requirement_value"]
                now = datetime.now(timezone.utc)
                
                consecutive_clean_days = 0
                
                for day_offset in range(1, required_days + 30):  # Check up to 30 days back
                    check_date = (now - timedelta(days=day_offset)).date()
                    day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc)
                    day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc)
                    
                    # Get completions for this day
                    day_completions = await db.habit_completions.count_documents({
                        "child_id": child_id,
                        "status": "approved",
                        "completed_at": {"$gte": day_start, "$lte": day_end}
                    })
                    
                    # Skip days with no completions (not active that day)
                    if day_completions == 0:
                        continue
                    
                    # Check for postpones on this day
                    postpone_count = await db.habit_postpones.count_documents({
                        "child_id": child_id,
                        "postponed_at": {"$gte": day_start, "$lte": day_end}
                    })
                    
                    if postpone_count == 0:
                        # Clean day - completed tasks without postponing
                        consecutive_clean_days += 1
                        if consecutive_clean_days >= required_days:
                            current_badges.add(badge["badge_id"])
                            break
                    else:
                        # Had postpones, reset counter
                        consecutive_clean_days = 0
            
            elif badge["requirement_type"] == "points_spent":
                # Check total points spent on rewards
                redemptions = await db.reward_redemptions.find(
                    {"child_id": child_id}
                ).to_list(1000)
                
                total_spent = sum(r.get("points_spent", 0) for r in redemptions)
                
                if total_spent >= badge["requirement_value"]:
                    current_badges.add(badge["badge_id"])
        
        except Exception as badge_error:
            logger.error(f"Error checking badge {badge['badge_id']}: {badge_error}")
            continue
    
    logger.info(f"Final badges after check: {current_badges}")
    
    # Update child
    await db.children.update_one(
        {"child_id": child_id},
        {"$set": {
            "total_points": new_total,
            "current_streak": new_streak,
            "longest_streak": longest_streak,
            "avatar_level": avatar_level,
            "badges": list(current_badges)
        }}
    )

# ==================== PARENT APPROVAL ENDPOINTS ====================

@api_router.get("/parent/pending-approvals")
async def get_pending_approvals(request: Request):
    """Get all pending task approvals for parent"""
    parent = await get_current_parent(request)
    
    # Get all children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).to_list(100)
    
    child_map = {c["child_id"]: c["name"] for c in children}
    child_ids = list(child_map.keys())
    
    # Get pending completions
    pending = await db.habit_completions.find(
        {"child_id": {"$in": child_ids}, "status": "pending"},
        {"_id": 0}
    ).to_list(100)
    
    # Build response with habit names
    result = []
    for p in pending:
        habit = None
        if p["habit_id"].startswith("preset_"):
            idx = int(p["habit_id"].replace("preset_", ""))
            if 0 <= idx < len(PRESET_HABITS):
                habit = PRESET_HABITS[idx]
        else:
            habit = await db.habits.find_one({"habit_id": p["habit_id"]}, {"_id": 0})
        
        if habit:
            result.append({
                "completion_id": p["completion_id"],
                "child_id": p["child_id"],
                "child_name": child_map.get(p["child_id"], "Unknown"),
                "habit_id": p["habit_id"],
                "habit_name_el": habit["name_el"],
                "habit_name_en": habit["name_en"],
                "points": habit["points"],
                "date": p["date"],
                "completed_at": p["completed_at"]
            })
    
    return result

@api_router.get("/parent/approval-history")
async def get_approval_history(request: Request):
    """Get history of approved, rejected, and retry-encouraged tasks for parent's children"""
    parent = await get_current_parent(request)
    
    # Get parent's children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).to_list(100)
    
    child_map = {c["child_id"]: c["name"] for c in children}
    child_ids = list(child_map.keys())
    
    # Get all non-pending completions (approved, rejected, and retry_encouraged)
    history = await db.habit_completions.find(
        {
            "child_id": {"$in": child_ids}, 
            "status": {"$in": ["approved", "rejected", "retry_encouraged"]}
        },
        {"_id": 0}
    ).sort("completed_at", -1).to_list(100)
    
    # Build response with habit names
    result = []
    for h in history:
        habit = None
        habit_id = h.get("habit_id", "")
        
        if habit_id.startswith("preset_"):
            try:
                idx = int(habit_id.replace("preset_", ""))
                if 0 <= idx < len(PRESET_HABITS):
                    habit = PRESET_HABITS[idx]
            except:
                pass
        else:
            habit = await db.habits.find_one({"habit_id": habit_id}, {"_id": 0})
        
        if habit:
            result.append({
                "completion_id": h["completion_id"],
                "child_id": h["child_id"],
                "child_name": child_map.get(h["child_id"], "Unknown"),
                "habit_id": habit_id,
                "habit_name_el": habit["name_el"],
                "habit_emoji": habit.get("emoji", "📋"),
                "points": habit["points"],
                "points_earned": h.get("points_earned", 0),
                "status": h["status"],
                "date": h["date"],
                "completed_at": h["completed_at"],
                "approved_at": h.get("approved_at"),
                "rejected_at": h.get("rejected_at"),
            })
    
    return result

@api_router.get("/parent/redemption-history")
async def get_redemption_history(request: Request):
    """Get history of reward redemptions for parent's children"""
    parent = await get_current_parent(request)
    
    # Get parent's children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).to_list(100)
    
    child_map = {c["child_id"]: c["name"] for c in children}
    child_ids = list(child_map.keys())
    
    # Get all redemptions
    redemptions = await db.reward_redemptions.find(
        {"child_id": {"$in": child_ids}},
        {"_id": 0}
    ).sort("redeemed_at", -1).to_list(100)
    
    # Build response with reward details
    result = []
    for r in redemptions:
        reward = await db.rewards.find_one({"reward_id": r["reward_id"]}, {"_id": 0})
        
        # Check if fulfilled - either by 'fulfilled' boolean or 'status' == 'fulfilled'
        is_fulfilled = r.get("fulfilled", False) or r.get("status") == "fulfilled"
        
        result.append({
            "redemption_id": r["redemption_id"],
            "child_id": r["child_id"],
            "child_name": child_map.get(r["child_id"], "Unknown"),
            "reward_id": r["reward_id"],
            "reward_title": reward["name_el"] if reward else r.get("reward_title", "Unknown"),
            "reward_emoji": reward.get("emoji", "🎁") if reward else "🎁",
            "points_spent": r["points_spent"],
            "redeemed_at": r["redeemed_at"],
            "fulfilled": is_fulfilled,
            "fulfilled_at": r.get("fulfilled_at"),
        })
    
    return result

@api_router.post("/parent/approve/{completion_id}")
async def approve_task(completion_id: str, request: Request):
    """Approve a child's task completion"""
    parent = await get_current_parent(request)
    
    completion = await db.habit_completions.find_one(
        {"completion_id": completion_id},
        {"_id": 0}
    )
    
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": completion["child_id"], "parent_id": parent.user_id}
    )
    
    if not child:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get habit points
    habit = None
    if completion["habit_id"].startswith("preset_"):
        idx = int(completion["habit_id"].replace("preset_", ""))
        if 0 <= idx < len(PRESET_HABITS):
            habit = PRESET_HABITS[idx]
    else:
        habit = await db.habits.find_one({"habit_id": completion["habit_id"]}, {"_id": 0})
    
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Update completion
    await db.habit_completions.update_one(
        {"completion_id": completion_id},
        {"$set": {
            "status": "approved",
            "points_earned": habit["points"],
            "approved_at": datetime.now(timezone.utc),
            "approved_by": parent.user_id
        }}
    )
    
    # Update child stats
    await update_child_stats(completion["child_id"], habit["points"])
    
    # Create notification for child
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    await db.child_notifications.insert_one({
        "notification_id": notification_id,
        "child_id": completion["child_id"],
        "type": "task_approved",
        "title": "Μπράβο! 🌟",
        "message": f"Ο γονέας σου επιβεβαίωσε ότι έκανες: {habit['name_el']}! Κέρδισες {habit['points']} πόντους!",
        "habit_name": habit["name_el"],
        "points": habit["points"],
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True, "points_awarded": habit["points"]}

@api_router.post("/parent/reject/{completion_id}")
async def reject_task(completion_id: str, request: Request):
    """Reject a child's task completion"""
    parent = await get_current_parent(request)
    
    completion = await db.habit_completions.find_one(
        {"completion_id": completion_id},
        {"_id": 0}
    )
    
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": completion["child_id"], "parent_id": parent.user_id}
    )
    
    if not child:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get habit info for notification
    habit = None
    if completion["habit_id"].startswith("preset_"):
        idx = int(completion["habit_id"].replace("preset_", ""))
        if 0 <= idx < len(PRESET_HABITS):
            habit = PRESET_HABITS[idx]
    else:
        habit = await db.habits.find_one({"habit_id": completion["habit_id"]}, {"_id": 0})
    
    habit_name = habit["name_el"] if habit else "τη δραστηριότητα"
    
    # Update completion
    await db.habit_completions.update_one(
        {"completion_id": completion_id},
        {"$set": {
            "status": "rejected",
            "rejected_at": datetime.now(timezone.utc),
            "approved_by": parent.user_id
        }}
    )
    
    # Create encouraging notification for child
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    encouraging_messages = [
        f"Δεν πειράζει! 💪 Δοκίμασε ξανά: {habit_name}. Ξέρουμε ότι μπορείς!",
        f"Πάμε ξανά! 🌟 Η προσπάθεια για '{habit_name}' χρειάζεται άλλη μια δοκιμή. Είσαι σούπερ!",
        f"Συνέχισε την προσπάθεια! 🚀 Ο γονέας σου θέλει να δει ξανά: {habit_name}. Μπορείς!",
    ]
    import random
    message = random.choice(encouraging_messages)
    
    await db.child_notifications.insert_one({
        "notification_id": notification_id,
        "child_id": completion["child_id"],
        "type": "task_rejected",
        "title": "Δοκίμασε ξανά! 💪",
        "message": message,
        "habit_name": habit_name,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True}

@api_router.post("/parent/encourage-retry/{completion_id}")
async def encourage_retry_task(completion_id: str, request: Request):
    """Encourage child to retry a task with a supportive message"""
    parent = await get_current_parent(request)
    
    completion = await db.habit_completions.find_one(
        {"completion_id": completion_id},
        {"_id": 0}
    )
    
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": completion["child_id"], "parent_id": parent.user_id}
    )
    
    if not child:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get habit info for notification
    habit = None
    if completion["habit_id"].startswith("preset_"):
        idx = int(completion["habit_id"].replace("preset_", ""))
        if 0 <= idx < len(PRESET_HABITS):
            habit = PRESET_HABITS[idx]
    else:
        habit = await db.habits.find_one({"habit_id": completion["habit_id"]}, {"_id": 0})
    
    habit_name = habit["name_el"] if habit else "τη δραστηριότητα"
    
    # Get child's gender for gendered messages
    child = await db.children.find_one({"child_id": completion["child_id"]}, {"_id": 0, "gender": 1})
    gender = child.get("gender", "boy") if child else "boy"
    hero = get_gendered_hero(gender)
    
    # Update completion to allow retry (same as rejected but different message)
    await db.habit_completions.update_one(
        {"completion_id": completion_id},
        {"$set": {
            "status": "retry_encouraged",
            "rejected_at": datetime.now(timezone.utc),
            "approved_by": parent.user_id
        }}
    )
    
    # Create super encouraging notification for child
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    import random
    encouraging_messages = [
        f"Ο γονέας σου πιστεύει σε σένα! 💪 Ξέρει ότι μπορείς να κάνεις το '{habit_name}' ακόμα καλύτερα! Πάμε!",
        f"Σούπερ δύναμη! 🦸 Δοκίμασε ξανά το '{habit_name}'! Ο γονέας σου ξέρει ότι θα τα καταφέρεις!",
        f"Μην τα παρατάς! 🌟 Η προσπάθειά σου για '{habit_name}' είναι υπέροχη! Κάνε μια ακόμα δοκιμή!",
        f"Είσαι {hero}! 🏆 Ο γονέας σου σε εμπιστεύεται να κάνεις το '{habit_name}' τέλεια! Πάμε ξανά!",
    ]
    message = random.choice(encouraging_messages)
    
    await db.child_notifications.insert_one({
        "notification_id": notification_id,
        "child_id": completion["child_id"],
        "type": "encourage_retry",
        "title": "Πιστεύουμε σε σένα! 💪",
        "message": message,
        "habit_name": habit_name,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": "Το ενθαρρυντικό μήνυμα στάλθηκε!"}

# ==================== CHILD NOTIFICATIONS ENDPOINTS ====================

@api_router.get("/child/notifications")
async def get_child_notifications(request: Request):
    """Get all unread notifications for the current child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    # Get unread notifications (check both 'read' and 'is_read' for compatibility)
    notifications = await db.child_notifications.find(
        {"child_id": child_id, "$or": [{"read": False}, {"is_read": False}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return notifications

@api_router.get("/child/notifications/count")
async def get_child_notifications_count(request: Request):
    """Get count of unread notifications for the current child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    count = await db.child_notifications.count_documents(
        {"child_id": child_id, "$or": [{"read": False}, {"is_read": False}]}
    )
    
    return {"count": count}

@api_router.post("/child/notifications/read")
async def mark_notifications_read(request: Request):
    """Mark all notifications as read for the current child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    await db.child_notifications.update_many(
        {"child_id": child_id, "$or": [{"read": False}, {"is_read": False}]},
        {"$set": {"read": True, "is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return {"success": True}

@api_router.post("/child/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark a specific notification as read"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    await db.child_notifications.update_one(
        {"notification_id": notification_id, "child_id": child_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
    )
    
    return {"success": True}

@api_router.post("/child/claim-love-credits/{notification_id}")
async def claim_love_credits(notification_id: str, request: Request):
    """Claim love credits when child opens the notification"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    # Find the notification
    notification = await db.child_notifications.find_one({
        "notification_id": notification_id,
        "child_id": child_id,
        "type": "love_credits"
    })
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Check if already claimed
    if notification.get("credits_claimed", False):
        return {"success": True, "already_claimed": True, "points": 0}
    
    # Get the amount
    amount = notification.get("amount", 0) or notification.get("points", 0)
    
    if amount > 0:
        # Add points to child
        await db.children.update_one(
            {"child_id": child_id},
            {"$inc": {"total_points": amount}}
        )
        
        # Mark notification as claimed
        await db.child_notifications.update_one(
            {"notification_id": notification_id},
            {"$set": {"credits_claimed": True, "claimed_at": datetime.now(timezone.utc)}}
        )
        
        # Also mark the love_credits record as claimed
        await db.love_credits.update_one(
            {"child_id": child_id, "amount": amount, "claimed": False},
            {"$set": {"claimed": True, "claimed_at": datetime.now(timezone.utc)}}
        )
        
        logger.info(f"Love credits claimed: {child_id} received {amount} points")
    
    return {"success": True, "points_claimed": amount}

# ==================== BEHAVIOR STATS ENDPOINTS ====================

@api_router.get("/parent/behavior-stats")
async def get_behavior_stats(request: Request):
    """Get stats on children's 'later' clicks and help requests for pattern identification"""
    parent = await get_current_parent(request)
    
    # Get all children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"child_id": 1, "name": 1, "_id": 0}
    ).to_list(20)
    
    child_map = {c["child_id"]: c["name"] for c in children}
    
    # Get help requests from last 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    help_requests = await db.help_requests.find({
        "parent_id": parent.user_id,
        "created_at": {"$gte": week_ago}
    }, {"_id": 0}).to_list(100)
    
    # Get 'later' events (skipped habits) from last 7 days
    # We'll track this via habit_completions that weren't completed today
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Count help requests by child and habit
    help_by_child = {}
    help_by_habit = {}
    daily_help_counts = {}
    
    for req in help_requests:
        child_id = req.get("child_id")
        habit_name = req.get("habit_name", "Unknown")
        created = req.get("created_at")
        
        if child_id:
            help_by_child[child_id] = help_by_child.get(child_id, 0) + 1
        
        help_by_habit[habit_name] = help_by_habit.get(habit_name, 0) + 1
        
        if created:
            date_str = created.strftime("%Y-%m-%d") if hasattr(created, 'strftime') else str(created)[:10]
            daily_help_counts[date_str] = daily_help_counts.get(date_str, 0) + 1
    
    # Calculate if there's a spike (more than average)
    total_help_requests = len(help_requests)
    avg_daily = total_help_requests / 7 if total_help_requests > 0 else 0
    today_count = daily_help_counts.get(today, 0)
    has_spike = today_count > (avg_daily * 1.5) if avg_daily > 0 else today_count > 2
    
    # Get postpone stats from last 7 days
    postpones = await db.habit_postpones.find({
        "parent_id": parent.user_id,
        "postponed_at": {"$gte": week_ago}
    }, {"_id": 0}).to_list(200)
    
    # Count postpones by child and habit
    postpones_by_child = {}
    postpones_by_habit = {}
    total_postpones = len(postpones)
    
    for p in postpones:
        child_id = p.get("child_id")
        habit_name = p.get("habit_name", "Unknown")
        
        if child_id:
            postpones_by_child[child_id] = postpones_by_child.get(child_id, 0) + 1
        
        postpones_by_habit[habit_name] = postpones_by_habit.get(habit_name, 0) + 1
    
    # Build insights
    insights = []
    
    if total_postpones > 10:
        insights.append({
            "type": "high_postpones",
            "title": "Πολλές αναβολές",
            "description": f"Τα παιδιά σας είπαν «Αργότερα» {total_postpones} φορές αυτή την εβδομάδα.",
            "priority": "medium",
            "icon": "⏰"
        })
    
    # Find most postponed habit
    if postpones_by_habit:
        most_postponed = max(postpones_by_habit.items(), key=lambda x: x[1])
        if most_postponed[1] >= 3:
            insights.append({
                "type": "often_postponed_habit",
                "title": f"Συχνά αναβάλλεται: {most_postponed[0]}",
                "description": f"Αυτή η συνήθεια αναβλήθηκε {most_postponed[1]} φορές. Ίσως χρειάζεται αλλαγή ώρας ή απλοποίηση.",
                "priority": "medium",
                "icon": "⏳"
            })
    
    if total_help_requests > 5:
        insights.append({
            "type": "high_help_requests",
            "title": "Πολλά αιτήματα βοήθειας",
            "description": f"Τα παιδιά σας ζήτησαν βοήθεια {total_help_requests} φορές αυτή την εβδομάδα.",
            "priority": "medium"
        })
    
    # Find most difficult habit
    if help_by_habit:
        most_difficult = max(help_by_habit.items(), key=lambda x: x[1])
        if most_difficult[1] >= 3:
            insights.append({
                "type": "difficult_habit",
                "title": f"Δύσκολη συνήθεια: {most_difficult[0]}",
                "description": f"Τα παιδιά ζήτησαν βοήθεια {most_difficult[1]} φορές για αυτή τη συνήθεια.",
                "priority": "high"
            })
    
    # Find child needing most help
    if help_by_child:
        most_help_child_id = max(help_by_child.items(), key=lambda x: x[1])
        if most_help_child_id[1] >= 3:
            child_name = child_map.get(most_help_child_id[0], "Unknown")
            insights.append({
                "type": "child_needs_support",
                "title": f"{child_name} χρειάζεται υποστήριξη",
                "description": f"Ζήτησε βοήθεια {most_help_child_id[1]} φορές αυτή την εβδομάδα.",
                "priority": "high"
            })
    
    if has_spike:
        insights.append({
            "type": "spike_today",
            "title": "Αυξημένα αιτήματα σήμερα",
            "description": f"Σήμερα υπήρξαν {today_count} αιτήματα βοήθειας, περισσότερα από τον μέσο όρο.",
            "priority": "urgent"
        })
    
    return {
        "help_requests_total": total_help_requests,
        "help_requests_today": today_count,
        "help_by_child": {child_map.get(k, k): v for k, v in help_by_child.items()},
        "help_by_habit": help_by_habit,
        "daily_counts": daily_help_counts,
        "average_daily": round(avg_daily, 1),
        "has_spike": has_spike,
        # Postpone stats
        "postpones_total": total_postpones,
        "postpones_by_child": {child_map.get(k, k): v for k, v in postpones_by_child.items()},
        "postpones_by_habit": postpones_by_habit,
        "insights": insights
    }

# ==================== PROGRESS & ANALYTICS ENDPOINTS ====================

@api_router.get("/child/progress")
async def get_child_progress(request: Request):
    """Get current child's progress stats"""
    session = await get_current_child_session(request)
    
    child = await db.children.find_one(
        {"child_id": session["child_id"]},
        {"_id": 0, "pin_hash": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get weekly completions
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())
    
    weekly_completions = await db.habit_completions.find({
        "child_id": session["child_id"],
        "status": "approved",
        "date": {"$gte": week_start.strftime("%Y-%m-%d")}
    }).to_list(100)
    
    # Calculate weekly points
    weekly_points = sum(c["points_earned"] for c in weekly_completions)
    
    return {
        **child,
        "weekly_completions": len(weekly_completions),
        "weekly_points": weekly_points,
        "avatar_levels": AVATAR_LEVELS,
        "all_badges": BADGES
    }

@api_router.get("/parent/analytics/{child_id}")
async def get_parent_analytics(child_id: str, request: Request):
    """Get detailed analytics for a child"""
    parent = await get_current_parent(request)
    
    # Verify child belongs to parent
    child = await db.children.find_one(
        {"child_id": child_id, "parent_id": parent.user_id},
        {"_id": 0, "pin_hash": 0}
    )
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get completions for different time periods
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    
    # Daily completions (last 7 days)
    daily_stats = []
    for i in range(7):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        count = await db.habit_completions.count_documents({
            "child_id": child_id,
            "date": day_str,
            "status": "approved"
        })
        daily_stats.append({"date": day_str, "completions": count})
    
    # Weekly completions
    weekly_completions = await db.habit_completions.find({
        "child_id": child_id,
        "status": "approved",
        "date": {"$gte": week_start.strftime("%Y-%m-%d")}
    }).to_list(100)
    
    # Monthly completions
    monthly_completions = await db.habit_completions.find({
        "child_id": child_id,
        "status": "approved",
        "date": {"$gte": month_start.strftime("%Y-%m-%d")}
    }).to_list(500)
    
    # Habit completion rates
    habit_stats = {}
    all_completions = await db.habit_completions.find({
        "child_id": child_id,
        "status": "approved"
    }).to_list(1000)
    
    for comp in all_completions:
        habit_id = comp["habit_id"]
        if habit_id not in habit_stats:
            habit_stats[habit_id] = 0
        habit_stats[habit_id] += 1
    
    return {
        "child": child,
        "daily_stats": daily_stats,
        "weekly_completions": len(weekly_completions),
        "weekly_points": sum(c["points_earned"] for c in weekly_completions),
        "monthly_completions": len(monthly_completions),
        "monthly_points": sum(c["points_earned"] for c in monthly_completions),
        "habit_completion_counts": habit_stats,
        "avatar_levels": AVATAR_LEVELS
    }

# ==================== COMPREHENSIVE ANALYTICS ====================

# Parent Suggestions Engine - Rule-based
PARENT_SUGGESTIONS = {
    "too_many_help_requests": {
        "condition": lambda stats: stats.get("help_request_rate", 0) > 0.4,
        "title": "🤝 Συχνά αιτήματα βοήθειας",
        "message": "Το παιδί ζητάει βοήθεια πολύ συχνά στη συνήθεια '{habit_name}'. Δοκιμάστε να κάνετε τη δραστηριότητα πιο διασκεδαστική με μουσική, παιχνίδια ή μικρά βραβεία!",
        "category": "engagement"
    },
    "high_postpone_rate": {
        "condition": lambda stats: stats.get("postpone_rate", 0) > 0.5,
        "title": "⏰ Αναβολές συνήθειας",
        "message": "Η συνήθεια '{habit_name}' αναβάλλεται συχνά. Ίσως η ώρα δεν είναι η κατάλληλη; Δοκιμάστε να την εντάξετε σε διαφορετικό σημείο της ημέρας.",
        "category": "timing"
    },
    "excellent_streak": {
        "condition": lambda stats: stats.get("streak", 0) >= 7,
        "title": "🌟 Εξαιρετική συνέπεια!",
        "message": "Το παιδί έχει {streak} μέρες συνεχόμενης επιτυχίας στη συνήθεια '{habit_name}'! Αυτό αξίζει ιδιαίτερη αναγνώριση.",
        "category": "celebration"
    },
    "declining_performance": {
        "condition": lambda stats: stats.get("trend", 0) < -0.3,
        "title": "📉 Πτωτική τάση",
        "message": "Παρατηρείται μείωση στην ολοκλήρωση της συνήθειας '{habit_name}'. Μια συζήτηση με το παιδί μπορεί να αποκαλύψει τι το δυσκολεύει.",
        "category": "attention"
    },
    "improving_performance": {
        "condition": lambda stats: stats.get("trend", 0) > 0.3,
        "title": "📈 Βελτίωση!",
        "message": "Η συνήθεια '{habit_name}' δείχνει σημάδια βελτίωσης! Συνεχίστε την ενθάρρυνση.",
        "category": "celebration"
    },
    "no_activity_habit": {
        "condition": lambda stats: stats.get("completion_rate", 0) < 0.1 and stats.get("total_assigned", 0) > 5,
        "title": "😴 Αδρανής συνήθεια",
        "message": "Η συνήθεια '{habit_name}' σπάνια ολοκληρώνεται. Ίσως να μην είναι κατάλληλη για την ηλικία του παιδιού ή να χρειάζεται αναπροσαρμογή.",
        "category": "attention"
    },
    "strong_habit": {
        "condition": lambda stats: stats.get("completion_rate", 0) > 0.85,
        "title": "💪 Δυνατή συνήθεια",
        "message": "Η συνήθεια '{habit_name}' έχει γίνει ρουτίνα! Το παιδί την ολοκληρώνει με συνέπεια. Μπράβο!",
        "category": "strength"
    },
    "needs_encouragement": {
        "condition": lambda stats: 0.3 < stats.get("completion_rate", 0) < 0.5,
        "title": "💬 Χρειάζεται ενθάρρυνση",
        "message": "Η συνήθεια '{habit_name}' χρειάζεται λίγη ώθηση. Δοκιμάστε να επιβραβεύετε την προσπάθεια, όχι μόνο το αποτέλεσμα.",
        "category": "encouragement"
    }
}

@api_router.get("/parent/comprehensive-analytics")
async def get_comprehensive_analytics(
    request: Request,
    child_ids: str = Query(..., description="Comma-separated child IDs"),
    days: int = Query(30, description="Number of days to analyze")
):
    """Get comprehensive analytics with charts data and parent suggestions"""
    parent = await get_current_parent(request)
    
    # Parse child IDs
    child_id_list = [cid.strip() for cid in child_ids.split(",") if cid.strip()]
    
    if not child_id_list:
        raise HTTPException(status_code=400, detail="Please select at least one child")
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    start_date_str = start_date.strftime("%Y-%m-%d")
    
    # Collect data for each child
    children_analytics = []
    all_suggestions = []
    comparison_data = {"completion_rates": [], "total_points": [], "streaks": []}
    
    for child_id in child_id_list:
        # Verify child belongs to parent
        child = await db.children.find_one(
            {"child_id": child_id, "parent_id": parent.user_id},
            {"_id": 0, "pin_hash": 0}
        )
        
        if not child:
            continue
        
        # ===== COMPLETIONS DATA =====
        completions = await db.habit_completions.find({
            "child_id": child_id,
            "date": {"$gte": start_date_str}
        }).to_list(5000)
        
        approved_completions = [c for c in completions if c.get("status") == "approved"]
        pending_completions = [c for c in completions if c.get("status") == "pending"]
        
        # ===== HELP REQUESTS DATA =====
        help_requests = await db.help_requests.find({
            "child_id": child_id,
            "created_at": {"$gte": start_date}
        }).to_list(1000)
        
        resolved_help = [h for h in help_requests if h.get("status") == "resolved"]
        
        # ===== POSTPONED TASKS DATA =====
        postponed_tasks = await db.habit_postpones.find({
            "child_id": child_id,
            "postponed_at": {"$gte": start_date}
        }).to_list(1000)
        
        # ===== LOVE CREDITS DATA =====
        love_credits_received = await db.love_credits.find({
            "child_id": child_id,
            "created_at": {"$gte": start_date}
        }).to_list(500)
        
        total_love_credits = sum(lc.get("amount", 0) for lc in love_credits_received)
        
        # ===== POINTS CALCULATION =====
        # Points are calculated directly from habit_completions since there's no points_history
        points_earned = sum(c.get("points_earned", 0) for c in approved_completions)
        points_deducted = 0  # Deductions would come from inactivity penalties if any
        
        # ===== DAILY TREND DATA (for line chart) =====
        daily_data = []
        for i in range(min(days, 30)):  # Max 30 days for chart
            day = (end_date - timedelta(days=i)).strftime("%Y-%m-%d")
            day_completions = len([c for c in approved_completions if c.get("date") == day])
            day_points = sum(c.get("points_earned", 0) for c in approved_completions if c.get("date") == day)
            day_help = len([h for h in help_requests if h.get("created_at", datetime.min).strftime("%Y-%m-%d") == day])
            day_postponed = len([p for p in postponed_tasks if p.get("postponed_at", datetime.min).strftime("%Y-%m-%d") == day])
            
            daily_data.append({
                "date": day,
                "completions": day_completions,
                "points": day_points,
                "help_requests": day_help,
                "postponed": day_postponed
            })
        
        daily_data.reverse()  # Oldest first for chart
        
        # ===== HABIT-SPECIFIC STATS (for pie chart & suggestions) =====
        # Build habit stats from actual completions data
        habit_stats = {}
        
        # Get unique habit IDs from completions
        unique_habit_ids = set(c.get("habit_id") for c in completions if c.get("habit_id"))
        
        # Load preset habits for name lookup - create map with preset_X format
        preset_habits_map = {}
        preset_category_map = {}
        for idx, preset in enumerate(PRESET_HABITS):
            preset_id = f"preset_{idx}"
            preset_habits_map[preset_id] = preset.get("name_el", "Συνήθεια")
            preset_category_map[preset_id] = preset.get("category", "general")
        
        # Load custom habits from DB
        custom_habits = await db.habits.find({}).to_list(100)
        custom_habits_map = {h["habit_id"]: h.get("name_el", h.get("name", "Custom")) for h in custom_habits}
        
        for habit_id in unique_habit_ids:
            # Get habit name from presets or custom habits
            if habit_id.startswith("preset_"):
                habit_name = preset_habits_map.get(habit_id, "Συνήθεια")
            else:
                habit_name = custom_habits_map.get(habit_id, "Custom συνήθεια")
            
            # Get habit completions
            habit_completions = [c for c in approved_completions if c.get("habit_id") == habit_id]
            habit_help_requests = [h for h in help_requests if h.get("habit_id") == habit_id]
            habit_postponed = [p for p in postponed_tasks if p.get("habit_id") == habit_id]
            
            # Calculate rates
            total_days = days
            completion_rate = len(habit_completions) / total_days if total_days > 0 else 0
            help_request_rate = len(habit_help_requests) / max(len(habit_completions), 1)
            postpone_rate = len(habit_postponed) / max(len(habit_completions) + len(habit_postponed), 1)
            
            # Calculate trend (last 7 days vs previous 7 days)
            recent_completions = len([c for c in habit_completions if c.get("date", "") >= (end_date - timedelta(days=7)).strftime("%Y-%m-%d")])
            older_completions = len([c for c in habit_completions if (end_date - timedelta(days=14)).strftime("%Y-%m-%d") <= c.get("date", "") < (end_date - timedelta(days=7)).strftime("%Y-%m-%d")])
            trend = (recent_completions - older_completions) / max(older_completions, 1) if days >= 14 else 0
            
            habit_stats[habit_id] = {
                "habit_id": habit_id,
                "name": habit_name,
                "total_completions": len(habit_completions),
                "completion_rate": round(completion_rate, 2),
                "help_requests": len(habit_help_requests),
                "help_request_rate": round(help_request_rate, 2),
                "postponed_count": len(habit_postponed),
                "postpone_rate": round(postpone_rate, 2),
                "trend": round(trend, 2),
                "streak": 0,  # Streak would need to be calculated separately
                "total_assigned": total_days,
                "points_earned": sum(c.get("points_earned", 0) for c in habit_completions)
            }
            
            # Generate suggestions for this habit
            stats_for_check = {
                "completion_rate": completion_rate,
                "help_request_rate": help_request_rate,
                "postpone_rate": postpone_rate,
                "trend": trend,
                "streak": 0,  # Streak is tracked at child level, not per-habit
                "total_assigned": total_days
            }
            
            for suggestion_key, suggestion_data in PARENT_SUGGESTIONS.items():
                try:
                    if suggestion_data["condition"](stats_for_check):
                        all_suggestions.append({
                            "child_id": child_id,
                            "child_name": child.get("name", "Παιδί"),
                            "habit_id": habit_id,
                            "habit_name": habit_name,
                            "suggestion_key": suggestion_key,
                            "title": suggestion_data["title"],
                            "message": suggestion_data["message"].format(
                                habit_name=habit_name,
                                streak=child.get("streak", 0)
                            ),
                            "category": suggestion_data["category"]
                        })
                except Exception as e:
                    logger.error(f"Error checking suggestion {suggestion_key}: {e}")
        
        # ===== CATEGORY BREAKDOWN (for pie chart) =====
        category_stats = {}
        # Note: preset_category_map is already built above at the habits section
        
        for habit_id, stats in habit_stats.items():
            # Get category from presets or default to general
            if habit_id.startswith("preset_"):
                category = preset_category_map.get(habit_id, "general")
            else:
                # Try to get from custom habits collection
                custom_habit = await db.habits.find_one({"habit_id": habit_id})
                category = custom_habit.get("category", "general") if custom_habit else "general"
            
            if category not in category_stats:
                category_stats[category] = {"completions": 0, "points": 0}
            category_stats[category]["completions"] += stats["total_completions"]
            category_stats[category]["points"] += stats["points_earned"]
        
        # ===== STRENGTHS & WEAKNESSES =====
        sorted_habits = sorted(habit_stats.values(), key=lambda x: x["completion_rate"], reverse=True)
        strengths = sorted_habits[:3] if len(sorted_habits) >= 3 else sorted_habits
        weaknesses = sorted_habits[-3:] if len(sorted_habits) >= 3 else []
        weaknesses = [h for h in weaknesses if h["completion_rate"] < 0.5]  # Only show if actually weak
        
        # ===== SUMMARY STATS =====
        total_completions = len(approved_completions)
        avg_daily_completions = total_completions / days if days > 0 else 0
        
        # Get spent points from redemptions
        redemptions = await db.reward_redemptions.find({
            "child_id": child_id,
            "redeemed_at": {"$gte": start_date}
        }).to_list(500)
        points_spent = sum(r.get("points_spent", 0) for r in redemptions)
        
        # Calculate all-time totals for context
        all_completions = await db.habit_completions.find({
            "child_id": child_id,
            "status": "approved"
        }).to_list(10000)
        all_time_points_earned = sum(c.get("points_earned", 0) for c in all_completions)
        
        all_love = await db.love_credits.find({"child_id": child_id}).to_list(10000)
        all_time_love_credits = sum(lc.get("amount", 0) for lc in all_love)
        
        all_redemptions = await db.reward_redemptions.find({"child_id": child_id}).to_list(10000)
        all_time_spent = sum(r.get("points_spent", 0) for r in all_redemptions)
        
        child_analytics = {
            "child_id": child_id,
            "child_name": child.get("name", "Παιδί"),
            "child_avatar": child.get("avatar", "hero1"),
            "child_gender": child.get("gender", "boy"),
            
            # Summary stats (period)
            "summary": {
                "total_completions": total_completions,
                "avg_daily_completions": round(avg_daily_completions, 1),
                "total_points_earned": points_earned,
                "points_spent_period": points_spent,
                "total_help_requests": len(help_requests),
                "resolved_help_requests": len(resolved_help),
                "total_postponed": len(postponed_tasks),
                "love_credits_received": total_love_credits,
                "current_streak": child.get("streak", 0),
                "total_points": child.get("total_points", 0),
                "badges_count": len(child.get("badges", []))
            },
            
            # All-time breakdown
            "all_time": {
                "points_from_habits": all_time_points_earned,
                "love_credits_received": all_time_love_credits,
                "total_earned": all_time_points_earned + all_time_love_credits,
                "points_spent": all_time_spent,
                "current_balance": child.get("total_points", 0)
            },
            
            # Chart data
            "daily_trend": daily_data,
            "habit_breakdown": list(habit_stats.values()),
            "category_breakdown": [
                {"category": cat, "completions": data["completions"], "points": data["points"]}
                for cat, data in category_stats.items()
            ],
            
            # Behavioral analysis
            "strengths": strengths,
            "weaknesses": weaknesses,
            
            # For comparison
            "comparison_metrics": {
                "completion_rate": total_completions / (days * len(habit_stats)) if habit_stats else 0,
                "total_points": child.get("total_points", 0),
                "streak": child.get("streak", 0)
            }
        }
        
        children_analytics.append(child_analytics)
        
        # Add to comparison data
        comparison_data["completion_rates"].append({
            "name": child.get("name", "Παιδί"),
            "value": child_analytics["comparison_metrics"]["completion_rate"]
        })
        comparison_data["total_points"].append({
            "name": child.get("name", "Παιδί"),
            "value": child.get("total_points", 0)
        })
        comparison_data["streaks"].append({
            "name": child.get("name", "Παιδί"),
            "value": child.get("streak", 0)
        })
    
    # Sort suggestions by category priority
    category_priority = {"attention": 0, "encouragement": 1, "engagement": 2, "timing": 3, "celebration": 4, "strength": 5}
    all_suggestions.sort(key=lambda x: category_priority.get(x["category"], 99))
    
    return {
        "period": {
            "days": days,
            "start_date": start_date_str,
            "end_date": end_date.strftime("%Y-%m-%d")
        },
        "children": children_analytics,
        "suggestions": all_suggestions[:10],  # Top 10 suggestions
        "comparison": comparison_data if len(child_id_list) > 1 else None
    }

# ==================== LOVE CREDITS FEATURE ====================

class LoveCreditsRequest(BaseModel):
    child_ids: List[str]
    amount: int
    icon: str = "heart"  # heart, gift, kiss
    message: str = "γιατί... σε αγαπώ!"

@api_router.post("/parent/send-love-credits")
async def send_love_credits(request: Request, love_data: LoveCreditsRequest):
    """Send love credits to children as a gift"""
    parent = await get_current_parent(request)
    
    if love_data.amount < 1 or love_data.amount > 100:
        raise HTTPException(status_code=400, detail="Credits must be between 1-100")
    
    if not love_data.child_ids:
        raise HTTPException(status_code=400, detail="Please select at least one child")
    
    # Validate icon
    valid_icons = ["heart", "gift", "kiss"]
    if love_data.icon not in valid_icons:
        love_data.icon = "heart"
    
    icon_emojis = {"heart": "💝", "gift": "🎁", "kiss": "💋"}
    icon_emoji = icon_emojis.get(love_data.icon, "💝")
    
    results = []
    
    for child_id in love_data.child_ids:
        # Verify child belongs to parent
        child = await db.children.find_one(
            {"child_id": child_id, "parent_id": parent.user_id},
            {"_id": 0}
        )
        
        if not child:
            continue
        
        # Add points immediately when parent sends them
        await db.children.update_one(
            {"child_id": child_id},
            {"$inc": {"total_points": love_data.amount}}
        )
        
        # Check for point-based badges after adding love credits
        updated_child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
        if updated_child:
            new_total = updated_child.get("total_points", 0)
            current_badges = set(updated_child.get("badges", []))
            badges_to_check = ["points_100", "points_500", "points_1000"]
            
            for badge in BADGES:
                if badge["badge_id"] in badges_to_check and badge["badge_id"] not in current_badges:
                    if badge["requirement_type"] == "total_points" and new_total >= badge["requirement_value"]:
                        current_badges.add(badge["badge_id"])
                        logger.info(f"Badge {badge['badge_id']} awarded to {child_id} via love credits! Total points: {new_total}")
            
            # Update badges if any were added
            if current_badges != set(updated_child.get("badges", [])):
                await db.children.update_one(
                    {"child_id": child_id},
                    {"$set": {"badges": list(current_badges)}}
                )
        
        # Create love credit record
        love_id = f"love_{uuid.uuid4().hex[:12]}"
        love_record = {
            "love_id": love_id,
            "parent_id": parent.user_id,
            "child_id": child_id,
            "child_name": child["name"],
            "amount": love_data.amount,
            "icon": love_data.icon,
            "icon_emoji": icon_emoji,
            "message": love_data.message,
            "claimed": True,  # Already added
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.love_credits.insert_one(love_record)
        
        # Create notification for child
        notif_id = f"notif_{uuid.uuid4().hex[:12]}"
        notification = {
            "notification_id": notif_id,
            "child_id": child_id,
            "type": "love_credits",
            "title": f"{icon_emoji} Πόντοι Αγάπης!",
            "message": love_data.message if love_data.message else f"Ο γονιός σου σου έστειλε {love_data.amount} πόντους αγάπης!",
            "message_el": f"{icon_emoji} Έλαβες {love_data.amount} πόντους αγάπης!",
            "full_message": love_data.message,
            "amount": love_data.amount,
            "points": love_data.amount,  # For display in notification
            "icon": love_data.icon,
            "icon_emoji": icon_emoji,
            "is_read": False,
            "read": False,
            "credits_claimed": True,  # Already added
            "is_special": True,  # Mark as special for animation
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.child_notifications.insert_one(notification)
        
        # Don't add points yet - they'll be added when child opens the notification
        # Points will be claimed via a separate endpoint
        
        results.append({
            "child_id": child_id,
            "child_name": child["name"],
            "amount": love_data.amount,
            "success": True
        })
        
        logger.info(f"Love credits sent: {parent.user_id} -> {child['name']}: {love_data.amount} points")
    
    # Update parent's last love credits sent date
    await db.parent_love_stats.update_one(
        {"parent_id": parent.user_id},
        {
            "$set": {
                "last_sent": datetime.now(timezone.utc),
                "parent_id": parent.user_id
            },
            "$inc": {"total_sent": len(results)}
        },
        upsert=True
    )
    
    return {
        "success": True,
        "sent_to": results,
        "total_children": len(results),
        "total_credits": love_data.amount * len(results)
    }

@api_router.get("/parent/love-credits-history")
async def get_love_credits_history(request: Request):
    """Get history of love credits sent by parent"""
    parent = await get_current_parent(request)
    
    history = await db.love_credits.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return history

@api_router.get("/child/love-credits-history")
async def get_child_love_credits_history(request: Request):
    """Get history of love credits received by child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    history = await db.love_credits.find(
        {"child_id": child_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return history

@api_router.get("/child/love-credits-stats")
async def get_child_love_credits_stats(request: Request):
    """Get stats of love credits received by child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    # Get all love credits for this child
    credits = await db.love_credits.find(
        {"child_id": child_id}
    ).to_list(1000)
    
    total_points = sum(c.get("amount", 0) for c in credits)
    total_count = len(credits)
    
    return {
        "total_points": total_points,
        "total_count": total_count
    }

@api_router.get("/parent/love-credits-reminder")
async def check_love_credits_reminder(request: Request):
    """Check if parent should be reminded to send love credits"""
    parent = await get_current_parent(request)
    
    stats = await db.parent_love_stats.find_one(
        {"parent_id": parent.user_id},
        {"_id": 0}
    )
    
    if not stats or "last_sent" not in stats:
        # Never sent love credits
        return {
            "should_remind": True,
            "days_since_last": None,
            "message": "Στείλτε πόντους αγάπης στα παιδιά σας! 💝"
        }
    
    last_sent = stats["last_sent"]
    if isinstance(last_sent, str):
        last_sent = datetime.fromisoformat(last_sent.replace("Z", "+00:00"))
    
    # Ensure both datetimes are timezone-aware
    now = datetime.now(timezone.utc)
    if last_sent.tzinfo is None:
        last_sent = last_sent.replace(tzinfo=timezone.utc)
    
    days_since = (now - last_sent).days
    
    if days_since >= 7:
        return {
            "should_remind": True,
            "days_since_last": days_since,
            "message": f"Πέρασαν {days_since} μέρες! Στείλτε λίγη αγάπη στα παιδιά σας! 💝"
        }
    
    return {
        "should_remind": False,
        "days_since_last": days_since,
        "message": None
    }

# ==================== CUSTOM CATEGORIES ENDPOINTS ====================

# Default categories (preset)
DEFAULT_CATEGORIES = [
    {"id": "hygiene", "name_el": "Υγιεινή", "color": "#4A90E2", "emoji": "🧼", "is_preset": True},
    {"id": "organization", "name_el": "Οργάνωση", "color": "#9B59B6", "emoji": "📁", "is_preset": True},
    {"id": "education", "name_el": "Εκπαίδευση", "color": "#3498DB", "emoji": "📚", "is_preset": True},
    {"id": "creativity", "name_el": "Δημιουργικότητα", "color": "#E91E63", "emoji": "🎨", "is_preset": True},
    {"id": "health", "name_el": "Υγεία", "color": "#7ED321", "emoji": "💪", "is_preset": True},
    {"id": "social", "name_el": "Κοινωνικά", "color": "#F5A623", "emoji": "🤝", "is_preset": True},
    {"id": "environment", "name_el": "Περιβάλλον", "color": "#27AE60", "emoji": "🌱", "is_preset": True},
    {"id": "responsibility", "name_el": "Ευθύνη", "color": "#E67E22", "emoji": "⭐", "is_preset": True},
    {"id": "routine", "name_el": "Ρουτίνα", "color": "#9B59B6", "emoji": "⏰", "is_preset": True},
    {"id": "general", "name_el": "Γενικά", "color": "#95A5A6", "emoji": "📋", "is_preset": True},
]

@api_router.get("/categories")
async def get_all_categories(request: Request):
    """Get all categories (preset + custom) for the current parent"""
    parent = await get_current_parent(request)
    
    # Get custom categories created by this parent
    custom_categories = await db.custom_categories.find(
        {"parent_id": parent.user_id},
        {"_id": 0}
    ).to_list(50)
    
    # Combine preset + custom
    all_categories = DEFAULT_CATEGORIES.copy()
    all_categories.extend(custom_categories)
    
    return all_categories

@api_router.post("/categories")
async def create_custom_category(category_data: CategoryCreate, request: Request):
    """Create a custom category"""
    parent = await get_current_parent(request)
    
    # Generate category ID from name
    category_id = f"custom_{uuid.uuid4().hex[:8]}"
    
    category_doc = {
        "id": category_id,
        "parent_id": parent.user_id,
        "name_el": category_data.name_el,
        "color": category_data.color,
        "emoji": category_data.emoji,
        "is_preset": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.custom_categories.insert_one(category_doc)
    category_doc.pop("_id", None)
    
    return category_doc

@api_router.put("/categories/{category_id}")
async def update_custom_category(category_id: str, category_data: CategoryUpdate, request: Request):
    """Update a custom category"""
    parent = await get_current_parent(request)
    
    # Can't update preset categories
    if not category_id.startswith("custom_"):
        raise HTTPException(status_code=400, detail="Cannot modify preset categories")
    
    update_fields = {k: v for k, v in category_data.dict().items() if v is not None}
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.custom_categories.update_one(
        {"id": category_id, "parent_id": parent.user_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated = await db.custom_categories.find_one(
        {"id": category_id},
        {"_id": 0}
    )
    
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_custom_category(category_id: str, request: Request):
    """Delete a custom category"""
    parent = await get_current_parent(request)
    
    # Can't delete preset categories
    if not category_id.startswith("custom_"):
        raise HTTPException(status_code=400, detail="Cannot delete preset categories")
    
    result = await db.custom_categories.delete_one({
        "id": category_id,
        "parent_id": parent.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"success": True}

# ==================== HABIT-CHILD ASSIGNMENT ENDPOINTS ====================

@api_router.get("/habits/{habit_id}/children")
async def get_habit_child_assignments(habit_id: str, request: Request):
    """Get which children have this habit assigned"""
    parent = await get_current_parent(request)
    
    # Get all children
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"_id": 0, "child_id": 1, "name": 1, "avatar_id": 1}
    ).to_list(20)
    
    # For each child, check if habit is assigned
    result = []
    for child in children:
        assignment = await db.child_habits.find_one(
            {"child_id": child["child_id"]},
            {"habit_ids": 1}
        )
        is_assigned = habit_id in (assignment.get("habit_ids", []) if assignment else [])
        result.append({
            **child,
            "is_assigned": is_assigned
        })
    
    return result

@api_router.put("/habits/{habit_id}/children")
async def update_habit_child_assignments(habit_id: str, request: Request):
    """Update which children have this habit assigned"""
    parent = await get_current_parent(request)
    body = await request.json()
    child_ids = body.get("child_ids", [])
    
    # Verify all children belong to parent
    children = await db.children.find(
        {"parent_id": parent.user_id},
        {"child_id": 1}
    ).to_list(20)
    valid_child_ids = {c["child_id"] for c in children}
    
    # Validate requested child_ids
    for cid in child_ids:
        if cid not in valid_child_ids:
            raise HTTPException(status_code=400, detail=f"Invalid child ID: {cid}")
    
    # For each child, add or remove the habit
    for child in children:
        child_id = child["child_id"]
        should_have = child_id in child_ids
        
        assignment = await db.child_habits.find_one({"child_id": child_id})
        current_habits = set(assignment.get("habit_ids", []) if assignment else [])
        
        if should_have and habit_id not in current_habits:
            # Add habit
            current_habits.add(habit_id)
        elif not should_have and habit_id in current_habits:
            # Remove habit
            current_habits.discard(habit_id)
        else:
            continue  # No change needed
        
        await db.child_habits.update_one(
            {"child_id": child_id},
            {
                "$set": {
                    "child_id": child_id,
                    "parent_id": parent.user_id,
                    "habit_ids": list(current_habits),
                    "updated_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
    
    logger.info(f"Updated habit {habit_id} assignments to children: {child_ids}")
    
    return {"success": True, "assigned_to": child_ids}

# ==================== BADGES ENDPOINTS ====================

@api_router.get("/badges")
async def get_all_badges():
    """Get all available badges"""
    return BADGES

@api_router.post("/child/check-badges")
async def check_and_award_point_badges(request: Request):
    """Check and award any missing point-based badges for the child"""
    session = await get_current_child_session(request)
    child_id = session["child_id"]
    
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    total_points = child.get("total_points", 0)
    current_badges = set(child.get("badges", []))
    new_badges = []
    
    # Check point-based badges
    for badge in BADGES:
        if badge["requirement_type"] == "total_points" and badge["badge_id"] not in current_badges:
            if total_points >= badge["requirement_value"]:
                current_badges.add(badge["badge_id"])
                new_badges.append(badge["badge_id"])
                logger.info(f"Badge {badge['badge_id']} awarded to {child_id}! Total points: {total_points}")
    
    # Update if new badges were added
    if new_badges:
        await db.children.update_one(
            {"child_id": child_id},
            {"$set": {"badges": list(current_badges)}}
        )
    
    return {
        "success": True,
        "total_points": total_points,
        "new_badges": new_badges,
        "all_badges": list(current_badges)
    }

@api_router.get("/avatars")
async def get_avatar_levels():
    """Get avatar level progression info"""
    return AVATAR_LEVELS

# ==================== PUSH NOTIFICATIONS ENDPOINTS ====================

@api_router.post("/push/register")
async def register_push_token(token_data: PushTokenRegister, request: Request):
    """Register a push notification token"""
    parent = await get_current_parent(request)
    
    # Check if token already exists
    existing = await db.parents.find_one({
        "user_id": parent.user_id,
        "push_tokens.token": token_data.push_token
    })
    
    if existing:
        # Update existing token
        await db.parents.update_one(
            {"user_id": parent.user_id, "push_tokens.token": token_data.push_token},
            {"$set": {
                "push_tokens.$.last_used_at": datetime.now(timezone.utc),
                "push_tokens.$.is_active": True
            }}
        )
    else:
        # Add new token
        await db.parents.update_one(
            {"user_id": parent.user_id},
            {"$push": {
                "push_tokens": {
                    "token": token_data.push_token,
                    "platform": token_data.platform,
                    "device_name": token_data.device_name or f"{token_data.platform}-device",
                    "is_active": True,
                    "registered_at": datetime.now(timezone.utc),
                    "last_used_at": datetime.now(timezone.utc)
                }
            }}
        )
    
    return {"success": True}

@api_router.post("/push/unregister")
async def unregister_push_token(token_data: PushTokenRegister, request: Request):
    """Unregister a push notification token"""
    parent = await get_current_parent(request)
    
    await db.parents.update_one(
        {"user_id": parent.user_id},
        {"$pull": {"push_tokens": {"token": token_data.push_token}}}
    )
    
    return {"success": True}

# ==================== FEEDBACK ENDPOINTS ====================

class FeedbackRequest(BaseModel):
    message: str
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None

@api_router.post("/feedback")
async def send_feedback(feedback: FeedbackRequest, request: Request):
    """Send feedback email to app developers"""
    try:
        # Try to get authenticated parent info
        try:
            parent = await get_current_parent(request)
            sender_name = parent.name
            sender_email = parent.email
        except:
            # Use provided info if not authenticated
            sender_name = feedback.sender_name or "Anonymous"
            sender_email = feedback.sender_email or "No email provided"
        
        # Send email via Brevo
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(brevo_config))
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .info-box {{ background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea; }}
                .message-box {{ background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; }}
                .label {{ font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }}
                .value {{ color: #333; margin-top: 4px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🦸 Habit Hero Feedback</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">New message from app user</p>
                </div>
                <div class="content">
                    <div class="info-box">
                        <div style="margin-bottom: 10px;">
                            <div class="label">From</div>
                            <div class="value">{sender_name}</div>
                        </div>
                        <div>
                            <div class="label">Email</div>
                            <div class="value">{sender_email}</div>
                        </div>
                    </div>
                    <div class="label" style="margin-bottom: 8px;">Message</div>
                    <div class="message-box">
                        {feedback.message.replace(chr(10), '<br>')}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": "habit.hero.kids@gmail.com", "name": "Habit Hero Team"}],
            sender={"name": "Habit Hero App", "email": SENDER_EMAIL},
            reply_to={"email": sender_email, "name": sender_name} if sender_email and "@" in sender_email else None,
            subject=f"📬 Feedback from {sender_name}",
            html_content=html_content
        )
        
        api_instance.send_transac_email(send_smtp_email)
        logger.info(f"Feedback email sent from: {sender_email}")
        
        # Also store in database for reference
        await db.feedback.insert_one({
            "feedback_id": f"feedback_{uuid.uuid4().hex[:12]}",
            "sender_name": sender_name,
            "sender_email": sender_email,
            "message": feedback.message,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"success": True, "message": "Feedback sent successfully"}
        
    except ApiException as e:
        logger.error(f"Brevo API error sending feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to send feedback email")
    except Exception as e:
        logger.error(f"Error sending feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to send feedback")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background task to process scheduled notifications
import asyncio

async def notification_processor_task():
    """Background task that runs every minute to process scheduled notifications"""
    while True:
        try:
            await asyncio.sleep(60)  # Check every minute
            now = datetime.now(timezone.utc)
            
            # Find notifications that are due
            due_notifications = await db.scheduled_notifications.find({
                "scheduled_at": {"$lte": now},
                "sent": False
            }).to_list(100)
            
            for notif in due_notifications:
                child_id = notif["child_id"]
                
                # Create child notification
                child_notif = {
                    "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                    "child_id": child_id,
                    "type": notif.get("type", "reminder"),
                    "message_el": notif.get("message_el", "Υπενθύμιση!"),
                    "habit_id": notif.get("habit_id"),
                    "habit_name": notif.get("habit_name"),
                    "habit_emoji": notif.get("habit_emoji", "⏰"),
                    "is_read": False,
                    "created_at": now
                }
                
                await db.child_notifications.insert_one(child_notif)
                
                # Mark as sent
                await db.scheduled_notifications.update_one(
                    {"_id": notif["_id"]},
                    {"$set": {"sent": True, "sent_at": now}}
                )
                
                logger.info(f"[BG Task] Sent postpone reminder to child {child_id}: {notif.get('habit_name', '')}")
            
            if due_notifications:
                logger.info(f"[BG Task] Processed {len(due_notifications)} scheduled notifications")
            
            # ==================== INACTIVITY PENALTY CHECK ====================
            # Check every hour for children with inactivity penalty enabled
            # Uses parent-configurable deduction amount and time period
            try:
                # Find children with inactivity penalty enabled
                penalty_children = await db.children.find({
                    "inactivity_penalty_enabled": True,
                    "total_points": {"$gt": 10},  # Only if they have more than 10 points
                }).to_list(100)
                
                for child in penalty_children:
                    child_id = child["child_id"]
                    current_points = child.get("total_points", 0)
                    
                    # Get configurable settings (defaults: 10 points, 24 hours)
                    configured_deduction = child.get("inactivity_points_deduction", 10)
                    configured_hours = child.get("inactivity_time_period_hours", 24)
                    
                    # Calculate the cutoff time based on configured hours
                    cutoff_time = now - timedelta(hours=configured_hours)
                    
                    # Check if last activity is before cutoff (handle timezone-naive datetimes)
                    last_activity = child.get("last_activity")
                    if last_activity:
                        if last_activity.tzinfo is None:
                            last_activity = last_activity.replace(tzinfo=timezone.utc)
                        if last_activity > cutoff_time:
                            continue  # Child was active within the time period
                    
                    # Check if we already penalized within the time period (handle timezone-naive datetimes)
                    last_penalty = child.get("last_inactivity_penalty")
                    if last_penalty:
                        if last_penalty.tzinfo is None:
                            last_penalty = last_penalty.replace(tzinfo=timezone.utc)
                        if last_penalty > cutoff_time:
                            continue  # Already penalized within this period
                    
                    # Calculate deduction (use configured amount, but leave at least 10 points)
                    max_deduction = current_points - 10
                    deduction = min(configured_deduction, max_deduction)
                    
                    if deduction <= 0:
                        continue
                    
                    new_points = current_points - deduction
                    gender = child.get("gender", "boy")
                    
                    # Format time period for notification message
                    if configured_hours == 12:
                        time_text = "μισή μέρα"
                    elif configured_hours == 24:
                        time_text = "24 ώρες"
                    elif configured_hours == 72:
                        time_text = "3 μέρες"
                    elif configured_hours == 168:
                        time_text = "1 εβδομάδα"
                    else:
                        time_text = f"{configured_hours} ώρες"
                    
                    # Update child's points
                    await db.children.update_one(
                        {"child_id": child_id},
                        {"$set": {
                            "total_points": new_points,
                            "last_inactivity_penalty": now
                        }}
                    )
                    
                    # Log the deduction in points_history
                    await db.points_history.insert_one({
                        "history_id": f"hist_{uuid.uuid4().hex[:12]}",
                        "child_id": child_id,
                        "parent_id": child.get("parent_id"),
                        "points": -deduction,
                        "reason": "inactivity_penalty",
                        "description_el": f"Αφαίρεση πόντων λόγω αδράνειας ({time_text})",
                        "description_en": f"Points deducted due to inactivity ({configured_hours}h)",
                        "created_at": now
                    })
                    
                    # Create notification for child with gender-aware message
                    sad_messages = [
                        f"😢 Ωχ! Δεν είδαμε καμία δραστηριότητα εδώ και {time_text}. Χάθηκαν {deduction} πόντοι.",
                        f"😔 Πού είσαι; Χάθηκαν {deduction} πόντοι λόγω αδράνειας. Έλα να παίξουμε!",
                        f"💔 Μας λείπεις! {deduction} πόντοι αφαιρέθηκαν. Δοκίμασε να ολοκληρώσεις μια συνήθεια!",
                    ]
                    
                    import random
                    message = random.choice(sad_messages)
                    
                    await db.child_notifications.insert_one({
                        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                        "child_id": child_id,
                        "type": "inactivity_penalty",
                        "title": "😢 Αφαίρεση Πόντων",
                        "message": message,
                        "is_read": False,
                        "created_at": now
                    })
                    
                    logger.info(f"[BG Task] Inactivity penalty: deducted {deduction} points from child {child_id} (configured: {configured_deduction}pts/{configured_hours}h, now: {new_points})")
                
            except Exception as e:
                logger.error(f"[BG Task] Error processing inactivity penalties: {e}")
                
        except Exception as e:
            logger.error(f"[BG Task] Error processing notifications: {e}")

@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup"""
    asyncio.create_task(notification_processor_task())
    logger.info("Background notification processor started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
