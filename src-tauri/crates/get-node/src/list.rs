use anyhow::Result;
use serde::de::DeserializeOwned;
use std::time::Duration;

use super::Proxy;

pub struct ListConfig {
    /// fetch mirror url
    pub mirror: Option<String>,

    /// disable proxy
    pub no_proxy: Option<bool>,

    /// proxy ip & port
    pub proxy: Option<Proxy>,

    /// timeout
    pub timeout: Option<Duration>,
}

pub async fn version_list<T>(config: ListConfig) -> Result<T>
where
    T: DeserializeOwned,
{
    let ListConfig {
        mirror,
        timeout,
        no_proxy,
        proxy,
    } = config;

    if mirror.is_none() {
        anyhow::bail!("mirror should not be null");
    }

    let mirror = mirror.unwrap();
    // timeout default value is `20s`
    let timeout = timeout.unwrap_or(Duration::from_millis(20000));
    let builder = match no_proxy {
        // disabled proxy
        // it's not work when `TUN` proxy mode on
        Some(_) => reqwest::ClientBuilder::new().use_rustls_tls().no_proxy(),
        None => match proxy {
            // proxy by user set
            // need with proxy
            Some(proxy) => {
                let mut builder = reqwest::ClientBuilder::new().use_rustls_tls().no_proxy();
                let proxy_scheme = format!("http://{}:{}", proxy.ip, proxy.port);
                if let Ok(proxy) = reqwest::Proxy::http(&proxy_scheme) {
                    builder = builder.proxy(proxy);
                }
                if let Ok(proxy) = reqwest::Proxy::https(&proxy_scheme) {
                    builder = builder.proxy(proxy);
                }
                if let Ok(proxy) = reqwest::Proxy::all(&proxy_scheme) {
                    builder = builder.proxy(proxy);
                }
                builder
            }
            // system proxy will be work
            None => reqwest::ClientBuilder::new().use_rustls_tls(),
        },
    };

    let list = builder
        .timeout(timeout)
        .build()?
        .get(format!("{}/index.json", &mirror))
        .send()
        .await?
        .json::<T>()
        .await?;

    Ok(list)
}
