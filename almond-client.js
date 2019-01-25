/**
 * almond-websocket.js - Manages websocket API connection.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondClient:';
const MII_LENGTH = 24;
const MESSAGE_TIMEOUT = 60000;

const {Deferred} = require('gateway-addon');
const {EventEmitter} = require('events');
const WebSocket = require('ws');

const deviceMap = require('./almond-device-map');

/**
 * Symbols for private methods
 */
const messageHandler = Symbol('messageHandler');
const errorHandler = Symbol('errorHandler');
const mapDeviceCapabilities = Symbol('mapDeviceCapabilities');

/**
 * Symbols for private properties
 */
const ws = Symbol('ws');
const messageQueue = Symbol('messageQueue');
const cancellable = Symbol('cancellable');

class AlmondClient extends EventEmitter {

	/**
	 * Initialize AlmondClient with config
	 *
	 * @since 1.0.0
	 * @param {Object} config Add-on settings config
	 * @param {String} config.ipAddress
	 * @param {String} config.username
	 * @param {String} config.password
	 */
	constructor({ipAddress = false, username = false, password = false}) {
		if (!ipAddress || !username || !password) {
			throw new Error('Could not connect to Almond: configuration incomplete');
		}

		super();

		this.config = arguments[0];
		this[ws] = null;

		/**
		 * Holds sent messages using mii as key to match against responses
		 *
		 * Example:
		 * '12345': {
		 *   timestamp: 1234567890,
		 *   sent: {'MobilInternalIndex':'12345','CommandType':'DeviceList'},
		 *   resolve: ##resolveCallback##,
		 *   reject: ##rejectCallback##
		 * }
		 *
		 * @private
		 * @type {Object}
		 */
		this[messageQueue] = {};

		/**
		 * Since some methods are "cancellable", we keep a reference to
		 * their mii to remove it from the messageQueue
		 *
		 * @private
		 * @type {Object}
		 */
		this[cancellable] = {};
	}

