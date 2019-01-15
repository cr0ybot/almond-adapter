/**
 * almond-adapter.js - Adapter that manages devices connected to Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondAdapter:';

const AlmondController = require('./almond-controller');

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

	constructor(addonManager, packageName, controller) {
		// TODO: Is it worth supporting multiple Almonds?
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

		this.controller = controller;
		this.ready = true;

		this.pairingMii = null;
		this.pairingTimer = null;

		this.manager.addAdapter(this);

		console.log(TAG, 'initialized');
	}

	dump() {
		console.log(TAG);
		console.log('ready:', this.ready);
	}

	addAllDevices(deviceList) {
		console.log(TAG, 'adding devices...');

		for (const id of Object.keys(deviceList)) {
			console.log(TAG, 'found device:', id);
			console.log(JSON.stringify(deviceList[id].Data));
		}
	}

	startPairing(timeoutSeconds) {
		console.log(TAG, 'starting pairing mode');

		this.controller.getDeviceList()
		.then((deviceList) => {
			clearTimeout(this.pairingTimer);

			this.addAllDevices(deviceList);
		});

		this.pairingTimer = setTimeout(this.cancelPairing, timeoutSeconds * 1000);
	}

	cancelPairing() {
		clearTimeout(this.pairingTimer);

		console.log(TAG, 'cancelling pairing mode');
		this.controller.cancelGetDeviceList();
	}

	unload() {
		return this.controller.disconnect()
		.then(() => {
			this.controller = null;
		});
	}
}

function loadAlmondAdapter(addonManager, manifest, errorCallback) {
	console.log(TAG, 'loading...');
	console.log(manifest);

	adapterManifest = manifest;
	const c = manifest.moziot.config.AlmondLogin;

	// Attempt to start controller, pass to adapter constructor
	// or invoke errorCallback
	new AlmondController(c)
	.connect()
	.catch((e) => {
		errorCallback(manifest.id, e);
	})
	.then((controller) => {
		new AlmondAdapter(addonManager, manifest.name, controller);
	});
}

module.exports = loadAlmondAdapter;
