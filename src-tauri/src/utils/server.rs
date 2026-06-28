use crate::{
    config::Config,
    core::{handle::Handle, node, project, tray},
    log_err, logging,
    process::AsyncHandler,
    utils::logging::Type,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::{convert::Infallible, net::SocketAddr};
use tauri::Emitter;
use tokio::net::TcpListener;
use warp::{Filter, http::StatusCode};

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

const EMBED_SERVER_ADDR: ([u8; 4], u16) = ([127, 0, 0, 1], 53333);

pub fn start_embed_server() {
    AsyncHandler::spawn(|| async move {
        logging!(info, Type::Server, "Start the embed server...");

        async fn notice_handler(message: Message) -> Result<impl warp::Reply, Infallible> {
            let event_name = match &message.source {
                Source::Current => "nvm-desktop://refresh-version-info",
                Source::Version => "nvm-desktop://refresh-version-info",
                Source::Project => "nvm-desktop://refresh-project-info",
            };

            AsyncHandler::spawn(move || async move {
                let Message {
                    source,
                    name,
                    version,
                } = message;
                match source {
                    Source::Current => {
                        if let Some(version) = version.as_ref() {
                            Config::node().await.edit_draft(|d| {
                                d.update_current(Some(version.clone()));
                            });
                            Config::node().await.apply();
                        }
                    }
                    Source::Version => {
                        let _ = node::fetch_installed_with_sync(None).await;
                    }
                    Source::Project => {
                        if let (Some(name), Some(version)) = (name.as_ref(), version.as_ref()) {
                            let _ = project::update_from_notice(name, version).await;
                        }
                    }
                };

                if let Some(window) = Handle::global().get_main_window() {
                    let _ = window.emit(event_name, &version);
                }

                log_err!(tray::Tray::global().update_part().await);
            });

            Ok(StatusCode::OK)
        }

        // Post `/notice`
        let routes = warp::path!("notice")
            .and(warp::post())
            .and(warp::body::json())
            .and_then(notice_handler);

        let addr = SocketAddr::from(EMBED_SERVER_ADDR);
        let listener = match TcpListener::bind(addr).await {
            Ok(listener) => listener,
            Err(err) => {
                logging!(
                    error,
                    Type::Server,
                    true,
                    "Failed to bind embedded server on http://{addr}: {err}"
                );
                return;
            }
        };

        logging!(info, Type::Server, true, "Listening on http://{addr}");

        warp::serve(routes).incoming(listener).run().await;
    });
}
