use axum::{Json, extract::{Path, Request, State}, http::{HeaderMap, StatusCode}, middleware::Next, response::Response};
use rand::Rng;
use sha2::Digest;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::data::{self, AppState, Quest};


pub async fn request_challange(headers: HeaderMap, State(state): State<data::AppState>) -> Json<data::Quest> {

    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    let points: i32 = query_scalar!("SELECT points FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();

    // Select the best matching quest: the one with the highest required_points that is <= user's points
    // Exclude quests the user already has in user_quest (so completed/pending quests are not re-assigned)
    let quest = query_as::<_, data::Quest>("SELECT * FROM quests WHERE required_points <= $1 AND id NOT IN (SELECT quest_id FROM user_quest WHERE user_id = $2) ORDER BY required_points DESC LIMIT 1")
        .bind(points)
        .bind(id)
        .fetch_one(&state.db_connection)
        .await;

    match quest {
        Ok(quest) => {
            Json(quest)
        }
        Err(_) => {
            Json(Quest { id: Uuid::nil(), name: "".to_string(), description: "".to_string(), required_points: 0, points_received:  0})
        }
    }
}

pub async fn send_challange(headers: HeaderMap, State(state): State<data::AppState>, Path(quest_id): Path<Uuid>) {
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();

    /*
    let filed = multipart.next_field().await.unwrap().unwrap();

    let name = filed.name().unwrap().to_string();
    //let contnet_type = filed.content_type().unwrap_or("application/octet-stream").to_string();
    let data = filed.bytes().await.unwrap();

    let file_path = format!("./image-{}", name);
    println!("{} {}", name, data.len());
    let mut file = File::create(&file_path).unwrap();
    file.write_all(&data).unwrap();
    */
    sqlx::query("INSERT INTO user_quest (user_id, quest_id, progress, proof_path) VALUES($1, $2, $3, $4)")
        .bind(id)
        .bind(quest_id)
        .bind(data::Progress::Pending)
        .bind("")
        .execute(&state.db_connection)
        .await.unwrap();

}

// Needs name, email and password in json format

pub async fn register(State(state): State<data::AppState>, Json(register): Json<data::RegisterUser>) -> (StatusCode, String) {
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
            (StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", e))
        }
    }
}

// need email and passwrod in json format
pub async fn login(State(state): State<data::AppState>, Json(register): Json<data::RegisterUser>) -> (StatusCode, String) {
    let hash_raw = sha2::Sha256::digest(register.password);
    let hash_str = format!("{:x}", hash_raw);

    let user = sqlx::query_as!(data::User, "SELECT * FROM users WHERE mail = $1", register.email)
        .fetch_one(&state.db_connection)
        .await;

    match user {
        Ok(u) => {
            if u.password_hash == hash_str {
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

pub async fn get_pending_quest(headers: HeaderMap, State(state): State<data::AppState>) -> Result<Json<data::PendingRequest>, StatusCode> {

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
            .await.unwrap();
    } else {
        quests = sqlx::query_as!(Quest, "SELECT * FROM quests;")
            .fetch_all(&state.db_connection)
            .await.unwrap();
    }
    let mut rng = rand::rng();
    let idx = rng.random_range(0..quests.len());
    let the_chosen_one = quests.get(idx).unwrap();
    
    the_chosen_one.clone()
}

pub async fn get_weekly_quest(State(state): State<data::AppState>) -> (StatusCode, Json<Quest>) {
    let the_chosen_one = get_random_quest(None, &state).await;
    (StatusCode::OK, Json(the_chosen_one))
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

pub async fn get_weekly(State(state): State<data::AppState>) -> (StatusCode, Json<[Quest; 3]>) {
    // TODO: Optimize this to use 1 query not 3..
    let easy = get_random_quest(Some(5), &state);
    let medium = get_random_quest(Some(15), &state);
    let hard = get_random_quest(Some(30), &state);
    
    (StatusCode::OK, Json([easy.await, medium.await, hard.await]))
}