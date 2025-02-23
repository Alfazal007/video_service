use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use validator::Validate;

use crate::{
    datatypes::video_metadata::VideoUploadUrl, helpers, middlewares::auth_middleware::UserData,
    model::videos::VideoModel, responses::general_errors::GeneralErrors, AppState,
};

use super::get_upload_url::UrlResponse;

pub async fn thumbnail_upload(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    video_info: web::Json<VideoUploadUrl>,
) -> impl Responder {
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue talking to the database".to_string(),
        });
    }

    if let Err(e) = video_info.validate() {
        let mut validation_errors: Vec<String> = Vec::new();
        for (_, err) in e.field_errors().iter() {
            if let Some(message) = &err[0].message {
                validation_errors.push(message.clone().into_owned());
            }
        }
        if validation_errors.is_empty() {
            validation_errors.push("Invalid video".to_string())
        }
        return HttpResponse::BadRequest().json(
            crate::responses::validation_errors::ValidationErrors {
                errors: validation_errors,
            },
        );
    }

    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();

    let video_from_db_res =
        sqlx::query_as::<_, VideoModel>("select * from videos where id=$1 and creator_id=$2")
            .bind(video_info.0.video_id)
            .bind(user_data.user_id)
            .fetch_optional(&app_state.database)
            .await;

    if video_from_db_res.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue talking to the database".to_string(),
        });
    }

    if video_from_db_res.as_ref().unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrors {
            errors: "Video not found".to_string(),
        });
    }

    let public_id = format!("{}/thumbnail/{}", user_data.user_id, video_info.0.video_id);
    let (thumbnail_upload_url, timestamp) = helpers::generate_presigned_url::generate_presigned_url(
        &app_state.cloudinary_secret,
        &public_id,
    );

    HttpResponse::Ok().json(UrlResponse {
        timestamp,
        signature: thumbnail_upload_url,
        public_id,
    })
}
