use std::{fs::File, io::Write};

use axum::{extract::{Multipart, Path, State}, http::{HeaderMap, StatusCode}, Json};
use rand::Rng;
use sha2::Digest;
use sqlx::query_as;
use uuid::Uuid;

use crate::data::{self, PendingRequest, Quest};


pub async fn request_challange(headers: HeaderMap, State(state): State<data::AppState>) -> Json<data::Quest> {
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    let user: data::User = query_as!(data::User, "SELECT * FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();
    let points = user.points;

    let mut challanges: Vec<data::Quest> = query_as::<_, data::Quest>("SELECT * FROM quests WHERE required_points <= $1")
        .bind(points)
        .fetch_all(&state.db_connection)
        .await.unwrap();
    let challanges = challanges.pop().unwrap();

    Json(challanges)
}

pub async fn send_challange(headers: HeaderMap, State(state): State<data::AppState>, Path(quest_id): Path<Uuid>, mut multipart: Multipart) {
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();

    let filed = multipart.next_field().await.unwrap().unwrap();

    let name = filed.name().unwrap().to_string();
    //let contnet_type = filed.content_type().unwrap_or("application/octet-stream").to_string();
    let data = filed.bytes().await.unwrap();

    let file_path = format!("./image-{}", name);
    println!("{} {}", name, data.len());
    let mut file = File::create(&file_path).unwrap();
    file.write_all(&data).unwrap();

    sqlx::query("INSERT INTO user_quest (user_id, quest_id, progress, proof_path) VALUES($1, $2, $3, $4)")
        .bind(id)
        .bind(quest_id)
        .bind(data::Progress::Pending)
        .bind(file_path)
        .execute(&state.db_connection)
        .await.unwrap();

}

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
                (StatusCode::INTERNAL_SERVER_ERROR, format!("{:?}", e))
        }
    }
}

pub async fn get_pending_quest(headers: HeaderMap, State(state): State<data::AppState>) -> (StatusCode, Json<data::PendingRequest>) {
    let token = headers.get("user_id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    // Check permissions from db (inefficent)
    let r = sqlx::query!("SELECT is_admin FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();
    if r.is_admin == false {
        return (StatusCode::UNAUTHORIZED, Json(data::PendingRequest{proof_path: None, id: Uuid::nil()}));
    }

    let rq = sqlx::query_as!(data::PendingRequest, "SELECT proof_path, id FROM user_quest WHERE progress = 'pending';")
        .fetch_one(&state.db_connection)
        .await.unwrap();

    (StatusCode::OK, Json(rq))
}

#[axum::debug_handler]
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
        sqlx::query!("UPDATE user_quest SET progress = 'verified' WHERE id = $1", qid)
            .execute(&state.db_connection)
            .await.unwrap();
    } else {
        sqlx::query!("UPDATE user_quest SET progress = 'denied' WHERE id = $1", qid)
            .execute(&state.db_connection)
            .await.unwrap();
    }

    StatusCode::OK
}


#[axum::debug_handler]
pub async fn get_weekly_quest(State(state): State<data::AppState>) -> (StatusCode, Json<Quest>) {
    let quests = sqlx::query_as!(Quest, "SELECT * FROM quests;")
        .fetch_all(&state.db_connection)
        .await.unwrap();
    let mut rng = rand::rng();
    let idx = rng.random_range(0..quests.len());
    let the_chosen_one = quests.get(idx).unwrap();

    (StatusCode::OK, Json(the_chosen_one.clone()))
}


