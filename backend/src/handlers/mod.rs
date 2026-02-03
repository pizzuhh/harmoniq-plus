use std::str::FromStr;

use axum::{Json, extract::{Path, Request, State}, http::{HeaderMap, StatusCode}, middleware::Next, response::Response};
use chrono::{Datelike, Days, Utc};
use rand::Rng;
use regex::Regex;
use serde::Serialize;
use serde_json::{Value, json};
use sha2::Digest;
use sqlx::{prelude::FromRow, query_as, query_scalar};
use uuid::Uuid;

use crate::data::{self, AppState, DiaryData, DiaryInput, PersonalChallange, PersonalChallangeInput, Quest, User};

const WEEKLY_POINTS: i32 = 50;

pub async fn request_challange(headers: HeaderMap, State(state): State<data::AppState>) -> Json<Vec<data::Quest>> {

    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    let mut points: i32 = query_scalar!("SELECT points FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();
    let level: f32 = points as f32 / 100f32;
    let level = level.ceil() as i32;
    if level < 5 {
        points = 10;
    } else if level < 10 {
        points = 15;
    } else {
        points = 30;
    }

    // Select the best matching quest: the one with the highest required_points that is <= user's points
    // Exclude quests the user already has in user_quest (so completed/pending quests are not re-assigned)
    // Maybe change points_received <= $1 to points_received = $1 ?
    let quest = query_as::<_, data::Quest>("SELECT * FROM quests WHERE points_received <= $1 AND id NOT IN (SELECT quest_id FROM user_quest WHERE user_id = $2) ORDER BY required_points DESC;")
        .bind(points)
        .bind(id)
        .fetch_all(&state.db_connection)
        .await;

    match quest {
        Ok(quest) => {
            Json(quest)
        }
        Err(_) => {
            Json(vec![Quest { id: Uuid::nil(), name: "".to_string(), description: "".to_string(), required_points: 0, points_received:  0}])
        }
    }
}

pub async fn send_challange(headers: HeaderMap, State(state): State<data::AppState>, Path(quest_id): Path<Uuid>) {
    
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();

    sqlx::query("INSERT INTO user_quest (user_id, quest_id, progress, proof_path) VALUES($1, $2, $3, $4)")
        .bind(id)
        .bind(quest_id)
        .bind(data::Progress::Pending)
        .bind("")
        .execute(&state.db_connection)
        .await.unwrap();

    // Update the streak
    let _ = update_streak(&state, &headers).await;

}

// Needs name, email and password in json format

// Verefies email in 2 steps.
// 1. Use regex to check if the syntax is valid
// 2. Use DNS query to check if the domain has MX records
async fn verify_email(email: &str) -> bool {
    let re = Regex::new(r"^([A-Za-z0-9._/%-+]+)@([A-Za-z0-9_-]+)\.([A-Za-z0-9]{2,})$").unwrap();

    // Match regex
    let captures = re.captures(email);

    if let Some(captures) = captures {
        let domain = format!("{}.{}", captures[2].trim(), captures[3].trim());

        // Lookup MX record
        let resolver = hickory_resolver::Resolver::builder_tokio().unwrap().build();
        match resolver.mx_lookup(domain).await {
            Ok(_mx) => true,
            Err(_e) => false,
        }
    } else {
        false
    }
}

pub async fn register(State(state): State<data::AppState>, Json(register): Json<data::RegisterUser>) -> (StatusCode, String) {

    let valid = verify_email(&register.email).await;
    if !valid {
        return (StatusCode::UNAUTHORIZED, "Invalid email!".into());
    }

    let hash_raw = sha2::Sha256::digest(register.password);
    let hash_str = format!("{:x}", hash_raw);

    let a = sqlx::query!("INSERT INTO users (name, mail, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id;", register.name, register.email, hash_str, false)
        .fetch_one(&state.db_connection)
        .await;
    match a {
        Ok(id) => {
            println!("{:?}", id);

            (StatusCode::OK, id.id.to_string())
        }
        Err(e) => {
            if e.as_database_error().unwrap().is_unique_violation() {
                (StatusCode::FOUND, "User already exists. Consider logging in".into())
            } else {
                println!("{:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "".into())
            }
        }
    }
}

// need email and passwrod in json format
pub async fn login(State(state): State<data::AppState>, Json(register): Json<data::RegisterUser>) -> (StatusCode, String) {

    let valid = verify_email(&register.email).await;
    if !valid {
        return (StatusCode::UNAUTHORIZED, "Invalid email!".into());
    }

    let hash_raw = sha2::Sha256::digest(register.password);
    let hash_str = format!("{:x}", hash_raw);

    let user = sqlx::query_as!(data::User, "SELECT * FROM users WHERE mail = $1", register.email)
        .fetch_one(&state.db_connection)
        .await;

    match user {
        Ok(u) => {
            if u.password_hash == hash_str {
                if u.banned == Some(true) {
                    return (StatusCode::UNAUTHORIZED, "Достъпа до сайта е забранен >:(".to_string())
                }
                (StatusCode::OK, u.id.to_string())
            } else {
                (StatusCode::UNAUTHORIZED, "".to_string())
            }
        }
        Err(e) => {
            match e {
                sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "User does not exist".into()),
                _ => (StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", e))
            }
        }
    }
}

pub async fn get_pending_quest(_headers: HeaderMap, State(state): State<data::AppState>) -> Result<Json<data::PendingRequest>, StatusCode> {


    let rq = sqlx::query_as!(data::PendingRequest, "SELECT proof_path, id FROM user_quest WHERE progress = 'pending';")
        .fetch_one(&state.db_connection)
        .await;
    if let Ok(rq) = rq {
        Ok(Json(rq))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

pub async fn me(headers: HeaderMap, State(state): State<data::AppState>) -> (StatusCode, Json<Option<data::User>>) {


    let token = match headers.get("user_id") {
        Some(t) => t,
        None => return (StatusCode::UNAUTHORIZED, Json(None)),
    };

    let id: Uuid = match token.to_str() {
        Ok(s) => match s.parse() {
            Ok(u) => u,
            Err(_) => return (StatusCode::UNAUTHORIZED, Json(None)),
        },
        Err(_) => return (StatusCode::UNAUTHORIZED, Json(None)),
    };

    let user = sqlx::query_as!(data::User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_one(&state.db_connection)
        .await;

    match user {
        Ok(mut u) => {
            u.password_hash = "".into(); // Do not return the hash to the front end
            (StatusCode::OK, Json(Some(u)))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(None)),
    }
}

pub async fn verify_quest(State(state): State<data::AppState>, headers: HeaderMap,  Path(qid): Path<Uuid>, Json(body): Json<data::VerifyRequest>) -> StatusCode {


    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    // Check permissions from db (inefficent)
    let r = sqlx::query!("SELECT is_admin FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();
    if r.is_admin == false {
        return StatusCode::UNAUTHORIZED;
    }

    if body.completed {
        let uid = sqlx::query!("UPDATE user_quest SET progress = 'verified' WHERE id = $1 RETURNING user_id;", qid)
            .fetch_one(&state.db_connection)
            .await.unwrap();
        sqlx::query!("UPDATE users SET points = points + 9 WHERE id = $1;", uid.user_id)
            .execute(&state.db_connection)
            .await.unwrap();
    } else {
        sqlx::query!("UPDATE user_quest SET progress = 'denied' WHERE id = $1", qid)
            .execute(&state.db_connection)
            .await.unwrap();
    }

    StatusCode::OK
}

// Allows a user to complete a quest and get it auto-verified (no admin required).
// This creates a user_quest with progress = 'verified' and awards the quest's points to the user.
pub async fn complete_challenge(State(state): State<data::AppState>, headers: HeaderMap, Path(qid): Path<Uuid>) -> StatusCode {
    let token = match headers.get("user_id") {
        Some(t) => t,
        None => return StatusCode::UNAUTHORIZED,
    };
    let uid: Uuid = match token.to_str() {
        Ok(s) => match s.parse() { Ok(u) => u, Err(_) => return StatusCode::UNAUTHORIZED },
        Err(_) => return StatusCode::UNAUTHORIZED,
    };

    let quest = sqlx::query_as!(Quest, "SELECT * FROM quests WHERE id = $1;", qid)
        .fetch_one(&state.db_connection)
        .await.unwrap();

    if quest.points_received == WEEKLY_POINTS {
        sqlx::query!("UPDATE users SET completed_weekly = NOW() WHERE id = $1", uid)
            .execute(&state.db_connection)
            .await.unwrap();
    }

    // Insert a verified user_quest row for this user and quest
    let inserted = sqlx::query("INSERT INTO user_quest (user_id, quest_id, progress, proof_path) VALUES ($1, $2, $3, $4) RETURNING id;")
        .bind(uid)
        .bind(qid)
        .bind(data::Progress::Verified)
        .bind("")
        .fetch_one(&state.db_connection)
        .await;

    if inserted.is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    // Fetch quest points and add to user's total
    let quest_row = sqlx::query!("SELECT points_received FROM quests WHERE id = $1", qid)
        .fetch_one(&state.db_connection)
        .await;

    match quest_row {
        Ok(q) => {
            let _ = sqlx::query!("UPDATE users SET points = points + $1 WHERE id = $2", q.points_received, uid)
                .execute(&state.db_connection)
                .await;
            let _ = update_streak(&state, &headers).await;
            StatusCode::OK
        }
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn get_random_quest(target_pts: Option<i32>, state: &AppState) -> Quest {
    let mut quests = Vec::<Quest>::new();
    if let Some(pts) = target_pts {
        quests = sqlx::query_as!(Quest, "SELECT * FROM quests WHERE points_received = $1;", pts)
            .fetch_all(&state.db_connection)
            .await.expect("a");
    } else {
        quests = sqlx::query_as!(Quest, "SELECT * FROM quests;")
            .fetch_all(&state.db_connection)
            .await.expect("a");
    }
    let mut rng = rand::rng();
    let idx = rng.random_range(0..quests.len());
    let the_chosen_one = quests.get(idx).unwrap();
    
    the_chosen_one.clone()
}

async fn get_weekly(state: &AppState) -> Quest {

    let mut last_week = {
        state.last_week.lock().await
    };
    let mut weekly_challange = {
        state.weekly_challange.lock().await
    };

    let now = Utc::now().date_naive().iso_week().week();
    if last_week.is_none() {
        *last_week = Some(now);
    }
    if weekly_challange.is_none() || last_week.unwrap() != now {
        let quest = get_random_quest(Some(50), &state);
        *weekly_challange = Some(quest.await);
    }
    weekly_challange.as_ref().unwrap().clone()
}

pub async fn get_weekly_quest(headers: HeaderMap, State(state): State<data::AppState>) -> Result<Json<Quest>, StatusCode> {
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();

    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();

    if let Some(week) = user.completed_weekly && week.iso_week().week() == Utc::now().date_naive().iso_week().week() {
        return Err(StatusCode::UNAVAILABLE_FOR_LEGAL_REASONS);
    }

    // 50 points - probably weekly quests?
    let the_chosen_one = get_weekly(&state).await;
    Ok(Json(the_chosen_one))
}

// Accepts number only
pub async fn send_form_points(State(state): State<data::AppState>, headers: HeaderMap, Json(pts): Json<i32>) -> StatusCode {

    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();

    sqlx::query!("UPDATE users SET points = $1 WHERE id = $2;", pts, id)
        .execute(&state.db_connection)
        .await.unwrap();

    StatusCode::OK
}

pub async fn admin_check(headers: HeaderMap, State(state): State<AppState>, req: Request, next: Next, ) -> Result<Response, StatusCode> {
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    // Check permissions from db (inefficent)
    let r = sqlx::query!("SELECT is_admin FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();
    if !r.is_admin {
        Err(StatusCode::UNAUTHORIZED)
    } else {
        Ok(next.run(req).await)
    }
}

pub async fn leaderboard(State(state): State<AppState>) -> Result<Json<Vec<(String, i32, i64)>>, StatusCode> {

    // Change the limit or some shit.
    let users = sqlx::query!("SELECT name,points, RANK() OVER (ORDER BY points DESC) AS rank FROM users LIMIT 5;")
        .fetch_all(&state.db_connection)
        .await;
    match users {
        Ok(users) => {
            let users: Vec<(String, i32, i64)> = users.iter().into_iter()
                .map(|u| (u.name.clone(), u.points, u.rank.unwrap_or(0))).collect();
            Ok(Json(users))
        }
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}


// Wheel
#[derive(Clone, Serialize)]
pub struct Challenge {
    title: &'static str,
    description: &'static str,
}

static CHALLENGES: [Challenge; 33] = [
        Challenge {
            title: "24-hour Digital Sunset",
            description: "No screens from sunset to sunrise; write a short reflection.",
        },
        Challenge {
            title: "Trash Audit + Swap",
            description: "Categorize household waste for 48h and replace one single-use item.",
        },
        Challenge {
            title: "Walk & Listen",
            description: "90-min walk without phone navigation; note 10 plants/animals.",
        },
        Challenge {
            title: "No-Complaint Day",
            description: "Reframe complaints into constructive action for one day.",
        },
        Challenge {
            title: "Repair Project",
            description: "Repair a broken item or responsibly recycle it.",
        },
        Challenge {
            title: "Give 1 Hour to a Green Group",
            description: "Volunteer an hour with a local environmental group.",
        },
        Challenge {
            title: "Social Media Fast",
            description: "Take 72h off one social platform and write by hand to a friend.",
        },
        Challenge {
            title: "Teach a Skill",
            description: "Teach someone a practical green skill (composting, repair).",
        },
        Challenge {
            title: "One-Ingredient Cooking",
            description: "Cook a meal with local seasonal ingredients only.",
        },
        Challenge {
            title: "Deep Conversation",
            description: "A 30-min distraction-free call with someone you care about.",
        },
        Challenge {
            title: "24-Hour Plastic-Free",
            description: "Avoid single-use plastics for one full day.",
        },
        Challenge {
            title: "Mindful Mornings",
            description: "10 minutes of mindfulness each morning for 7 days.",
        },
        Challenge {
            title: "Sleep Hygiene Reset",
            description: "Set a sleep routine for 7 nights; no screens 1h before bed.",
        },
        Challenge {
            title: "Community Swap",
            description: "Organize or join a swap for clothes/tools/books.",
        },
        Challenge {
            title: "Zero-Waste Lunch x3",
            description: "Pack waste-free lunches for three days.",
        },
        Challenge {
            title: "Conversation with a Stranger",
            description: "Have a respectful 10–15 minute chat with someone new.",
        },
        Challenge {
            title: "30-Day Gratitude Thread",
            description: "Write one gratitude note each day for 30 days.",
        },
        Challenge {
            title: "Plant a Small Habitat",
            description: "Create a pollinator planter and observe it for a week.",
        },
        Challenge {
            title: "Energy Audit",
            description: "Estimate big energy uses and implement 3 reductions.",
        },
        Challenge {
            title: "Leftover Reinvention",
            description: "Turn leftovers into a new creative dish.",
        },
        Challenge {
            title: "Difficult Conversation",
            description: "Plan and have a calm talk you've been avoiding.",
        },
        Challenge {
            title: "Public Transport Pledge",
            description: "Use transit/bike/walk for two consecutive days.",
        },
        Challenge {
            title: "Local Economy Day",
            description: "Buy only locally-sourced goods for one day.",
        },
        Challenge {
            title: "Nature Micro-Project",
            description: "Plant native seeds or make a bee hotel.",
        },
        Challenge {
            title: "One Week Blocked App",
            description: "Block an addictive app for one week.",
        },
        Challenge {
            title: "Short Story From the Park",
            description: "90 min outside, then write a 500-word flash story.",
        },
        Challenge {
            title: "Upcycle Challenge",
            description: "Turn an old item into something new to gift.",
        },
        Challenge {
            title: "Mindful Listening Night",
            description: "Host a 1-hour listening session with a friend.",
        },
        Challenge {
            title: "Repair Café",
            description: "Attend or organize a repair event.",
        },
        Challenge {
            title: "One-Day Minimalist",
            description: "Live with only 20 items for a day.",
        },
        Challenge {
            title: "Screen-Free Creative Sprint",
            description: "2 hours creating with zero screens.",
        },
        Challenge {
            title: "Eco-Advocacy Letter",
            description: "Send a short evidence-based letter to a local official.",
        },
        Challenge {
            title: "Friendship Audit",
            description: "Pick one friendship to invest in this month.",
        },
];


pub async fn wheel_spin() -> (StatusCode, Json<i32>) {
    let n = CHALLENGES.len();
    if n == 0 {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(0i32))
    }
    let mut rng = rand::rng();
    let idx = rng.random_range(0..n) as i32;
    (StatusCode::OK, Json(idx))
}

pub async fn get_wheel_challanges()  -> (StatusCode, Json<Vec<Challenge>>) {
    (StatusCode::OK, Json(CHALLENGES.to_vec()))
}

async fn update_streak(state: &AppState, headers: &HeaderMap) -> Result<i32, StatusCode> {
    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return Err(StatusCode::UNAUTHORIZED)
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return Err(StatusCode::UNAUTHORIZED)
    };
    let user = query_as!(data::User, "SELECT * FROM users WHERE id = $1;", user_id)
        .fetch_one(&state.db_connection)
        .await;
    match user {
        Ok(user) => {
            let today = Utc::now().date_naive();
            let yesterday = today.checked_sub_days(Days::new(1)).unwrap();
            let mut streak = 0;
            
            if user.last_active == today {
                streak = user.current_streak;
            } else if user.last_active != yesterday {
                sqlx::query!("UPDATE users SET current_streak = 0 WHERE id = $1;", user_id)
                    .execute(&state.db_connection).await.unwrap();
            } else {
                let updated = sqlx::query_as!(data::User, "UPDATE users SET current_streak = current_streak + 1, longest_streak = GREATEST(current_streak + 1, longest_streak), last_active = $2 WHERE id = $1 RETURNING *;",
                            user_id, today)
                    .fetch_one(&state.db_connection).await.unwrap();
                streak = updated.current_streak;
            }
            
            Ok(streak)
        },
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

pub async fn get_streak(headers: HeaderMap, State(state): State<AppState>) -> Result<Json<serde_json::Value>, StatusCode> {

    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return Err(StatusCode::UNAUTHORIZED)
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return Err(StatusCode::UNAUTHORIZED)
    };

    let user = query_as!(data::User, "SELECT * FROM users WHERE id = $1;", user_id)
        .fetch_one(&state.db_connection)
        .await;
    match user {
        Ok(user) => {
            let today = Utc::now().date_naive();
            let yesterday = today.checked_sub_days(Days::new(1)).unwrap();
            let mut streak = 0;
            let mut longest_streak = 0;
            if user.last_active == today {
                streak = user.current_streak;
                longest_streak = user.longest_streak;
            }
            else if user.last_active != yesterday {
                sqlx::query!("UPDATE users SET current_streak = 0 WHERE id = $1;", user_id)
                    .execute(&state.db_connection).await.unwrap();
            }
            Ok(Json(json!({
                "current_streak": streak,
                "longest_streak": longest_streak,
                "last_completed_date": today
            })))
        },
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}


pub async fn pchallange_create(headers: HeaderMap, State(state): State<AppState>, Json(quest): Json<PersonalChallangeInput>) -> StatusCode {

    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return StatusCode::UNAUTHORIZED
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR
    };

    let r = sqlx::query!("INSERT INTO personal_challanges (category, description, name, priority, user_id) VALUES ($1, $2, $3, $4, $5)",
        quest.category, quest.description, quest.name, quest.priority, user_id)
        .execute(&state.db_connection)
        .await;

    if r.is_ok() {
        StatusCode::OK
    } else {
        eprintln!("{:?}", r);
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

pub async fn pchallange_get(headers: HeaderMap, State(state): State<AppState>) -> Result<Json<Vec<PersonalChallange>>, StatusCode> {
    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return Err(StatusCode::UNAUTHORIZED)
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR)
    };

    let r = sqlx::query_as!(PersonalChallange, "SELECT * FROM personal_challanges WHERE user_id = $1;", user_id)
        .fetch_all(&state.db_connection)
        .await;

    match r {
        Ok(data) => Ok(Json(data)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }

}

pub async fn pchallange_delete(headers: HeaderMap, State(state): State<AppState>, Path(qid): Path<Uuid>) -> StatusCode {
    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return StatusCode::UNAUTHORIZED
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR
    };



    let r = sqlx::query!("DELETE FROM personal_challanges WHERE user_id = $1 AND id = $2;", user_id, qid)
        .execute(&state.db_connection)
        .await;

    if r.is_ok() {
        StatusCode::OK
    } else {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}


pub async fn diary_create(headers: HeaderMap, State(state): State<AppState>, Json(body): Json<DiaryInput>) -> StatusCode {
    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return StatusCode::UNAUTHORIZED
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR
    };


    let r = sqlx::query!("INSERT INTO diary (content, mood, user_id) VALUES($1, $2, $3);", body.content, body.mood, user_id)
        .execute(&state.db_connection).await;

    if r.is_ok() {
        StatusCode::OK
    } else {
        StatusCode::INTERNAL_SERVER_ERROR
    }


}

pub async fn diary_get(headers: HeaderMap, State(state): State<AppState>) -> Result<Json<Vec<DiaryData>>, StatusCode> {
    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return Err(StatusCode::UNAUTHORIZED)
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR)
    };

    let r = sqlx::query_as!(DiaryData, "SELECT * FROM diary WHERE user_id = $1;", user_id)
        .fetch_all(&state.db_connection).await;
    match r {
        Ok(r) => Ok(Json(r)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

pub async fn diary_delete(headers: HeaderMap, State(state): State<AppState>, Path(qid): Path<Uuid>) -> StatusCode {
    let user_id = match headers.get("user_id") {
        Some(u) => u,
        None => return StatusCode::UNAUTHORIZED
    };
    let user_id = match Uuid::from_str(user_id.to_str().unwrap()) {
        Ok(u) => u,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR
    };

    let r = sqlx::query!("DELETE FROM personal_challanges WHERE user_id = $1 AND id = $2;", user_id, qid)
        .execute(&state.db_connection)
        .await;

    if r.is_ok() {
        StatusCode::OK
    } else {
        StatusCode::INTERNAL_SERVER_ERROR
    }
    
}

pub async fn admin_users(_headers: HeaderMap, State(state): State<AppState>) -> Result<Json<Vec<User>>, StatusCode> {
    
    let res = sqlx::query_as::<_, User>("SELECT id, name, mail, is_admin, points, longest_streak, current_streak, last_active, completed_weekly, banned FROM users")
        .fetch_all(&state.db_connection).await;

    match res {
        Ok(r) => {
            Ok(Json(r))
        }
        Err(e) => {
            println!("dbg: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Taken from the frontend..
#[derive(Serialize)]
pub struct AdminChallenge {
    id: String,
    title: String,
    description: String,
    xp: i32,
    difficulty: String,
    category: String
}

pub async fn admin_challanges(_headers: HeaderMap, State(state): State<AppState>) -> Result<Json<Vec<AdminChallenge>>, StatusCode> {
    let challanges = sqlx::query_as!(Quest, "SELECT * FROM quests;")
        .fetch_all(&state.db_connection).await;
    match challanges {
        Ok(c) => {
            let mut ac = Vec::<AdminChallenge>::new();
            for challange in c {
                let tmp_ac = AdminChallenge {
                    id: challange.id.to_string(),
                    title: challange.name,
                    description: challange.description,
                    xp: challange.points_received,
                    difficulty: if challange.points_received <= 10 {"easy".into()} else if challange.points_received <= 15 {"medium".into()} else {"hard".into()},
                    category: if challange.points_received == 50 {"weekly".into()} else {"normal".into()}
                };
                ac.push(tmp_ac);
            }
            Ok(Json(ac))
        }
        Err(e) => {
            eprintln!("{:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Serialize, FromRow)]
pub struct Completion {
  id: Option<String>,
  username: Option<String>,
  challange_title: Option<String>,
  completed_at: Option<String>
}

pub async fn admin_completions(_headers: HeaderMap, State(state): State<AppState>) -> Result<Json<Vec<Completion>>, StatusCode> {
    let completion_query = sqlx::query_as!(Completion, "SELECT uq.id::text AS id, u.name AS username, q.name AS challange_title, uq.completed_at::text AS completed_at FROM user_quest uq JOIN users u ON u.id = uq.user_id JOIN quests q ON q.id = uq.quest_id;")
        .fetch_all(&state.db_connection).await;
    match completion_query {
        Ok(cq) => {
            Ok(Json(cq))
        }
        Err(e) => {
            eprintln!("{:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}



pub async fn admin_ban_user(Path(id): Path<Uuid>, State(state): State<AppState>) -> StatusCode {
    let res = sqlx::query!("UPDATE users SET banned = NOT banned WHERE id = $1;", id)
        .execute(&state.db_connection).await;
    match res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("ban: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}
pub async fn admin_delete_user(Path(id): Path<Uuid>, State(state): State<AppState>) -> StatusCode {
    let res = sqlx::query!("DELETE FROM users WHERE id = $1;", id)
        .execute(&state.db_connection).await;
    match res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("del: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}
pub async fn admin_edit_user(headers: HeaderMap, Path(id): Path<Uuid>, State(state): State<AppState>, Json(body): Json<Value>) -> StatusCode {
    // Set only the uhh tvato admin deto e
    
    if let Some(pid) = headers.get("user_id") && let Ok(pid) = Uuid::from_str(pid.to_str().unwrap()) && pid == id {
        println!("{} {}", pid, id);
        return StatusCode::CONFLICT;
    }

    let res = sqlx::query!("UPDATE users SET is_admin = $2 WHERE id = $1;", id, body["is_admin"].as_bool().unwrap())
        .execute(&state.db_connection).await;
    match res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("ban: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub async fn admin_add_challange(State(state): State<AppState>, Json(body): Json<Value>) -> StatusCode {
    let title = body["title"].as_str();
    let description = body["description"].as_str();
    let xp = (body["xpReward"].as_i64().unwrap()) as i32;

    let res = sqlx::query!("INSERT INTO quests (name, description, points_received, required_points) VALUES ($1, $2, $3, $3);", title, description, xp)
        .execute(&state.db_connection).await;
    match res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("ban: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub async fn admin_edit_challange(Path(id): Path<Uuid>, State(state): State<AppState>, Json(body): Json<Value>) -> StatusCode {
    let title = body["title"].as_str();
    let description = body["description"].as_str();
    let xp = (body["xp"].as_i64().unwrap()) as i32;

    let res = sqlx::query!("UPDATE quests SET name = $1, description = $2, points_received = $3, required_points = $3 WHERE id = $4;", title, description, xp, id)
        .execute(&state.db_connection).await;
    match res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("ban: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub async fn admin_delete_challange(Path(id): Path<Uuid>, State(state): State<AppState>) -> StatusCode {
    let res = sqlx::query!("DELETE FROM quests WHERE id = $1;", id)
        .execute(&state.db_connection).await;
    match res {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("ban: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}