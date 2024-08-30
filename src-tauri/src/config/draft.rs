use super::{IGroups, INode, IProjects, ISettings};
use parking_lot::{MappedMutexGuard, Mutex, MutexGuard};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct Draft<T: Clone + ToOwned> {
    inner: Arc<Mutex<(T, Option<T>)>>,
}

macro_rules! draft_define {
    ($id: ident) => {
        impl Draft<$id> {
            #[allow(unused)]
            pub fn data(&self) -> MappedMutexGuard<$id> {
                MutexGuard::map(self.inner.lock(), |guard| &mut guard.0)
            }

            pub fn latest(&self) -> MappedMutexGuard<$id> {
                MutexGuard::map(self.inner.lock(), |inner| {
                    if inner.1.is_none() {
                        &mut inner.0
                    } else {
                        inner.1.as_mut().unwrap()
                    }
                })
            }

            pub fn draft(&self) -> MappedMutexGuard<$id> {
                MutexGuard::map(self.inner.lock(), |inner| {
                    if inner.1.is_none() {
                        inner.1 = Some(inner.0.clone());
                    }

                    inner.1.as_mut().unwrap()
                })
            }

            pub fn apply(&self) -> Option<$id> {
                let mut inner = self.inner.lock();

                match inner.1.take() {
                    Some(draft) => {
                        let old_value = inner.0.to_owned();
                        inner.0 = draft.to_owned();
                        Some(old_value)
                    }
                    None => None,
                }
            }

            pub fn discard(&self) -> Option<$id> {
                let mut inner = self.inner.lock();
                inner.1.take()
            }
        }

        impl From<$id> for Draft<$id> {
            fn from(data: $id) -> Self {
                Draft {
                    inner: Arc::new(Mutex::new((data, None))),
                }
            }
        }
    };
}

draft_define!(IGroups);
draft_define!(INode);
draft_define!(IProjects);
draft_define!(ISettings);

#[test]
fn test_draft() {
    let settings = ISettings {
        enable_silent_start: Some(true),
        no_proxy: Some(false),
        ..ISettings::default()
    };

    println!("{:?}", settings);

    let draft = Draft::from(settings);

    assert_eq!(draft.data().enable_silent_start, Some(true));
    assert_eq!(draft.data().no_proxy, Some(false));

    let mut d = draft.draft();
    d.enable_silent_start = Some(false);
    d.no_proxy = Some(true);
    drop(d);

    assert_eq!(draft.data().enable_silent_start, Some(true));
    assert_eq!(draft.data().no_proxy, Some(false));

    assert_eq!(draft.draft().enable_silent_start, Some(false));
    assert_eq!(draft.draft().no_proxy, Some(true));

    assert_eq!(draft.latest().enable_silent_start, Some(false));
    assert_eq!(draft.latest().no_proxy, Some(true));

    assert!(draft.apply().is_some());
    assert!(draft.apply().is_none());

    assert_eq!(draft.data().enable_silent_start, Some(false));
    assert_eq!(draft.data().no_proxy, Some(true));

    assert_eq!(draft.draft().enable_silent_start, Some(false));
    assert_eq!(draft.draft().no_proxy, Some(true));
}
