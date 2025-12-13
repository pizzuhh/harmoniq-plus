use std::{alloc::handle_alloc_error, env};

use axum::{Router, middleware, routing::{delete, get, options, post}};
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

    let api = Router::new()
        .route("/complete_challenge/{id}", post(handlers::complete_challenge))
        .route("/register", post(handlers::register))
        .route("/login", post(handlers::login))
        .route("/me", get(handlers::me))
        .route("/get_random_question", get(handlers::get_weekly_quest))
        .route("/send_form_points", post(handlers::send_form_points))
        .route("/get_weekly", get(handlers::get_weekly))
        .route("/wheel/challenges", get(handlers::get_wheel_challanges))
        .route("/wheel/spin", get(handlers::wheel_spin))
        .route("/streak", get(handlers::get_streak))
        .route("/pchallange/create", post(handlers::pchallange_create))
        .route("/pchallange/get", get(handlers::pchallange_get))
        .route("/pchallange/remove/{id}", delete(handlers::pchallange_delete))
        .route("/leaderboard", get(handlers::leaderboard));
    
    let admin = Router::new()
        .route("/api/get_pending", get(handlers::get_pending_quest))
        .route("/api/verify_quest/{qid}", post(handlers::verify_quest))
        .route_layer(middleware::from_fn_with_state(state.clone(), handlers::admin_check));


    let app = Router::new()
        .route("/", get(|| async {StatusCode::IM_A_TEAPOT}))
        .nest("/api", api)
        .nest("/admin", admin)
        .route("/challange/receive", get(handlers::request_challange))
        .route("/challange/send/{id}", post(handlers::send_challange))
        .route("/{*wildcard}", options(|| async { StatusCode::NO_CONTENT }))
        .layer(middleware::from_fn(cors))
        .with_state(state);

    let bind_str = "0.0.0.0:7564";
    let listener = tokio::net::TcpListener::bind(bind_str).await.unwrap();

    println!("Backed on: http://{}", bind_str);
    axum::serve(listener, app).await.unwrap();

}

async fn cors(req: Request<Body>, next: Next) -> impl IntoResponse {
    // Handle preflight
    if req.method() == Method::OPTIONS {
        let mut headers = HeaderMap::new();
        headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
        headers.insert("Access-Control-Allow-Methods", HeaderValue::from_static("GET,POST,OPTIONS,PUT,DELETE"));
        // Explicitly allow the custom header `user_id` and common headers
        headers.insert(
            "Access-Control-Allow-Headers",
            HeaderValue::from_static("Content-Type, Authorization, user_id"),
        );
        return (StatusCode::OK, headers, "").into_response();
    }

    let mut res: Response = next.run(req).await;
    let headers = res.headers_mut();
    headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
    headers.insert("Access-Control-Allow-Methods", HeaderValue::from_static("GET,POST,OPTIONS,PUT,DELETE"));
    headers.insert(
        "Access-Control-Allow-Headers",
        HeaderValue::from_static("Content-Type, Authorization, user_id"),
    );
    res
}