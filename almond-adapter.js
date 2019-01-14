/**
 * almond-adapter.js - Adapter that manages devices connected to Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const AlmondWebsocket = require('./almond-websocket');

const TAG = 'AlmondAdapter:';

let Adapter;
try {
	Adapter = require('../adapter');
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND') throw e;

	const gwa = require('gateway-addon');
	Adapter = gwa.Adapter;
}

// This will get set to the contents of package.json within loadAlmondAdapter(),
// at which point we can reference config values in the `moziot` section
let adapterManifest;

class AlmondAdapter extends Adapter {

	constructor(addonManager, packageName, websocketManager) {
		// TODO: Is the possibility of more than one Almond high enough to support?
		super(addonManager, 'AlmondAdapter', packageName);

		/**
		 * Properties reserved by superclass:
		 *
		 * manager
		 * id
		 * packageName
		 * name
		 * devices
		 * actions
		 * ready
		 */

		this.wsm = websocketManager;
		this.ready = true;

		console.log(TAG, 'initialized');
	}

	dump() {
		console.log(TAG);
		console.log('ready:', this.ready);
	}
}

function loadAlmondAdapter(addonManager, manifest, errorCallback) {
	console.log(TAG, 'loading...');
	console.log(manifest);

	adapterManifest = manifest;
	const c = manifest.moziot.config.AlmondLogin;

	// Attempt to open websocket, pass to adapter constructor or invoke errorCallback
	new AlmondWebsocket(c.ipAddress, c.username, c.password)
	.open()
	.then((ws) => {
		new AlmondAdapter(addonManager, manifest.name, ws);
	})
	.catch((e) => {
		errorCallback(manifest.id, e);
	});
}

module.exports = loadAlmondAdapter;
