use std::env;

use axum::{routing::{get, post}, Router, middleware};
use dotenv::dotenv;
use axum::http::{Request, HeaderValue, Method, StatusCode, HeaderMap};
use axum::response::{Response, IntoResponse};
use axum::middleware::Next;
use axum::body::Body;
use sqlx::{query_as, PgPool};


mod data;
mod handlers;

#[tokio::main]
async fn main() {

    dotenv().ok();

    let url = env::var("DATABASE_URL").unwrap();

    let db_connection = PgPool::connect(url.as_str()).await.unwrap();

    let state = data::AppState {
        db_connection: db_connection.clone()
    };


    let t: data::User = query_as!(data::User, "SELECT * FROM users;").fetch_one(&db_connection).await.unwrap();

    println!("{:?}", t);

    async fn cors(req: Request<Body>, next: Next) -> impl IntoResponse {
        // Handle preflight
        if req.method() == Method::OPTIONS {
            let mut headers = HeaderMap::new();
            headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
            headers.insert("Access-Control-Allow-Methods", HeaderValue::from_static("GET,POST,OPTIONS"));
            headers.insert("Access-Control-Allow-Headers", HeaderValue::from_static("*"));
            return (StatusCode::OK, headers, "").into_response();
        }

        let mut res: Response = next.run(req).await;
        let headers = res.headers_mut();
        headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
        headers.insert("Access-Control-Allow-Methods", HeaderValue::from_static("GET,POST,OPTIONS"));
        headers.insert("Access-Control-Allow-Headers", HeaderValue::from_static("*"));
        res
    }

    let app = Router::new()
                    .route("/challange/receive", get(handlers::request_challange))
                    .route("/challange/send/{id}", post(handlers::send_challange))
                    .route("/api/register", post(handlers::register))
                    .route("/api/login", post(handlers::login))
                    .route("/admin/api/get_pending", get(handlers::get_pending_quest))
                    .route("/admin/api/verify_quest/{qid}", post(handlers::verify_quest))
                    .route("/api/get_weekly_question", get(handlers::get_weekly_quest))
                    .route("/api/send_form_points", post(handlers::send_form_points))
                    .route_layer(middleware::from_fn(cors))
                    .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:7564").await.unwrap();

    axum::serve(listener, app).await.unwrap();
}
