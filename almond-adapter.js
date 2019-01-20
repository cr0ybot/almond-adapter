/**
 * almond-adapter.js - Adapter that manages devices connected to Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondAdapter:';

const {Adapter} = require('gateway-addon');

const AlmondClient = require('./almond-client');
const AlmondDevice = require('./almond-device');

// This will get set to the contents of package.json within loadAlmondAdapter(),
// at which point we can reference config values in the `moziot` section
let adapterManifest;

class AlmondAdapter extends Adapter {

	constructor(addonManager, packageName, client) {
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

		this.client = client;
		this.ready = true;

		this.pairingMii = null;
		this.pairingTimer = null;

		this.manager.addAdapter(this);

		console.log(TAG, 'initialized');
	}

	/**
	 * Dump adapter state to log
	 *
	 * @override
	 */
	dump() {
		console.log(TAG);
		console.log('ready:', this.ready);
	}

	/**
	 * Add a device to be managed by the adapter
	 *
	 * @param {String} deviceId
	 * @param {Object} deviceInfo Information about the device from the Almond
	 * @return {Promise} Promise to add device
	 */
	addDevice(deviceId, deviceInfo) {
		// I like promises, but not sure if it's necessary here
		return new Promise((resolve, reject) => {
			if (deviceId in this.devices) {
				console.warn(TAG, `adding device failed: ${deviceId} already exists!`);
				reject(`Device ${deviceId} already exists.`);
			}
			else {
				console.log(TAG, `adding device: ${deviceId} ${deviceInfo.Data.Name}`);
				const device = new AlmondDevice(this, deviceId, deviceInfo);
				this.handleDeviceAdded(device);
				resolve(device);
			}
		});
	}

	/**
	 * Remove device from being managed by the adapter
	 *
	 * @param {String} deviceId
	 * @return {Promise} Promise to remove the device
	 */
	removeDevice(deviceId) {
		return new Promise((resolve, reject) => {
			const device = this.devices[deviceId];
			if (device) {
				console.log(TAG, `removing device: ${deviceId} ${device.name}`);
				this.handleDeviceRemoved(device);
				resolve(device);
			}
			else {
				console.warn(TAG, `removing device failed: ${deviceId} doesn't exist!`);
				reject(`Device ${deviceId} not found.`);
			}
		});
	}

	/**
	 * Add all devices in the device list returned from the Almond
	 *
	 * @param {Object} deviceList List of Almond devices
	 */
	addAllDevices(deviceList) {
		console.log(TAG, 'adding devices...');

		for (const [id, info] of Object.entries(deviceList)) {
			console.log(TAG, 'found device:', id);
			console.log(JSON.stringify(info.Data));
			this.addDevice(id, info);
		}
	}

	/**
	 * Start "pairing mode" which is simply sending a request to the Almond for
	 * connected devices. We honor the timeout.
	 *
	 * @override
	 * @param {Number} timeoutSeconds Seconds to run before timeout
	 */
	startPairing(timeoutSeconds) {
		console.log(TAG, 'starting pairing mode');

		this.client.getDeviceList()
		.then((deviceList) => {
			clearTimeout(this.pairingTimer);

			this.addAllDevices(deviceList);
		});

		this.pairingTimer = setTimeout(this.cancelPairing, timeoutSeconds * 1000);
	}

	/**
	 * Cancel "pairing mode" which just removes the request from a list of
	 * messages expecting responses. It is likely that the Almond will have
	 * already responded before this can be reasonably called.
	 *
	 * @override
	 */
	cancelPairing() {
		clearTimeout(this.pairingTimer);

		console.log(TAG, 'cancelling pairing mode');
		this.client.cancelGetDeviceList();
	}

	/**
	 * Unload the adapter, which is mostly closing the websocket.
	 *
	 * @return {Promise} Promise to unload
	 */
	unload() {
		return this.client.disconnect()
		.then(() => {
			this.client = null;
		});
	}
}

function loadAlmondAdapter(addonManager, manifest, errorCallback) {
	console.log(TAG, 'loading...');
	console.log(manifest);

	adapterManifest = manifest;
	const c = manifest.moziot.config.AlmondLogin;

	// Attempt to start client, pass to adapter constructor
	// or invoke errorCallback
	new AlmondClient(c)
	.connect()
	.catch((e) => {
		errorCallback(manifest.id, e);
	})
	.then((client) => {
		new AlmondAdapter(addonManager, manifest.name, client);
	});
}

module.exports = loadAlmondAdapter;
