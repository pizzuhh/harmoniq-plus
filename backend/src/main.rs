use std::env;

use axum::{routing::get, Router};
use dotenv::dotenv;
use sqlx::{query_as, PgPool};


mod data;

async fn test() -> &'static str {
    return "ok";
}


struct AppState {

}

#[tokio::main]
async fn main() {

    dotenv().ok();

    let url = env::var("DATABASE_URL").unwrap();

    let db_connection = PgPool::connect(url.as_str()).await.unwrap();


    let t: data::User = query_as!(data::User, "SELECT * FROM users;").fetch_one(&db_connection).await.unwrap();
    println!("{:?}", t);

    let app = Router::new().route("/api", get(test));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:7564").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}
