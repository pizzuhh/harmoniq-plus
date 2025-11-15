use uuid::Uuid;

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow, Debug)]
pub struct User {
    pub id: Uuid,
    pub name: Option<String>,
    pub mail: Option<String>,
    pub password_hash: Option<String>,
    pub is_admin: Option<bool>,
    pub points: Option<i32>
}
