//! Draft management module
//!
//! Provides a thread-safe draft mechanism with both committed and optional draft snapshots,
//! using `Arc<T>` and `RwLock`.
//!
//! Features:
//! - Zero-copy access to committed and draft snapshots
//! - In-place draft editing with copy-on-write semantics
//! - Async committed data modification with optimistic concurrency
//!
//! This file is directly copied from the GPL-3.0 licensed project:
//! https://github.com/clash-verge-rev/clash-verge-rev/tree/dev/crates/clash-verge-draft
//!
//! License: GPL-3.0 (this file is subject to GPL-3.0)
//! Your project is MIT licensed, but this file retains GPL-3.0 requirements.
//!
use parking_lot::RwLock;
use std::sync::Arc;

pub type SharedDraft<T> = Arc<T>;
type DraftInner<T> = (SharedDraft<T>, Option<SharedDraft<T>>);

/// Draft management: maintains both a committed snapshot and an optional draft snapshot.
/// Both are stored as `Arc<T>` for zero-copy sharing.
///
/// (committed_snapshot, optional_draft_snapshot)
#[derive(Debug)]
pub struct Draft<T> {
    inner: Arc<RwLock<DraftInner<T>>>,
}

impl<T: Clone> Draft<T> {
    /// Create a new Draft with initial committed data.
    #[inline]
    pub fn new(data: T) -> Self {
        Self {
            inner: Arc::new(RwLock::new((Arc::new(data), None))),
        }
    }

    /// Get the committed (official) snapshot as `Arc<T>`.
    /// Zero-copy: only clones the Arc, not the underlying data.
    #[inline]
    pub fn data_arc(&self) -> SharedDraft<T> {
        let guard = self.inner.read();
        Arc::clone(&guard.0)
    }

    /// Get the latest snapshot: returns the draft if it exists, otherwise returns the committed data.
    /// Zero-copy: only clones the Arc.
    #[inline]
    pub fn latest_arc(&self) -> SharedDraft<T> {
        let guard = self.inner.read();
        guard.1.clone().unwrap_or_else(|| Arc::clone(&guard.0))
    }

    /// Edit the draft in-place via a closure that receives `&mut T`.
    /// - Copy-on-write: if the draft is uniquely owned, modifies in-place without cloning.
    /// - Otherwise, `Arc::make_mut` performs a minimal clone of `T`.
    #[inline]
    pub fn edit_draft<F, R>(&self, f: F) -> R
    where
        F: FnOnce(&mut T) -> R,
    {
        let mut guard = self.inner.write();
        let mut draft_arc = guard.1.take().unwrap_or_else(|| Arc::clone(&guard.0));
        let data_mut = Arc::make_mut(&mut draft_arc);
        let result = f(data_mut);
        guard.1 = Some(draft_arc);
        result
    }

    /// Apply the draft: replace the committed data with the draft and clear the draft.
    #[inline]
    pub fn apply(&self) {
        let mut guard = self.inner.write();
        if let Some(d) = guard.1.take() {
            guard.0 = d;
        }
    }

    /// Discard the current draft without applying changes.
    #[inline]
    pub fn discard(&self) {
        let mut guard = self.inner.write();
        guard.1 = None;
    }

    /// Asynchronously modify the committed data by working on a cloned local copy.
    /// The async closure returns a new `T` (to replace the committed data) and a business result `R`.
    /// Ensures the committed data has not changed during the async operation (optimistic concurrency).
    #[inline]
    pub async fn with_data_modify<F, Fut, R>(&self, f: F) -> Result<R, anyhow::Error>
    where
        T: Send + Sync + 'static,
        F: FnOnce(T) -> Fut + Send,
        Fut: std::future::Future<Output = Result<(T, R), anyhow::Error>> + Send,
    {
        let (local, original_arc) = {
            let guard = self.inner.read();
            let arc = Arc::clone(&guard.0);
            ((*arc).clone(), arc)
        };
        let (new_local, res) = f(local).await?;
        let mut guard = self.inner.write();
        if !Arc::ptr_eq(&guard.0, &original_arc) {
            return Err(anyhow::anyhow!(
                "Optimistic lock failed: committed data changed during async operation"
            ));
        }
        guard.0 = Arc::from(new_local);
        Ok(res)
    }
}

impl<T: Clone> Clone for Draft<T> {
    fn clone(&self) -> Self {
        Self {
            inner: Arc::clone(&self.inner),
        }
    }
}
