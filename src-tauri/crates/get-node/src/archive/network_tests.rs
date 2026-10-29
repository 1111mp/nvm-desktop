//! Exercise the real HTTP/checksum/extraction pipeline without downloading Node
//! or touching a user's installation directory.
use super::*;
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
};

async fn fixture_archive(root: &str) -> Vec<u8> {
    let payload = b"test node executable";
    let mut header = [0_u8; 512];
    let name = format!("{root}/bin/node");
    header[..name.len()].copy_from_slice(name.as_bytes());
    header[100..108].copy_from_slice(b"0000755\0");
    header[108..116].copy_from_slice(b"0000000\0");
    header[116..124].copy_from_slice(b"0000000\0");
    header[124..136].copy_from_slice(format!("{:011o}\0", payload.len()).as_bytes());
    header[136..148].copy_from_slice(b"00000000000\0");
    header[148..156].fill(b' ');
    header[156] = b'0';
    header[257..263].copy_from_slice(b"ustar\0");
    header[263..265].copy_from_slice(b"00");
    let checksum: u32 = header.iter().map(|byte| u32::from(*byte)).sum();
    header[148..156].copy_from_slice(format!("{checksum:06o}\0 ").as_bytes());
    let mut tar = header.to_vec();
    tar.extend_from_slice(payload);
    tar.resize(2048, 0);
    let mut encoder = async_compression::tokio::bufread::GzipEncoder::new(&tar[..]);
    let mut archive = Vec::new();
    encoder.read_to_end(&mut archive).await.unwrap();
    archive
}

#[tokio::test]
async fn two_real_downloads_overlap_and_install_verified_archives() {
    let _serial = TEST_PIPELINE.lock().await;
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let mirror = format!("http://{}", listener.local_addr().unwrap());
    let mut responses = std::collections::HashMap::new();
    for version in ["22.0.1", "22.0.2"] {
        let (root, filename) = node::Node::archive_filename(
            &node_semver::Version::parse(version).unwrap(),
            Some("x64".into()),
        );
        let archive = fixture_archive(&root).await;
        let hash = hex::encode(Sha256::digest(&archive));
        responses.insert(format!("/v{version}/{filename}"), archive);
        responses.insert(
            format!("/v{version}/SHASUMS256.txt"),
            format!("{hash}  {filename}\n").into_bytes(),
        );
    }
    let responses = Arc::new(responses);
    let active = Arc::new(AtomicUsize::new(0));
    let peak = Arc::new(AtomicUsize::new(0));
    let server_peak = peak.clone();
    let server = tokio::spawn(async move {
        loop {
            let (mut stream, _) = listener.accept().await.unwrap();
            let responses = responses.clone();
            let active = active.clone();
            let peak = server_peak.clone();
            tokio::spawn(async move {
                let mut request = [0_u8; 2048];
                let read = stream.read(&mut request).await.unwrap();
                let request = String::from_utf8_lossy(&request[..read]);
                let path = request.split_whitespace().nth(1).unwrap();
                let body = responses.get(path).unwrap();
                let archive = path.ends_with(".tar.gz");
                if archive {
                    let current = active.fetch_add(1, Ordering::SeqCst) + 1;
                    peak.fetch_max(current, Ordering::SeqCst);
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    body.len()
                );
                stream.write_all(response.as_bytes()).await.unwrap();
                stream.write_all(body).await.unwrap();
                if archive {
                    active.fetch_sub(1, Ordering::SeqCst);
                }
            });
        }
    });
    let directory = std::env::temp_dir().join(format!(
        "nvmd-parallel-fixture-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    tokio::fs::create_dir_all(&directory).await.unwrap();
    let install = |version: &str| {
        let events = Arc::new(Mutex::new(Vec::new()));
        let capture = events.clone();
        let config = FetchConfig {
            dest: directory.to_string_lossy().into_owned(),
            mirror: mirror.clone(),
            version: version.into(),
            arch: Some("x64".into()),
            proxy: None,
            no_proxy: Some(true),
            connect_timeout: Some(Duration::from_secs(2)),
            read_timeout: Some(Duration::from_secs(2)),
            cancel_signal: None,
            on_progress: Box::new(move |source, _, _| {
                capture.lock().unwrap().push(source.to_owned());
            }),
        };
        async move { (fetch_native(config).await, events) }
    };
    let (first, second) = tokio::join!(install("22.0.1"), install("22.0.2"));
    server.abort();
    for (result, events) in [first, second] {
        let path = result.unwrap();
        assert_eq!(
            tokio::fs::read(Path::new(&path).join("bin/node"))
                .await
                .unwrap(),
            b"test node executable"
        );
        let events = events.lock().unwrap();
        for stage in ["download", "verify", "waiting-extract", "unzip"] {
            assert!(events.iter().any(|event| event == stage));
        }
    }
    assert_eq!(peak.load(Ordering::SeqCst), 2);
    tokio::fs::remove_dir_all(directory).await.unwrap();
}
