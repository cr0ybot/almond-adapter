/**
 * almond-websocket.js - Manages websocket API connection.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondController:';

const {Deferred} = require('gateway-addon');
const WebSocket = require('ws');

const miiLength = 16;

class AlmondController {

	constructor(config) {
		if (!config.hasOwnProperty('ipAddress') ||
		!config.hasOwnProperty('username') ||
		!config.hasOwnProperty('password')) {
			throw new Error('Could not connect to Almond: configuration incomplete');
		}

		this.config = config;
		this.ws = null;

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
		 * @type {Object}
		 */
		this.messageQueue = {};

		this.getDeviceListMii = null;
	}

	connect() {
		return new Promise((resolve, reject) => {
			// eslint-disable-next-line
			this.ws = new WebSocket(`ws://${this.config.ipAddress}:7681/${this.config.username}/${this.config.password}`);

			this.ws.onopen = function() {
				console.log(TAG, 'websocket opened');
				this.ws.onmessage = this.onmessage.bind(this);
				this.ws.onerror = this.onerror.bind(this);
				resolve(this);
				this.ws.onopen = null;
			}.bind(this);
			this.ws.onerror = function(err) {
				console.error(TAG, 'websocket could not be opened');
				reject(err);
			};
		});
	}

	disconnect() {
		if (this.ws) {
			return new Promise((resolve, reject) => {
				this.ws.onclose = () => {
					this.ws = null;
					resolve();
				};
				this.ws.close();
				setTimeout(() => {
					// Dirty cleanup
					this.ws.onclose = null;
					this.ws = null;
					reject('Timed out attempting to disconnect from websocket');
				}, 5000);
			});
		}

		return Promise.reject();
	}

	getDeviceList() {
		console.log(TAG, 'getting device list...');

		const req = {
			CommandType: 'DeviceList',
		};

		const s = this.sendRequest(req);

		this.getDeviceListMii = s.mii;

		return s.promise
		.then((resp) => {
			if (resp.received && resp.received.hasOwnProperty('Devices')) {
				return resp.received.Devices;
			}
			return {};
		});
	}

	cancelGetDeviceList() {
		if (!this.getDeviceListMii) {
			console.log(TAG, 'pairing mode already stopped');
			return;
		}

		this.cancelRequest(this.getDeviceListMii);
		this.getDeviceListMii = null;
	}


	/**
	 * Request Management
	 */

	/**
	 * Sends data to the websocket and returns a Deferred object that contains
	 * a promise and the mii in case the request needs to be cancelled and
	 * removed from the queue.
	 *
	 * @param {Object} data JSON message
	 * @return {Deferred} wrapped Promise
	 */
	sendRequest(data) {
		const mii = this.generateMii();
		const deferred = new Deferred();
		deferred.mii = mii;

		console.log(TAG, 'sending data with mii:', mii);
		data.MobileInternalIndex = mii;
		console.log(JSON.stringify(data));

		this.messageQueue[mii] = {
			timestamp: Date.now(),
			sent: data,
			resolve: deferred.resolve.bind(deferred),
			reject: deferred.reject.bind(deferred),
		};

		this.ws.send(JSON.stringify(data));

		return deferred;
	}

	resolveRequest(mii, data) {
		console.log(TAG, 'resolving request with mii:', mii);

		if (this.messageQueue.hasOwnProperty(mii)) {
			let mq = this.messageQueue[mii];
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
			delete this.messageQueue[mii];
			console.log(TAG, 'request resolved');
			return;
		}

		console.log(TAG, 'no request to resolve for mii:', mii);
	}

	/**
	 * Removes a message from the queue and calls its reject callback
	 *
	 * @param {String} mii MobileInternalIndex
	 * @return {boolean} success or failure
	 */
	cancelRequest(mii) {
		console.log(TAG, 'cancelling request with mii:', mii);

		if (this.messageQueue.hasOwnProperty(mii)) {
			let mq = this.messageQueue[mii];
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
			delete this.messageQueue[mii];
			console.log(TAG, 'request cancelled');
			return true;
		}

		console.log(TAG, 'request not found (already resolved?)');
		return false;
	}


	/**
	 * Event Handlers
	 */

	onmessage(message) {
		console.log(TAG, 'onmessage');

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
		// TODO: else, could be device event/update message
	}

	onerror(error) {
		// TODO: ?
	}


	/**
	 * Utilities
	 */

	generateMii() {
		// eslint-disable-next-line
		return '' + Math.floor(Math.pow(10, miiLength - 1) + Math.random() * (Math.pow(10, miiLength) - Math.pow(10, miiLength - 1) - 1));
	}
}

module.exports = AlmondController;
