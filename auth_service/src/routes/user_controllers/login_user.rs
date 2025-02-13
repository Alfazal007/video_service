use actix_web::{
    cookie::{Cookie, SameSite},
    web, HttpResponse, Responder,
};
use bcrypt::verify;
use validator::Validate;

use crate::{
    datatypes::req_input::SignupData, model::users::UserModelWithPassword,
    responses::general_errors::GeneralErrors, AppState,
};

#[derive(serde::Serialize)]
struct LoginResponse {
    #[serde(rename = "userId")]
    user_id: i32,
    #[serde(rename = "accessToken")]
    access_token: String,
}

pub async fn login_user(
    data: web::Data<AppState>,
    sign_in_data: web::Json<SignupData>,
) -> impl Responder {
    if let Err(e) = sign_in_data.validate() {
        let mut validation_errors: Vec<String> = Vec::new();
        for (_, err) in e.field_errors().iter() {
            if let Some(message) = &err[0].message {
                validation_errors.push(message.clone().into_owned());
            }
        }
        if validation_errors.is_empty() {
            validation_errors.push("Invalid username".to_string())
        }
        return HttpResponse::BadRequest().json(
            crate::responses::validation_errors::ValidationErrors {
                errors: validation_errors,
            },
        );
    }

    let user_from_db_res =
        sqlx::query_as::<_, UserModelWithPassword>("select * from users where username=$1")
            .bind(&sign_in_data.0.username)
            .fetch_optional(&data.database)
            .await;
    if user_from_db_res.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue talking to the database".to_string(),
        });
    }

    if user_from_db_res.as_ref().unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrors {
            errors: "Issue finding the user in the database".to_string(),
        });
    }

    let is_password_ok = verify(
        &sign_in_data.0.password,
        &user_from_db_res
            .as_ref()
            .unwrap()
            .as_ref()
            .unwrap()
            .password,
    );

    if is_password_ok.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue validating the password".to_string(),
        });
    }
    if !is_password_ok.unwrap() {
        return HttpResponse::BadRequest().json(GeneralErrors {
            errors: "Wrong password".to_string(),
        });
    }

    let token_res = crate::helpers::generate_token::generate_token(
        &sign_in_data.0.username,
        user_from_db_res.as_ref().unwrap().as_ref().unwrap().id,
        &data.access_secret,
    );

    if token_res.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue generating the token".to_string(),
        });
    }

    let cookie1 = Cookie::build("accessToken", token_res.as_ref().unwrap())
        .path("/")
        .secure(true)
        .http_only(true)
        .same_site(SameSite::None)
        .finish();

    let cookie2 = Cookie::build(
        "userId",
        format!(
            "{}",
            user_from_db_res.as_ref().unwrap().as_ref().unwrap().id
        ),
    )
    .path("/")
    .secure(true)
    .http_only(true)
    .same_site(SameSite::None)
    .finish();

    HttpResponse::Ok()
        .cookie(cookie1)
        .cookie(cookie2)
        .json(LoginResponse {
            user_id: user_from_db_res.unwrap().unwrap().id,
            access_token: token_res.unwrap(),
        })
}
