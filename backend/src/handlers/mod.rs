use std::str::FromStr;

use axum::{extract::{Path, State}, http::HeaderMap, Json};
use sqlx::query_as;
use uuid::Uuid;

use crate::data;


pub async fn request_challange(headers: HeaderMap, State(state): State<data::AppState>) -> Json<data::Quest> {
    let token = headers.get("user-id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
    let user: data::User = query_as!(data::User, "SELECT * FROM users WHERE id = $1;", id)
        .fetch_one(&state.db_connection)
        .await.unwrap();
    let points = user.points.unwrap();

    let challanges: data::Quest = query_as::<_, data::Quest>("SELECT * FROM quests WHERE required_points = $1")
        .bind(points)
        .fetch_one(&state.db_connection)
        .await.unwrap();

    println!("{:?}", challanges);
    Json(challanges)
}

pub async fn send_challange(headers: HeaderMap, State(state): State<data::AppState>, Path(quest_id): Path<Uuid>) {
    let token = headers.get("user-id").unwrap();
    let id: Uuid = token.to_str().unwrap().parse().unwrap();
}
