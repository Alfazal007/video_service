use crate::{
    middlewares::auth_middleware::UserData, responses::general_errors::GeneralErrors, AppState,
};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};

pub async fn get_current_user(req: HttpRequest, _: web::Data<AppState>) -> impl Responder {
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue talking to the database".to_string(),
        });
    }
    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();
    HttpResponse::Ok().json(user_data)
}
