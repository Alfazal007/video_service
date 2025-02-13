use actix_web::{
    body::BoxBody,
    dev::{ServiceRequest, ServiceResponse},
    middleware::Next,
    web::Data,
    Error, HttpMessage, HttpResponse,
};
use serde::Serialize;

use crate::{responses::general_errors::GeneralErrors, AppState};

#[derive(Serialize)]
pub struct UserData {
    pub username: String,
    pub user_id: i32,
}

pub async fn auth_middleware(
    req: ServiceRequest,
    next: Next<BoxBody>,
) -> Result<ServiceResponse<impl actix_web::body::MessageBody>, Error> {
    if req.cookie("accessToken").is_none() {
        let error_response = HttpResponse::Unauthorized().json(GeneralErrors {
            errors: "Unauthorized: Missing accessToken cookie".to_string(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }
    if req.cookie("userId").is_none() {
        let error_response = HttpResponse::Unauthorized().json(GeneralErrors {
            errors: "Unauthorized: Missing userId cookie".to_string(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }

    let state = match req.app_data::<Data<AppState>>() {
        Some(data) => data,
        None => {
            let error_response = HttpResponse::InternalServerError().json(GeneralErrors {
                errors: "Failed to retrieve application state".to_string(),
            });
            return Ok(req.into_response(error_response.map_into_boxed_body()));
        }
    };

    let token = req.cookie("accessToken").unwrap().value().to_string();
    let token_eval_result =
        crate::helpers::validate_token::validate_token(&token, &state.access_secret);

    if token_eval_result.is_err() {
        let error_response = HttpResponse::Unauthorized().json(GeneralErrors {
            errors: token_eval_result.unwrap_err(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }

    let claims = token_eval_result.unwrap();

    let user_exists = crate::dbcalls::check_user_exists::check_user_exists(
        claims.user_id,
        &claims.username,
        state,
    )
    .await;

    match user_exists {
        Err(err_string) => {
            let error_response =
                HttpResponse::BadRequest().json(GeneralErrors { errors: err_string });
            Ok(req.into_response(error_response.map_into_boxed_body()))
        }
        Ok(_) => {
            req.extensions_mut().insert(UserData {
                user_id: claims.user_id,
                username: claims.username,
            });

            next.call(req).await
        }
    }
}
