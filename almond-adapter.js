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

	constructor(addonManager, packageName, client, ip) {
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
		this.ip = ip;
		this.ready = false;

		this.pairingMii = null;
		this.pairingTimer = null;

		this.scanDevices()
		.then((deviceList) => {
			return this.addAllDevices(deviceList);
		})
		/* eslint-disable-next-line */
		.then((devices) => {
			this.ready = true;
		});

		this.manager.addAdapter(this);

		this.client.on('deviceupdate', this.updateDevice);

		console.log(TAG, 'initialized');
	}

	/**
	 * Dump adapter state to log
	 *
	 * @since 1.0.0
	 * @override
	 */
	dump() {
		console.log(TAG);
		console.log('ready:', this.ready);
	}

	/**
	 * Add a device to be managed by the adapter
	 *
	 * @since 1.0.0
	 * @param {string} deviceId
	 * @param {string} deviceName
	 * @param {Object} deviceCapabilities Capabilities of the device
	 *        (see {@link https://mozilla-iot.github.io/schemas/})
	 * @return {Promise} Promise to add device
	 */
	addDevice(almondId, deviceId, deviceName, deviceCapabilities) {
		return new Promise((resolve, reject) => {
			if (deviceId in this.devices) {
				console.warn(TAG, `adding device failed: ${deviceId} already exists!`);
				reject(`Device ${deviceId} already exists.`);
			}
			else {
				console.log(TAG, `adding device: ${deviceId} ${deviceName}`);
				const device = new AlmondDevice(this, almondId, deviceId, deviceName, deviceCapabilities);
				this.handleDeviceAdded(device);
				resolve(device);
			}
		});
	}

	/**
	 * Remove device from being managed by the adapter
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
	 * @param {Object[]} deviceList List of Almond devices
	 * @param {string} deviceList[].id ID of Almond device
	 * @param {string} deviceList[].capabilities Capabilities of the device
	 *        (see {@link https://mozilla-iot.github.io/schemas/})
	 * @param {Object} [deviceList[].capabilities.properties]
	 * @param {Object} [deviceList[].capabilities.actions]
	 * @param {Object} [deviceList[].capabilities.events]
	 * @returns {Promise} Promise that resolves regardless if any devices were rejected
	 */
	addAllDevices(deviceList) {
		console.log(TAG, 'adding devices...');

		const promises = [];

		for (const {id, name, capabilities, info} of deviceList) {
			console.log(TAG, 'found device:', id, name);
			//console.log(capabilities);
			promises.push(this.addDevice(id, this.thingIdFromAlmondId(id), name, capabilities, info));
		}

		return Promise.all(promises.map((p) => p.catch((e) => e)));
	}

	scanDevices() {
		return this.client.getDeviceList();
	}

	/**
	 * Start "pairing mode" which is simply sending a request to the Almond for
	 * connected devices. We honor the timeout.
	 *
	 * @since 1.0.0
	 * @override
	 * @param {Number} timeoutSeconds Seconds to run before timeout
	 */
	startPairing(timeoutSeconds) {
		if (this.pairingTimer) {
			console.warn(TAG, 'not initiating pairing: already in progress');
			return;
		}

		console.log(TAG, 'starting pairing mode');

		this.scanDevices()
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
	 * @since 1.0.0
	 * @override
	 */
	cancelPairing() {
		clearTimeout(this.pairingTimer);

		console.log(TAG, 'cancelling pairing mode');
		this.client.cancelGetDeviceList();
	}

	updateDevice(e) {
		if (e.hasOwnProperty('Devices')) {
			for (const [id, values] of Object.entries(e.Devices)) {
				// update device with values
			}
		}
	}

	thingIdFromAlmondId(almondId) {
		return `${almondId}-${this.ip}`;
	}

	almondIdFromThingId(id) {
		return id.split('-')[1];
	}

	/**
	 * Unload the adapter, which is mostly closing the websocket.
	 *
	 * @since 1.0.0
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
		new AlmondAdapter(addonManager, manifest.name, client, c.ipAddress);
	});
}

module.exports = loadAlmondAdapter;
