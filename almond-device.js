/**
 * almond-device.js - Represents a device paired with the Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondDevice:';
const CAPABILITIES = [
	'@type',
	'description',
	'links',
];

const {Device} = require('gateway-addon');
const AlmondProperty = require('./almond-property');

class AlmondDevice extends Device {

	constructor(adapter, id, name, capabilities) {
		const ipID = `${adapter.ip}-${id}`;
		super(adapter, ipID);

		this.almondID = id;
		this.name = name;

		for (const field of CAPABILITIES) {
			if (capabilities.hasOwnProperty(field)) {
				this[field] = capabilities[field];
			}
		}

		if (capabilities.hasOwnProperty('properties')) {
			for (const [index, desc] of Object.entries(capabilities.properties)) {
				this.addProperty(index, desc, desc.value);
			}
		}

		if (capabilities.hasOwnProperty('actions')) {
			// TODO: set actions map
		}

		if (capabilities.hasOwnProperty('events')) {
			// TODO: set events map
		}
	}

	addProperty(index, description, value) {
		// TODO: AlmondProperty class with index
		const prop = new AlmondProperty(this, description.name, description, value);
		this.properties.set(description.name, prop);
	}

	asDict() {
		const dict = super.asDict();

		return dict;
	}
}

module.exports = AlmondDevice;
