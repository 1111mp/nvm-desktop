mod current;
mod list;

use std::sync::Arc;
use std::sync::Mutex;
use std::time::Duration;
use std::time::Instant;

use serde::Deserialize;
use serde::Serialize;
use tokio::time;

pub use self::current::*;
pub use self::list::*;

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct ProgressData<'a> {
    pub source: &'a str,
    pub total: usize,
    pub transferred: usize,
}

pub struct Debouncer {
    duration: Duration,
    last_emit_time: Arc<Mutex<Instant>>,
}

impl Debouncer {
    pub fn new(duration: Duration) -> Self {
        Self {
            duration,
            last_emit_time: Arc::new(Mutex::new(Instant::now())),
        }
    }

    pub async fn debounce<F>(&self, callback: F)
    where
        F: Fn() + Send + 'static,
    {
        let now = Instant::now();
        let mut last_emit = self.last_emit_time.lock().unwrap();
        *last_emit = now;

        let last_emit_time = Arc::clone(&self.last_emit_time);
        let duration = self.duration;

        tokio::spawn(async move {
            time::sleep(duration).await;
            let last_emit = last_emit_time.lock().unwrap();
            if now == *last_emit {
                callback();
            }
        });
    }
}
