use std::env;

use axum::{routing::{get, post}, Router};
use dotenv::dotenv;
use sqlx::{query_as, PgPool};


mod data;
mod handlers;

#[tokio::main]
async fn main() {

    dotenv().ok();

    let url = env::var("DATABASE_URL").unwrap();

    let db_connection = PgPool::connect(url.as_str()).await.unwrap();

    let state = data::AppState {
        db_connection: db_connection.clone(),
        token: "tmp".to_string()
    };


    let t: data::User = query_as!(data::User, "SELECT * FROM users;").fetch_one(&db_connection).await.unwrap();
    println!("{:?}", t);

    let app = Router::new()
                    .route("/challage/receive", get(handlers::request_challange))
                    .route("/challange/send/{id}",post(handlers::send_challange))
                    .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:7564").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}
