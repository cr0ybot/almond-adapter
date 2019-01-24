/**
 * almond-property.js - Represents a property of an ALmond device.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const TAG = 'AlmondProperty:';

const {Property} = require('gateway-addon');

class AlmondProperty extends Property {

	constructor(device, name, propertyDescr, value) {
		super(device, name, propertyDescr);

		this.setCachedValue(value);
	}
}

module.exports = AlmondProperty;
