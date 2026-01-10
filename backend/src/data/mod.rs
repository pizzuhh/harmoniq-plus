use std::sync::Arc;

use sqlx::types::chrono;
use tokio::sync::Mutex;
use uuid::Uuid;



#[derive(Clone)]
pub struct AppState {
    pub db_connection: sqlx::PgPool,
    pub weekly_challange: Arc<Mutex<Option<Quest>>>,
    pub last_week: Arc<Mutex<Option<u32>>>,
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Debug)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub mail: String,

    #[sqlx(default)]
    pub password_hash: String,

    pub is_admin: bool,
    pub points: i32,
    pub longest_streak: i32,
    pub current_streak: i32,
    pub last_active: chrono::NaiveDate,
    pub completed_weekly: Option<chrono::NaiveDate>,
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::Type, Debug)]
#[sqlx(type_name="quest_state")]
#[sqlx(rename_all="lowercase")]
pub enum Progress {
    Verified,
    Pending,
    Denied
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Debug, Clone)]
pub struct Quest {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub required_points: i32,
    pub points_received: i32,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct RegisterUser {
    pub name: String,
    pub email: String,
    pub password: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, sqlx::FromRow)]
pub struct PendingRequest {
    pub proof_path: Option<String>,
    pub id: Uuid
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct VerifyRequest {
    pub completed: bool,
}



#[derive(serde::Serialize, serde::Deserialize, Debug, sqlx::FromRow)]
pub struct PersonalChallange {
    pub id: Uuid,
    pub description: String,
    pub user_id: Uuid,
    pub name: String,
    pub category: String,
    pub priority: i32,
}
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct PersonalChallangeInput {
    pub description: String,
    pub name: String,
    pub category: String,
    pub priority: i32,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct DiaryInput {
    pub content: String,
    pub mood: String,
    pub date: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, sqlx::FromRow)]
pub struct DiaryData {
    pub id: Uuid,
    pub content: String,
    pub mood: String,
    pub date: chrono::NaiveDate,
    pub user_id: Uuid,
}