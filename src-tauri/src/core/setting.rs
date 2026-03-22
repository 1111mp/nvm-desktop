use crate::{
    config::{Config, ISettings, SharedDraft},
    core::handle,
    logging,
    utils::logging::Type,
};

use anyhow::Result;
use bitflags::bitflags;

pub async fn fetch_settings() -> Result<SharedDraft<ISettings>> {
    let draft = Config::settings().await;
    let data = draft.data_arc();
    Ok(data)
}

pub async fn patch_settings(patch: &ISettings, need_save_file: bool) -> Result<()> {
    Config::settings().await.edit_draft(|d| {
        d.patch_settings(patch);
    });

    let update_flags = determine_update_flags(patch);
    logging!(
        debug,
        Type::Setup,
        "Determined update flags: {:?}",
        update_flags
    );
    let process_flag_result: std::result::Result<(), anyhow::Error> = {
        process_terminated_flags(update_flags, patch).await?;
        Ok(())
    };

    if let Err(err) = process_flag_result {
        Config::settings().await.discard();
        return Err(err);
    }
    Config::settings().await.apply();
    if need_save_file {
        let settings_data = Config::settings().await.data_arc();
        logging!(debug, Type::Setup, "Saving Settings data to file...");
        settings_data.save_file().await?;
    }

    Ok(())
}

// Define update flags as bitflags for better performance
bitflags! {
  #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
  struct UpdateFlags: u16 {
        const DIRECTORY = 1 << 0;
        const LOCALE = 1 << 1;
     }
}

fn determine_update_flags(patch: &ISettings) -> UpdateFlags {
    let directory = &patch.directory;
    let locale = &patch.locale;

    let mut update_flags = UpdateFlags::empty();
    if directory.is_some() {
        update_flags.insert(UpdateFlags::DIRECTORY);
    }

    if locale.is_some() {
        update_flags.insert(UpdateFlags::LOCALE);
    }

    update_flags
}

async fn process_terminated_flags(update_flags: UpdateFlags, patch: &ISettings) -> Result<()> {
    // sync installed nodejs data when directory changes
    if update_flags.contains(UpdateFlags::DIRECTORY) {
        super::node::sync_installed(patch.directory.to_owned()).await?;
    }
    // update system tray
    if update_flags.contains(UpdateFlags::DIRECTORY | UpdateFlags::LOCALE) {
        handle::Handle::update_systray_part().await?;
    }

    Ok(())
}
