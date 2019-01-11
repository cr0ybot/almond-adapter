/**
 * almond-adapter.js - Almond adapter.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

let Adapter, Device, Property;
try {
	Adapter = require('../adapter');
	Device = require('../device');
	Property = require('../property');
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND') {
		throw e;
	}

	const gwa = require('gateway-addon');
	Adapter = gwa.Adapter;
	Device = gwa.Device;
	Property = gwa.Property;
}
