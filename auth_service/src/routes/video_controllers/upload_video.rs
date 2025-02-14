use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use validator::Validate;

use crate::{
    datatypes::video_metadata::VideoMetaData, middlewares::auth_middleware::UserData,
    model::videos::VideoModel, responses::general_errors::GeneralErrors, AppState,
};

pub async fn upload_video_meta_data(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    video_metadata: web::Json<VideoMetaData>,
) -> impl Responder {
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue talking to the database".to_string(),
        });
    }

    if let Err(e) = video_metadata.validate() {
        let mut validation_errors: Vec<String> = Vec::new();
        for (_, err) in e.field_errors().iter() {
            if let Some(message) = &err[0].message {
                validation_errors.push(message.clone().into_owned());
            }
        }
        if validation_errors.is_empty() {
            validation_errors.push("Invalid title".to_string())
        }
        return HttpResponse::BadRequest().json(
            crate::responses::validation_errors::ValidationErrors {
                errors: validation_errors,
            },
        );
    }

    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();

    let upload_video_metadata_res = sqlx::query_as::<_, VideoModel>(
        "insert into videos(creator_id, title) values($1, $2) returning *",
    )
    .bind(user_data.user_id)
    .bind(video_metadata.0.title)
    .fetch_optional(&app_state.database)
    .await;

    if upload_video_metadata_res.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue updating the database".to_string(),
        });
    }

    if upload_video_metadata_res.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrors {
            errors: "Check the data sent in again".to_string(),
        });
    }

    HttpResponse::Ok().json(upload_video_metadata_res.unwrap().unwrap())
}
