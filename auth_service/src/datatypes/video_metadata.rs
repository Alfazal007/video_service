use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct VideoMetaData {
    #[validate(length(
        min = 3,
        max = 250,
        message = "Video title should be between 3 and 250 length"
    ))]
    pub title: String,
}

#[derive(Validate, serde::Deserialize)]
pub struct VideoUploadUrl {
    #[serde(rename = "videoId")]
    #[validate(range(min = 1))]
    pub video_id: i32,
}
