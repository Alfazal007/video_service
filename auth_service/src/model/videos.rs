use sqlx::prelude::FromRow;

#[derive(serde::Serialize, FromRow, Debug)]
pub struct VideoModel {
    pub id: i32,
    pub creator_id: i32,
    pub title: String,
    pub final_url: String,
}
