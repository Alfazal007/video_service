use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(serde::Serialize, FromRow, Debug)]
pub struct VideoModel {
    pub id: i32,
    pub creator_id: i32,
    pub title: String,
    pub final_url: String,
}
#[derive(Serialize, Deserialize, Debug, sqlx::Type, PartialEq)]
#[sqlx(type_name = "video_status", rename_all = "lowercase")]
pub enum VideoStatus {
    NoVideo,
    Transcoding,
    Published,
    Unlist,
}

#[derive(serde::Serialize, FromRow, Debug)]
pub struct VideoAllData {
    pub id: i32,
    pub creator_id: i32,
    pub title: String,
    pub final_url: String,
    pub status: VideoStatus,
}
