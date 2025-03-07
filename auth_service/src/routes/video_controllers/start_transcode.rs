use std::time::Duration;

use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use rdkafka::producer::{FutureProducer, FutureRecord, Producer};
use validator::Validate;

use crate::{
    datatypes::video_metadata::VideoUploadUrl,
    helpers::check_resource_exists::check_resource_exists,
    middlewares::auth_middleware::UserData,
    model::videos::{VideoAllData, VideoStatus},
    responses::general_errors::GeneralErrors,
    AppState,
};

pub async fn start_transcode(
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

    let video_from_db_res =
        sqlx::query_as::<_, VideoAllData>("select * from videos where creator_id=$1 and id=$2")
            .bind(user_data.user_id)
            .bind(video_info.0.video_id)
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

    if video_from_db_res
        .as_ref()
        .unwrap()
        .as_ref()
        .unwrap()
        .creator_id
        != user_data.user_id
    {
        return HttpResponse::Forbidden().json(GeneralErrors {
            errors: "You are not the owner of the video".to_string(),
        });
    }

    if video_from_db_res.as_ref().unwrap().as_ref().unwrap().status != VideoStatus::NoVideo
        && video_from_db_res.as_ref().unwrap().as_ref().unwrap().status != VideoStatus::Transcoding
    {
        return HttpResponse::BadRequest().json(GeneralErrors {
            errors: "Video is already being processed or has completed processing".to_string(),
        });
    }

    let (video_uploaded, greater_than_360) = check_resource_exists(
        &app_state.cloudinary_key,
        &app_state.cloudinary_secret,
        &format!(
            "{}/{}",
            &user_data.user_id,
            video_from_db_res.as_ref().unwrap().as_ref().unwrap().id
        ),
    )
    .await;

    if !video_uploaded {
        return HttpResponse::BadRequest().json(GeneralErrors {
            errors: "Video not uploaded yet".to_string(),
        });
    }

    let user_id = user_data.user_id;
    let video_id = video_from_db_res.as_ref().unwrap().as_ref().unwrap().id;
    {
        let producer = &app_state.kafka_producer.lock().await;

        let kafka_res =
            publish_to_topics_transactionally(producer, user_id, video_id, greater_than_360).await;

        if kafka_res.is_err() {
            return HttpResponse::InternalServerError().json(GeneralErrors {
                errors: "Kafka is down, try again later".to_string(),
            });
        }
    }
    HttpResponse::Ok().json("Your video has been added to the queue to transode")
}

async fn publish_to_topics_transactionally(
    producer: &FutureProducer,
    user_id: i32,
    video_id: i32,
    greater_than_360: bool,
) -> Result<(), rdkafka::error::KafkaError> {
    producer.begin_transaction()?;

    let user_id_str = format!("{}", user_id);
    let video_id_str = format!("{}", video_id);

    let mut publish_attempts = vec![producer.send(
        FutureRecord::to("transcode_normal")
            .key(&user_id_str)
            .payload(&video_id_str),
        Duration::from_secs(2),
    )];

    publish_attempts.push(
        producer.send(
            FutureRecord::to("elastic_search")
                .key(&user_id_str)
                .payload(&video_id_str),
            Duration::from_secs(2),
        ),
    );

    if greater_than_360 {
        publish_attempts.push(
            producer.send(
                FutureRecord::to("transcode_480")
                    .key(&user_id_str)
                    .payload(&video_id_str),
                Duration::from_secs(2),
            ),
        )
    }

    for attempt in publish_attempts {
        match attempt.await {
            Ok(_) => continue,
            Err(e) => {
                producer.abort_transaction(Duration::from_secs(2))?;
                return Err(e.0);
            }
        }
    }

    producer.commit_transaction(Duration::from_secs(2))?;
    Ok(())
}
