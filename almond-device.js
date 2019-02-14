/**
 * almond-device.js - Represents a device paired with the Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondDevice:'; // eslint-disable-line no-unused-vars
const CAPABILITIES = [
	'@type',
	'description',
	'links',
];

const {Device} = require('gateway-addon');
const AlmondProperty = require('./almond-property');

const deviceMap = require('./almond-device-map');

class AlmondDevice extends Device {

	constructor(adapter, almondId, id, info) {
		super(adapter, id);

		this.almondId = almondId;
		this.info = info;
		this.name = info.Data.Name;

		const capabilities = this.mapDeviceCapabilities(info);

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


	/**
	 * Utilities
	 */

	/**
	 * Maps DeviceList info to WoT Capability Schema
	 *
	 * @since 1.0.0
	 * @param {Object} info Parsed JSON object from Almond DeviceList
	 * @return {Object} Capability schema object
	 */
	mapDeviceCapabilities(info) {
		if (!info.hasOwnProperty('Data') || !info.Data.hasOwnProperty('ID') || !info.Data.hasOwnProperty('Type')) return false;

		//const id = info.Data.ID;
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
}

module.exports = AlmondDevice;
