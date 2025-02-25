use actix_web::{web, Responder};

pub async fn search_bar_controller(path: web::Path<String>) -> impl Responder {
    let search_text = path.into_inner();
    println!("Thing to search is {:?}", search_text);
    "hello"
}
