/**
 * almond-websocket.js - Manages websocket API connection.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const WebSocket = require('ws');

const TAG = 'AlmondWebsocket:';

const miiLength = 32;

class AlmondWebsocket {

	constructor(ip, username, password) {
		this.ip = ip;
		this.username = username;
		this.password = password;
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
	}

	open() {
		return new Promise((resolve, reject) => {
			this.ws = new WebSocket(`ws://${this.ip}:7681/${this.username}/${this.password}`);

			var self = this;
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

	close() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	send(data) {
		return new Promise((resolve, reject) => {
			let mii = generateMii();

			console.log(TAG, 'sending data with mii:', mii);

			data.MobileInternalIndex = mii;
			this.messageQueue[mii] = {
				timestamp: Date.now(),
				sent: data,
				resolve: resolve,
				reject: reject,
			}
		});
	}

	onmessage(message) {
		console.log(TAG, 'onmessage');

		if (!message.hasOwnProperty('data')) return;
		let d = message.data;

		console.log(d);

		// Check if message is a response to a request
		if (d.hasOwnProperty('MobileInternalIndex')) {
			let mii = d.MobileInternalIndex;
			if (this.messageQueue.hasOwnProperty(mii)) {
				let mq = this.messageQueue[mii];
				let resp = {
					sent: mq.sent,
					received: d,
					sentTimestamp: mq.timestamp,
					receivedTimestamp: Date.now(),
				}
				console.log(TAG, 'resolving request for mii:',  mii);
				console.log(resp);
				mq.resolve(resp);
				mq = null;
				delete this.messageQueue[mii];
			}
		}
	}

	onerror(error) {

	}

	generateMii() {
		return ''+Math.floor(Math.pow(10, miiLength-1) + Math.random() * (Math.pow(10, miiLength) - Math.pow(10, miiLength-1) - 1));
	}
}

module.exports = AlmondWebsocket;
