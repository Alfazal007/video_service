use actix_web::{web, HttpResponse, Responder};
use validator::Validate;

use crate::{
    datatypes::req_input::SignupData, model::users::UserModel,
    responses::general_errors::GeneralErrors, AppState,
};

pub async fn create_user(
    data: web::Data<AppState>,
    sign_up_data: web::Json<SignupData>,
) -> impl Responder {
    if let Err(e) = sign_up_data.validate() {
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

    let existing_user = sqlx::query_as::<_, UserModel>(
        "select * from users 
         where username=$1",
    )
    .bind(&sign_up_data.0.username)
    .fetch_optional(&data.database)
    .await;

    if existing_user.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue talking to the database".to_string(),
        });
    }

    if existing_user.unwrap().is_some() {
        return HttpResponse::BadRequest().json(GeneralErrors {
            errors: "User with this username already exists".to_string(),
        });
    }

    let hashed_password_result = bcrypt::hash(&sign_up_data.0.password, 12);
    if hashed_password_result.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue hashing the password".to_string(),
        });
    }

    let new_user = sqlx::query_as::<_, UserModel>(
        "
    insert into users(username, password) values($1, $2) returning *",
    )
    .bind(&sign_up_data.0.username)
    .bind(hashed_password_result.unwrap())
    .fetch_optional(&data.database)
    .await;

    if new_user.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue creating new user".to_string(),
        });
    }

    if new_user.as_ref().unwrap().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrors {
            errors: "Issue creating new user".to_string(),
        });
    }

    HttpResponse::Ok().json(new_user.unwrap().unwrap())
}
