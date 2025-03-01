use actix_web::{web, HttpResponse, Responder};

use crate::{model::videos::VideoModel, responses::general_errors::GeneralErrors, AppState};

pub async fn get_video(
    app_state: web::Data<AppState>,
    path: web::Path<(i32, i32)>,
) -> impl Responder {
    println!("\n\n\n REQUEST IN  \n\n\n");
    let (creator_id, video_id) = path.to_owned();
    let video_from_db_res =
        sqlx::query_as::<_, VideoModel>
        ("select * from videos where id=$1 and creator_id=$2 and (normal_done=TRUE or foureighty_done=TRUE)")
        .bind(video_id)
        .bind(creator_id)
        .fetch_optional(&app_state.database)
        .await;
    println!("{:?}", video_from_db_res);

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
    HttpResponse::Ok().json(video_from_db_res.unwrap().unwrap())
}
