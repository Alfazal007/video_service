use std::env;

use actix_web::{
    middleware::{from_fn, Logger},
    web, App, HttpServer,
};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

pub mod datatypes;
pub mod dbcalls;
pub mod helpers;
pub mod middlewares;
pub mod model;
pub mod responses;
pub mod routes;

pub struct AppState {
    pub database: Pool<Postgres>,
    pub access_secret: String,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().expect("Issue fetching the env variables");
    let database_url = env::var("DATABASE_URL").expect("Database url not provided in the env");
    let access_token_secret =
        env::var("ACCESS_TOKEN_SECRET").expect("Access token secret not provided in the env");

    env_logger::Builder::new().parse_filters("info").init();

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Issue connecting to the database");

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(AppState {
                database: pool.clone(),
                access_secret: access_token_secret.clone(),
            }))
            .service(
                web::scope("/api/v1/user")
                    .route(
                        "/create",
                        web::post().to(crate::routes::user_controllers::create_user::create_user),
                    )
                    .route(
                        "/login",
                        web::post().to(crate::routes::user_controllers::login_user::login_user),
                    )
                    .service(
                        web::scope("/protected")
                            .wrap(from_fn(middlewares::auth_middleware::auth_middleware))
                            .route(
                                "/currentUser",
                                web::get()
                                    .to(routes::user_controllers::current_user::get_current_user),
                            ),
                    ),
            )
            .service(
                web::scope("/api/v1/video").service(
                    web::scope("/protected")
                        .wrap(from_fn(middlewares::auth_middleware::auth_middleware))
                        .route(
                            "/newVideo",
                            web::post().to(
                                routes::video_controllers::upload_video::upload_video_meta_data,
                            ),
                        )
                        .route(
                            "/getVideoUploadUrl",
                            web::get()
                                .to(routes::video_controllers::get_upload_url::get_upload_url),
                        ),
                ),
            )
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
// https://ottverse.com/hls-packaging-using-ffmpeg-live-vod/
// https://github.com/leandromoreira/ffmpeg-libav-tutorial
// https://medium.com/@vladakuc/hls-video-streaming-from-opencv-and-ffmpeg-828ca80b4124
// https://www.mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg-a-step-by-step-guide
