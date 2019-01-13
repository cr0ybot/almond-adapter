/**
 * almond-adapter.js - Adapter that manages devices connected to Almond.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

let Adapter;
try {
	Adapter = require('../adapter');
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND') {
		throw e;
	}

	const gwa = require('gateway-addon');
	Adapter = gwa.Adapter;
}

// This will get set to the contents of package.json within loadAlmondAdapter(),
// at which point we can reference config values in the `moziot` section
let adapterManifest;

class AlmondAdapter extends Adapter {

}

function loadAlmondAdapter(addonManager, manifest, errorCallback) {
	adapterManifest = manifest;

	// TODO: attempt to open websocket, pass to adapter constructor or invoke errorCallback

	new AlmondAdapter(addonManager, manifest.name);
}

module.exports = loadAlmondAdapter;
