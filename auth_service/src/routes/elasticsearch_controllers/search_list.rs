use crate::AppState;
use actix_web::{web, HttpResponse, Responder};
use base64::{engine::general_purpose, Engine as _};
use elasticsearch::SearchParts;
use reqwest::header::{HeaderValue, AUTHORIZATION};
use serde_json::Value;

#[derive(serde::Serialize)]
struct SearchItems {
    video_id: i64,
    creator_id: i64,
    title: String,
}

pub async fn search_list_controller(
    app_state: web::Data<AppState>,
    path: web::Path<String>,
) -> impl Responder {
    let search_text = path.into_inner();
    if search_text.is_empty() {
        return HttpResponse::BadRequest().json(());
    }

    let query = serde_json::json!({
        "query": {
            "multi_match": {
                "query": search_text,
                "type": "best_fields",
                "fields": ["title", "title.fuzzy"],
                "fuzziness": "AUTO"
            }
        }
    });

    let credentials = general_purpose::STANDARD.encode(&app_state.credentials);
    let auth_header = format!("Basic {}", credentials);

    let response = app_state
        .elastic_search
        .search(SearchParts::Index(&["videos"]))
        .header(AUTHORIZATION, HeaderValue::from_str(&auth_header).unwrap())
        .body(query)
        .send()
        .await;

    if response.is_err() {
        return HttpResponse::InternalServerError().json(());
    }

    let response_body: serde_json::Value = response.unwrap().json().await.unwrap();
    let mut res_list = Vec::new();

    if let Some(hits) = response_body["hits"]["hits"].as_array() {
        for hit in hits {
            if let Some(source) = hit["_source"].as_object() {
                let creator_id = source
                    .get("creator_id")
                    .and_then(Value::as_i64)
                    .unwrap_or_default();
                let video_id = source.get("id").and_then(Value::as_i64).unwrap_or_default();
                let title = source
                    .get("title")
                    .and_then(Value::as_str)
                    .unwrap_or("Unknown Title");
                res_list.push(SearchItems {
                    video_id,
                    title: title.to_string(),
                    creator_id,
                });
            }
        }
    }
    HttpResponse::Ok().json(res_list)
}
