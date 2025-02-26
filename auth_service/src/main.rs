use std::{
    env,
    fs::{self},
    sync::Arc,
    time::Duration,
};

use actix_web::{
    middleware::{from_fn, Logger},
    web, App, HttpServer,
};
use cloudinary::upload::Upload;
use elasticsearch::{
    cert::Certificate,
    http::transport::{SingleNodeConnectionPool, TransportBuilder},
    Elasticsearch,
};
use rdkafka::{
    producer::{FutureProducer, Producer},
    ClientConfig,
};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use tokio::sync::Mutex;
use url::Url;

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
    pub cloudinary_config: Arc<Upload>,
    pub cloudinary_secret: String,
    pub cloudinary_key: String,
    pub kafka_producer: Arc<Mutex<FutureProducer>>,
    pub elastic_search: Elasticsearch,
    pub credentials: String,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().expect("Issue fetching the env variables");
    let database_url = env::var("DATABASE_URL").expect("Database url not provided in the env");
    let access_token_secret =
        env::var("ACCESS_TOKEN_SECRET").expect("Access token secret not provided in the env");
    let cloudinary_cloud_name =
        env::var("CLOUDINARY_CLOUD_NAME").expect("Cloudinary cloud name not provided in the env");
    let cloudinary_api_key =
        env::var("CLOUDINARY_API_KEY").expect("Cloudinary api key not provided in the env");
    let cloudinary_api_secret =
        env::var("CLOUDINARY_API_SECRET").expect("Cloudinary api secret not provided in the env");
    let kafka_url = env::var("KAFKA_URL").expect("Kafka url not provided in the env");
    let elastic_search_url =
        env::var("ELASTIC_SEARCH_URL").expect("Elastic search url not provided");
    let elastic_search_username =
        env::var("ELASTIC_SEARCH_USERNAME").expect("Elastic search username not provided");
    let elastic_search_password =
        env::var("ELASTIC_SEARCH_PASSWORD").expect("Elastic search password not provided");

    let elastic_search_creds = format!("{}:{}", elastic_search_username, elastic_search_password);

    let parsed_elastic_search_url =
        Url::parse(&elastic_search_url).expect("Invalid elastic search url");

    let conn_pool = SingleNodeConnectionPool::new(parsed_elastic_search_url);

    let cert_data = fs::read("./certer.crt").expect("Issue reading the certificate file");

    let transport = TransportBuilder::new(conn_pool)
        .cert_validation(elasticsearch::cert::CertificateValidation::Certificate(
            Certificate::from_pem(&cert_data).expect("Some error with the certificate"),
        ))
        .disable_proxy()
        .build()
        .expect("Issue setting up transporter for elastic search");
    let elastic_search_client = Elasticsearch::new(transport);

    let cloudinary_config = Arc::new(Upload::new(
        cloudinary_api_key.clone(),
        cloudinary_cloud_name,
        cloudinary_api_secret.clone(),
    ));

    env_logger::Builder::new().parse_filters("info").init();

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Issue connecting to the database");

    let kafka_producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", kafka_url)
        .set("transactional.id", &access_token_secret)
        .create()
        .expect("Producer creation failed");

    let _ = kafka_producer.init_transactions(Duration::from_secs(5));

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(AppState {
                database: pool.clone(),
                access_secret: access_token_secret.clone(),
                cloudinary_config: cloudinary_config.clone(),
                cloudinary_secret: cloudinary_api_secret.clone(),
                cloudinary_key: cloudinary_api_key.clone(),
                kafka_producer: Arc::new(Mutex::new(kafka_producer.clone())),
                elastic_search: elastic_search_client.clone(),
                credentials: elastic_search_creds.clone(),
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
                            web::post()
                                .to(routes::video_controllers::get_upload_url::get_upload_url),
                        )
                        .route(
                            "/transcode",
                            web::post()
                                .to(routes::video_controllers::start_transcode::start_transcode),
                        )
                        .route(
                            "/thumbnail",
                            web::post()
                                .to(routes::video_controllers::thumbnail_upload::thumbnail_upload),
                        ),
                ),
            )
            .service(web::scope("/api/v1/search").route(
                "/searchbar/{search_item}",
                web::get().to(
                    routes::elasticsearch_controllers::search_bar_controller::search_bar_controller,
                ),
            ).route("/searchlist/{search_item}", web::get().to(
                    routes::elasticsearch_controllers::search_list::search_list_controller,
                ))
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
