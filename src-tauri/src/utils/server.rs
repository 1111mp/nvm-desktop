use crate::{
    config::Config,
    core::{handle::Handle, node::refresh_installed, project::update_from_notice},
    log_err, logging,
    process::AsyncHandler,
    utils::logging::Type,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use tauri::Emitter;
use warp::{http::StatusCode, Filter};

#[derive(Debug, Clone, Deserialize, Serialize)]
struct Message {
    source: Source,
    name: Option<String>,
    version: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
enum Source {
    Current,
    Version,
    Project,
}

pub fn start_embed_server() {
    logging!(info, Type::Server, true, "Start the embed server...");

    AsyncHandler::spawn(|| async move {
        async fn notice_handler(message: Message) -> Result<impl warp::Reply, Infallible> {
            let event_name = match &message.source {
                Source::Current => "nvm-desktop://refresh-version-info",
                Source::Version => "nvm-desktop://refresh-version-info",
                Source::Project => "nvm-desktop://refresh-project-info",
            };

            AsyncHandler::spawn(move || async move {
                match &message.source {
                    Source::Current => {
                        if let Some(version) = &message.version {
                            let _ = Config::node().draft_mut().update_current(version);
                            Config::node().apply();
                        }
                    }
                    Source::Version => {
                        let _ = refresh_installed().await;
                    }
                    Source::Project => {
                        if let (Some(name), Some(version)) = (&message.name, &message.version) {
                            let _ = update_from_notice(name, version).await;
                        }
                    }
                };

                if let Some(window) = Handle::global().get_window() {
                    let _ = window.emit(event_name, &message.version);
                }

                log_err!(Handle::update_systray_part());
            });

            Ok(StatusCode::OK)
        }

        // Post `/notice`
        let routes = warp::path!("notice")
            .and(warp::post())
            .and(warp::body::json())
            .and_then(notice_handler);

        logging!(
            info,
            Type::Server,
            true,
            "Listening on http://127.0.0.1:53333"
        );

        warp::serve(routes).run(([127, 0, 0, 1], 53333)).await;
    });
}
