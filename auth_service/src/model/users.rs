use sqlx::prelude::FromRow;

#[derive(serde::Serialize, FromRow, Debug)]
pub struct UserModel {
    pub id: i32,
    pub username: String,
}

#[derive(serde::Serialize, FromRow, Debug)]
pub struct UserModelWithPassword {
    pub id: i32,
    pub username: String,
    pub password: String,
}
