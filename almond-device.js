/**
 * almond-device.js - Represents a device paired with the Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondDevice:';

const {Device} = require('gateway-addon');

class AlmondDevice extends Device {

	constructor(adapter, id, data) {
		super(adapter, id);

		this.info = data.Data;
		this.name = data.Data.Name;
	}
}

module.exports = AlmondDevice;
