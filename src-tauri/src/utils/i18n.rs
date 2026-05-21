#[derive(Debug)]
pub enum Locale {
    En,
    ZhCn,
    Pl,
}

impl Locale {
    pub fn from_str(locale: Option<&str>) -> Self {
        match locale {
            Some("zh-CN") => Locale::ZhCn,
            Some("pl") => Locale::Pl,
            _ => Locale::En,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Locale::En => "en",
            Locale::ZhCn => "zh-CN",
            Locale::Pl => "pl",
        }
    }
}

fn tr_en(key: &str) -> &str {
    match key {
        "menu.open_config_dir" => "Config Dir",
        "menu.open_data_dir" => "Data Dir",
        "menu.open_logs_dir" => "Logs Dir",
        "menu.open_dir" => "Open Dir",
        "menu.open_dev_tools" => "Open Dev Tools",
        "menu.about" => "About NVM-Desktop",
        "menu.quit" => "Quit NVM-Desktop",
        _ => key,
    }
}

fn tr_zh_cn(key: &str) -> &str {
    match key {
        "menu.open_config_dir" => "配置目录",
        "menu.open_data_dir" => "数据目录",
        "menu.open_logs_dir" => "日志目录",
        "menu.open_dir" => "打开目录",
        "menu.open_dev_tools" => "打开开发者工具",
        "menu.about" => "关于 NVM-Desktop",
        "menu.quit" => "退出 NVM-Desktop",
        _ => key,
    }
}

fn tr_pl(key: &str) -> &str {
    match key {
        "menu.open_config_dir" => "Katalog konfiguracyjny",
        "menu.open_data_dir" => "Katalog danych",
        "menu.open_logs_dir" => "Katalog logów",
        "menu.open_dir" => "Otwórz katalog",
        "menu.open_dev_tools" => "Otwórz narzędzia deweloperskie",
        "menu.about" => "O NVM-Desktop",
        "menu.quit" => "Zamknij NVM-Desktop",
        _ => key,
    }
}

pub fn tr<'a>(locale: &Locale, key: &'a str) -> &'a str {
    match locale {
        Locale::En => tr_en(key),
        Locale::ZhCn => tr_zh_cn(key),
        Locale::Pl => tr_pl(key),
    }
}
