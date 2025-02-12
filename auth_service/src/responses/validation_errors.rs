#[derive(serde::Serialize)]
pub struct ValidationErrors {
    pub errors: Vec<String>,
}
