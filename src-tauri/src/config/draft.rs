use parking_lot::{
    MappedRwLockReadGuard, MappedRwLockWriteGuard, RwLock, RwLockReadGuard,
    RwLockUpgradableReadGuard, RwLockWriteGuard,
};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct Draft<T: Clone + ToOwned> {
    inner: Arc<RwLock<(T, Option<T>)>>,
}

impl<T: Clone + ToOwned> From<T> for Draft<T> {
    fn from(data: T) -> Self {
        Self {
            inner: Arc::new(RwLock::new((data, None))),
        }
    }
}

/// Implements draft management for `Box<T>`, allowing for safe concurrent editing and committing of draft data.
/// # Type Parameters
/// - `T`: The underlying data type, which must implement `Clone` and `ToOwned`.
///
/// # Methods
/// - `data_mut`: Returns a mutable reference to the committed data.
/// - `data_ref`: Returns an immutable reference to the committed data.
/// - `draft_mut`: Creates or retrieves a mutable reference to the draft data, cloning the committed data if no draft exists.
/// - `latest_ref`: Returns an immutable reference to the draft data if it exists, otherwise to the committed data.
/// - `apply`: Commits the draft data, replacing the committed data and returning the old committed value if a draft existed.
/// - `discard`: Discards the draft data and returns it if it existed.
impl<T: Clone + ToOwned> Draft<Box<T>> {
    /// can write formal data
    pub fn data_mut(&self) -> MappedRwLockWriteGuard<'_, Box<T>> {
        RwLockWriteGuard::map(self.inner.write(), |inner| &mut inner.0)
    }

    /// Returns a read-only view of the official data (excluding drafts)
    pub fn data_ref(&self) -> MappedRwLockReadGuard<'_, Box<T>> {
        RwLockReadGuard::map(self.inner.read(), |inner| &inner.0)
    }

    /// Creates or gets a draft and returns a writable reference
    pub fn draft_mut(&self) -> MappedRwLockWriteGuard<'_, Box<T>> {
        let guard = self.inner.upgradable_read();
        if guard.1.is_none() {
            let mut guard = RwLockUpgradableReadGuard::upgrade(guard);
            guard.1 = Some(guard.0.clone());
            return RwLockWriteGuard::map(guard, |inner| inner.1.as_mut().unwrap());
        }
        // A draft already exists, upgrade to write lock mapping
        RwLockWriteGuard::map(RwLockUpgradableReadGuard::upgrade(guard), |inner| {
            inner.1.as_mut().unwrap()
        })
    }

    /// Zero-copy read-only view: returns the draft (if any) or the official value
    pub fn latest_ref(&self) -> MappedRwLockReadGuard<'_, Box<T>> {
        RwLockReadGuard::map(self.inner.read(), |inner| {
            inner.1.as_ref().unwrap_or(&inner.0)
        })
    }

    /// Submit draft, return to old official data
    pub fn apply(&self) -> Option<Box<T>> {
        let mut inner = self.inner.write();
        inner
            .1
            .take()
            .map(|draft| std::mem::replace(&mut inner.0, draft))
    }

    /// Discard the draft and return the discarded draft
    pub fn discard(&self) -> Option<Box<T>> {
        self.inner.write().1.take()
    }
}

#[test]
fn test_draft_box() {
    use super::ISettings;

    // 1. Create Draft<Box<IVerge>>
    let verge = Box::new(ISettings {
        enable_silent_start: Some(true),
        no_proxy: Some(false),
        ..ISettings::default()
    });
    let draft = Draft::from(verge);

    // 2. Read formal data (data_mut)
    {
        let data = draft.data_mut();
        assert_eq!(data.enable_silent_start, Some(true));
        assert_eq!(data.no_proxy, Some(false));
    }

    // 3. Get the draft for the first time (draft_mut will automatically clone a copy)
    {
        let draft_view = draft.draft_mut();
        assert_eq!(draft_view.enable_silent_start, Some(true));
        assert_eq!(draft_view.no_proxy, Some(false));
    }

    // 4. Modify the draft
    {
        let mut d = draft.draft_mut();
        d.enable_silent_start = Some(false);
        d.no_proxy = Some(true);
    }

    // Official data remains unchanged
    assert_eq!(draft.data_mut().enable_silent_start, Some(true));
    assert_eq!(draft.data_mut().no_proxy, Some(false));

    // The draft has changed
    {
        let latest = draft.latest_ref();
        assert_eq!(latest.enable_silent_start, Some(false));
        assert_eq!(latest.no_proxy, Some(true));
    }

    // 5. Submit Draft
    assert!(draft.apply().is_some()); // The first submission should return
    assert!(draft.apply().is_none()); // The second submission returns None

    // Official data has been updated
    {
        let data = draft.data_mut();
        assert_eq!(data.enable_silent_start, Some(false));
        assert_eq!(data.no_proxy, Some(true));
    }

    // 6. Create and modify the next draft
    {
        let mut d = draft.draft_mut();
        d.enable_silent_start = Some(true);
    }
    assert_eq!(draft.draft_mut().enable_silent_start, Some(true));

    // 7. Discard Draft
    assert!(draft.discard().is_some()); // The first discard returns Some
    assert!(draft.discard().is_none()); // Discard again and return None

    // 8. The draft has been discarded, the new draft_mut() will re-clone
    assert_eq!(draft.draft_mut().enable_silent_start, Some(false));
}
