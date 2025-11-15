use uuid::Uuid;



#[derive(Clone)]
pub struct AppState {
    pub db_connection: sqlx::PgPool,
}



#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Debug)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub mail: String,
    pub password_hash: String,
    pub is_admin: bool,
    pub points: i32
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::Type, Debug)]
#[sqlx(type_name="quest_state")]
#[sqlx(rename_all="lowercase")]
pub enum Progress {
    Verefied,
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

#[derive(serde::Serialize, serde::Deserialize, Debug, sqlx::FromRow)]
pub struct UserQuests {
    pub id: Uuid,
    pub quest_id: Uuid,
    pub user_ud: Uuid,
    pub proof_path: Option<String>,
}


#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct VerifyRequest {
    pub completed: bool,
}
