/**
 * almond-websocket.js - Manages websocket API connection.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondController:';

const WebSocket = require('ws');

let Deferred;
try {
	Deferred = require('../deferred');
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND') throw e;

	const gwa = require('gateway-addon');
	Deferred = gwa.Deferred;
}

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
			this.ws = new WebSocket(`ws://${this.config.ipAddress}:7681/${this.config.username}/${this.config.password}`);

			const self = this;
			this.ws.onopen = function() {
				console.log(TAG, 'websocket opened');
				self.ws.onmessage = self.onmessage;
				self.ws.onerror = self.onerror;
				resolve(self);
				self.ws.onopen = null;
			};
			this.ws.onerror = function(err) {
				console.error(TAG, 'websocket could not be opened');
				reject(err);
			};
		});
	}

	disconnect() {
		if (this.ws) {
			return new Promise((resolve, reject) => {
				this.ws.onclose = function() {
					resolve();
				}
				this.ws.close();
				this.ws = null;
			});
		}

		return Promise.reject();
	}

	getDeviceList() {
		console.log(TAG, 'getting device list...');

		const req = {
			CommandType: 'DeviceList',
		};

		const s = this.send(req);

		this.getDeviceListMii = s.mii;

		return s.promise;
	}

	cancelGetDeviceList() {
		if (!this.getDeviceListMii) {
			console.log(TAG, 'pairing mode already stopped');
			return;
		}

		this.cancelSend(this.getDeviceListMii);
		this.getDeviceListMii = null;
	}

	/**
	 * Sends data to the websocket and returns a Deferred object that contains
	 * a promise and the mii in case the request needs to be cancelled and
	 * removed from the queue.
	 *
	 * @param {Object} data JSON message
	 * @return {Deferred} wrapped Promise
	 */
	send(data) {
		const mii = this.generateMii();
		const deferred = new Deferred();
		deferred.mii = mii;

		console.log(TAG, 'sending data with mii:', mii);

		data.MobileInternalIndex = mii;
		this.messageQueue[mii] = {
			timestamp: Date.now(),
			sent: data,
			resolve: deferred.resolve,
			reject: deferred.reject,
		};

		return deferred;
	}

	/**
	 * Removes a message from the queue and calls its reject callback
	 *
	 * @param {String} mii MobileInternalIndex
	 * @return {boolean} success or failure
	 */
	cancelSend(mii) {
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
			return true;
		}

		return false;
	}

	onmessage(message) {
		console.log(TAG, 'onmessage');

		if (!message.hasOwnProperty('data')) return;
		const d = message.data;

		console.log(d);

		// Check if message is a response to a request
		if (d.hasOwnProperty('MobileInternalIndex')) {
			const mii = d.MobileInternalIndex;
			if (this.messageQueue.hasOwnProperty(mii)) {
				let mq = this.messageQueue[mii];
				const resp = {
					mii: mii,
					sent: mq.sent,
					received: d,
					cancelled: false,
					sentTimestamp: mq.timestamp,
					receivedTimestamp: Date.now(),
				};
				console.log(TAG, 'resolving request for mii:', mii);
				console.log(resp);
				mq.resolve(resp);
				mq = null;
				delete this.messageQueue[mii];
			}
		}
	}

	onerror(error) {
		// TODO: ?
	}

	generateMii() {
		return '' + Math.floor(Math.pow(10, miiLength - 1) + Math.random() * (Math.pow(10, miiLength) - Math.pow(10, miiLength - 1) - 1));
	}
}

module.exports = AlmondController;
