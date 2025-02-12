use std::env;

use actix_web::{middleware::Logger, web, App, HttpServer};

pub mod routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().expect("Issue fetching the env variables");
    let _database_url = env::var("DATABASE_URL").expect("Database url not provided in the env");

    env_logger::Builder::new().parse_filters("info").init();

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(web::scope("/api/v1/user").route(
                "/create",
                web::post().to(crate::routes::user_controllers::create_user::create_user),
            ))
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
