import fetch from 'node-fetch';
import { getOctokit, context } from '@actions/github';
import { resolveUpdateLog } from './updatelog.mjs';

const UPDATE_TAG_NAME = 'updater';
const UPDATE_JSON_FILE = 'update-fixed-webview2.json';

/// generate update.json
/// upload to update tag's release asset
async function resolveUpdater() {
	if (process.env.GITHUB_TOKEN === undefined) {
		throw new Error('GITHUB_TOKEN is required');
	}

	const options = { owner: context.repo.owner, repo: context.repo.repo };
	const github = getOctokit(process.env.GITHUB_TOKEN);

	const { data: tags } = await github.rest.repos.listTags({
		...options,
		per_page: 10,
		page: 1,
	});

	// get the latest publish tag
	const tag = tags.find((t) => t.name.startsWith('v'));

	console.log(tag);
	console.log();

	const { data: latestRelease } = await github.rest.repos.getReleaseByTag({
		...options,
		tag: tag.name,
	});
	console.log('latestRelease:', latestRelease);

	let notes = '';
	try {
		// use updatelog.md
		notes = await resolveUpdateLog(tag.name);
	} catch (err) {
		console.error(`Resolve update log [ERROR]: `, err.message);
	}

	const updateData = {
		name: tag.name,
		notes,
		pub_date: new Date().toISOString(),
		platforms: {
			'windows-x86_64': { signature: '', url: '' },
			'windows-aarch64': { signature: '', url: '' },
		},
	};

	const promises = latestRelease.assets.map(async (asset) => {
		const { name, browser_download_url } = asset;

		// win64 url
		if (name.endsWith('x64_fixed_webview2-setup.exe')) {
			updateData.platforms['windows-x86_64'].url = browser_download_url;
		}
		// win64 signature
		if (name.endsWith('x64_fixed_webview2-setup.exe.sig')) {
			const sig = await getSignature(browser_download_url);
			updateData.platforms['windows-x86_64'].signature = sig;
		}

		// win arm url
		if (name.endsWith('arm64_fixed_webview2-setup.exe')) {
			updateData.platforms['windows-aarch64'].url = browser_download_url;
		}
		// win arm signature
		if (name.endsWith('arm64_fixed_webview2-setup.exe.sig')) {
			const sig = await getSignature(browser_download_url);
			updateData.platforms['windows-aarch64'].signature = sig;
		}
	});

	await Promise.allSettled(promises);
	console.log('updateData', updateData);

	// maybe should test the signature as well
	// delete the null field
	Object.entries(updateData.platforms).forEach(([key, value]) => {
		if (!value.url) {
			console.log(`[Error]: failed to parse release for "${key}"`);
			delete updateData.platforms[key];
		}
	});

	// update the update.json
	const { data: updateRelease } = await github.rest.repos.getReleaseByTag({
		...options,
		tag: UPDATE_TAG_NAME,
	});

	// delete the old assets
	for (let asset of updateRelease.assets) {
		if (asset.name === UPDATE_JSON_FILE) {
			await github.rest.repos.deleteReleaseAsset({
				...options,
				asset_id: asset.id,
			});
		}
	}

	// upload new assets
	await github.rest.repos.uploadReleaseAsset({
		...options,
		release_id: updateRelease.id,
		name: UPDATE_JSON_FILE,
		data: JSON.stringify(updateData, null, 2),
	});
}

// get the signature file content
async function getSignature(url) {
	const response = await fetch(url, {
		method: 'GET',
		headers: { 'Content-Type': 'application/octet-stream' },
	});

	return response.text();
}

resolveUpdater().catch(console.error);
