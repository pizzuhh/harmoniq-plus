use uuid::Uuid;



#[derive(Clone)]
pub struct AppState {
    pub db_connection: sqlx::PgPool,
    pub token: String,
}



#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Debug)]
pub struct User {
    pub id: Uuid,
    pub name: Option<String>,
    pub mail: Option<String>,
    pub password_hash: Option<String>,
    pub is_admin: Option<bool>,
    pub points: Option<i32>
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::Type, Debug)]
#[sqlx(type_name="quest_state")]
#[sqlx(rename_all="PascalCase")]
pub enum Progress {
    Verefied,
    Pending,
    Denied
}

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Debug)]
pub struct Quest {
    id: Uuid,
    progress: Option<Progress>,
    name: String,
    description: String,
    required_points: i32,
    points_received: i32,
    user_id: Option<Uuid>
}
