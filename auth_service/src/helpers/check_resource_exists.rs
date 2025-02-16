use base64::Engine;
use reqwest::{
    header::{HeaderMap, AUTHORIZATION, USER_AGENT},
    Client,
};

pub async fn check_resource_exists(api_key: &str, api_secret: &str, public_id: &str) -> bool {
    let client = Client::new();

    let auth_value = format!("{}:{}", api_key, api_secret);
    let auth_encoded = base64::engine::general_purpose::STANDARD.encode(auth_value);
    let auth_header_value = format!("Basic {}", auth_encoded);
    let url = format!(
        "https://api.cloudinary.com/v1_1/itachinftvr/resources/video/upload/{}",
        public_id
    );

    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, auth_header_value.parse().unwrap());
    headers.insert(USER_AGENT, "Rust-Client/1.0".parse().unwrap());

    let response = client.get(url).headers(headers).send().await;
    if response.is_err() {
        return false;
    }

    if response.unwrap().status() == 200 {
        return true;
    }

    false
}