	/**
	 * Connect to Almond websocket API
	 *
	 * @since 1.0.0
	 * @return {Promise} Resolves with this AlmondClient on success
	 */
	connect() {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line
			this[ws] = new WebSocket(`ws://${this.config.ipAddress}:7681/${this.config.username}/${this.config.password}`);

			this[ws].onopen = function() {
				console.log(TAG, 'websocket opened');
				this[ws].onmessage = this[messageHandler].bind(this);
				this[ws].onerror = this[errorHandler].bind(this);
				this[ws].onopen = null;
				resolve(this);
			}.bind(this);
			this[ws].onerror = function(err) {
				console.error(TAG, 'websocket could not be opened');
				reject(err);
			};
		});
	}

	/**
	 * Disconnect gracefully from the websocket API
	 *
	 * @since 1.0.0
	 * @return {Promise} Resolves on websocket close
	 */
	disconnect() {
		if (this[ws]) {
			return new Promise((resolve, reject) => {
				this[ws].onclose = () => {
					this[ws] = null;
					resolve();
				};
				this[ws].close();
				setTimeout(() => {
					// Dirty cleanup
					this[ws].onclose = null;
					this[ws] = null;
					reject('Timed out attempting to disconnect from websocket');
				}, 5000);
			});
		}

		return Promise.reject();
	}


	/**
	 * High-level device API
	 */

	/**
	 * Get list of devices connected to Almond
	 *
	 * @since 1.0.0
	 * @return {Promise} Promise that resolves with DeviceList JSON
	 */
	getDeviceList() {
		console.log(TAG, 'getting device list...');

		const req = {
			CommandType: 'DeviceList',
		};

		const s = this.sendRequest(req);

		this[cancellable].getDeviceList = s.mii;

		return s.promise
		.then((resp) => {
			if (resp.received && resp.received.hasOwnProperty('Devices')) {
				return resp.received.Devices;
			}
			return {};
		})
		.then((deviceList) => {
			const devices = [];
			for (const [id, info] of Object.entries(deviceList)) {
				const capabilities = this[mapDeviceCapabilities](info);
				if (capabilities) {
					console.log(TAG, 'found Almond device:', id);
					console.log(JSON.stringify(info.Data));
					devices.push({id: id, name: info.Data.Name, capabilities: capabilities});
				}
				else {
					console.warn(TAG, 'device type unknown:', id);
					console.warn(JSON.stringify(info));
				}
			}
			return devices;
		});
	}

	/**
	 * Cancels request for DeviceList
	 *
	 * @since 1.0.0
	 */
	cancelGetDeviceList() {
		if (!this[cancellable].hasOwnProperty('getDeviceList')) {
			console.log(TAG, 'pairing mode already stopped');
			return;
		}

		this.cancelRequest(this[cancellable].getDeviceList);
		delete this[cancellable].getDeviceList;
	}


	/**
	 * Request Management
	 */

	/**
	 * Sends data to the websocket and returns a Deferred object that contains
	 * a promise and the mii in case the request needs to be cancelled and
	 * removed from the queue.
	 *
	 * @since 1.0.0
	 * @param {Object} data JSON message
	 * @return {Deferred} Wrapped Promise
	 */
	sendRequest(data) {
		const mii = this.generateMii();
		const deferred = new Deferred();
		deferred.mii = mii;

		console.log(TAG, 'sending data with mii:', mii);
		data.MobileInternalIndex = mii;
		console.log(JSON.stringify(data));

		this[messageQueue][mii] = {
			timestamp: Date.now(),
			sent: data,
			resolve: deferred.resolve.bind(deferred),
			reject: deferred.reject.bind(deferred),
		};

		this[ws].send(JSON.stringify(data));

		return deferred;
	}

	/**
	 * Resolves a request in the messageQueue
	 *
	 * @since 1.0.0
	 * @param {String} mii MobileInternalIndex
	 * @param {Object} data Response data
	 */
	resolveRequest(mii, data) {
		console.log(TAG, 'resolving request with mii:', mii);

		if (this[messageQueue].hasOwnProperty(mii)) {
			let mq = this[messageQueue][mii];
			const resp = {
				mii: mii,
				sent: mq.sent,
				received: data,
				cancelled: false,
				sentTimestamp: mq.timestamp,
				receivedTimestamp: Date.now(),
			};
			console.log(JSON.stringify(resp));
			mq.resolve(resp);
			mq = null;
			delete this[messageQueue][mii];
			console.log(TAG, 'request resolved');
			return;
		}

		console.log(TAG, 'no request to resolve for mii:', mii);
	}

	/**
	 * Removes a message from the queue and calls its reject callback
	 *
	 * @since 1.0.0
	 * @param {String} mii MobileInternalIndex
	 * @return {boolean} success or failure
	 */
	cancelRequest(mii) {
		console.log(TAG, 'cancelling request with mii:', mii);

		if (this[messageQueue].hasOwnProperty(mii)) {
			let mq = this[messageQueue][mii];
			const resp = {
				mii: mii,
				sent: mq.sent,
				received: false,
				cancelled: true,
				sentTimestamp: mq.timestamp,
				receivedTimestamp: Date.now(),
			};
			mq.reject(resp);
			mq = null;
			delete this[messageQueue][mii];
			console.log(TAG, 'request cancelled');
			return true;
		}

		console.log(TAG, 'request not found (already resolved?)');
		return false;
	}


	/**
	 * Event Handlers
	 */

	/**
	 * All messages from the websocket are received here
	 *
	 * @since 1.0.0
	 * @private
	 * @param {String} message Message from websocket
	 */
	[messageHandler](message) {
		console.log(TAG, 'handling websocket message...');

		if (!message.hasOwnProperty('data')) return;
		const d = message.data;
		console.log(d);

		let data = {};
		try {
			data = JSON.parse(d);
		}
		catch (e) {
			console.warn(TAG, 'message was not parsable');
		}

		// Check if message is a response to a request
		if (data.hasOwnProperty('MobileInternalIndex')) {
			this.resolveRequest(data.MobileInternalIndex, data);
		}
		else {
			this.emit('message', data);
		}
	}

	/**
	 * All errors from the websocket are received here
	 *
	 * @since 1.0.0
	 * @private
	 * @param {Error} error
	 */
	[errorHandler](error) {
		// TODO
	}


	/**
	 * Utilities
	 */

	/**
	 * Maps DeviceList info to WoT Capability Schema
	 *
	 * @since 1.0.0
	 * @private
	 * @param {Object} info Parsed JSON object from Almond DeviceList
	 * @return {Object} Capability schema object
	 */
	[mapDeviceCapabilities](info) {
		if (!info.hasOwnProperty('Data') || !info.Data.hasOwnProperty('ID') || !info.Data.hasOwnProperty('Type')) return false;

		const id = info.Data.ID;
		const type = info.Data.Type;

		if (!deviceMap.hasOwnProperty(type)) return false;
		const map = deviceMap[type];

		// Set current values
		for (const [i, prop] of Object.entries(map.properties)) {
			if (info.DeviceValues && info.DeviceValues.hasOwnProperty(i)) {
				let value = info.DeviceValues[i].Value;
				switch (prop.type) {
					case 'integer':
						value = parseInt(value);
						break;
					case 'number':
						value = Number(value);
						break;
					case 'boolean':
						value = value == 'true';
						break;
					/*
					default:
						prop.value = value;
						break;
					*/
				}
				map.properties[i].value = value;
			}
		}

		return map;
	}

	/**
	 * Generates a MobileInternalIndex (mii) for requests to the WebSocket API
	 *
	 * Responses from the API are matched with the mii.
	 *
	 * @since 1.0.0
	 * @return {String} MobileInternalIndex
	 */
	generateMii() {
		return (Math.floor(
			Math.pow(10, MII_LENGTH - 1) + Math.random() *
			(Math.pow(10, MII_LENGTH) - Math.pow(10, MII_LENGTH - 1) - 1)
		)).toString();
	}
}

module.exports = AlmondClient;
