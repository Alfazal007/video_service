use sha1::{Digest, Sha1};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn generate_presigned_url(api_secret: &str, public_id: &str) -> (String, u64) {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();
    let string_to_sign = format!(
        "public_id={}&timestamp={}{}",
        public_id, timestamp, api_secret
    );
    let mut hasher = Sha1::new();
    hasher.update(string_to_sign);
    (hex::encode(hasher.finalize()), timestamp)
}
