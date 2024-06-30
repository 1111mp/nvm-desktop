mod fs_utils;
mod node;
mod tarball;
mod zip;

pub use tarball::Tarball;
// pub use crate::zip::Zip;

/// Metadata describing whether an archive comes from a local or remote origin.
#[derive(Copy, Clone)]
pub enum Origin {
    Local,
    Remote,
}

pub trait Archive {
    // fn compressed_size(&self) -> u64;
    // fn uncompressed_size(&self) -> Option<u64>;

    // Unpacks the zip archive to the specified destination folder.
    // fn unpack(self: Box<Self>, dest: &Path, progress: &mut dyn FnMut(&(), usize)) -> Result<()>;

    // fn origin(&self) -> Origin;
}
