/**
 * almond-device-map.js - Mapping of Almond Device Types to Web Thing Capabilities.
 *
 * DeviceList documentation: https://wiki.securifi.com/index.php?title=Devicelist_Documentation
 * Web Thing schema: https://mozilla-iot.github.io/schemas/
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

/**
 * Common property definitions
 */
const booleanProperty = {
	'@type': 'BooleanProperty',
	name: 'value',
	title: 'Value',
	description: 'Boolean value of true or false',
	type: 'boolean',
};
const onOffProperty = {
	'@type': 'OnOffProperty',
	name: 'on',
	title: 'On/Off',
	description: 'Whether the switch is on or off',
	type: 'boolean',
};
const batteryLevelProperty = {
	'@type': 'LevelProperty',
	name: 'battery',
	title: 'Battery Level',
	decription: 'Level of the battery charge',
	type: 'integer',
	minimum: 0,
	maximum: 100,
	unit: 'percent',
	readOnly: true,
};
const temperatureProperty = {
	'@type': 'TemperatureProperty', // may have to be MultilevelSensor if F units aren't supported
	name: 'temperture',
	title: 'Temperature',
	description: 'The measured ambient temperature in fahrenheit',
	type: 'number',
	unit: 'degree fahrenheit',
	readOnly: true,
};
const humidityProperty = {
	'@type': 'MultilevelSensor',
	name: 'humidity',
	title: 'Humidity',
	description: 'The measured ambient humidity',
	type: 'number',
	minimum: 0,
	maximum: 100,
	unit: 'percent',
	readOnly: true,
};

module.exports = {
	'1': {
		'@type': ['OnOffSwitch'],
		description: 'An on/off switch',
		properties: {
			'1': onOffProperty,
		},
	},
	'2': {
		'@type': ['MultiLevelSwitch'],
		description: 'A multilevel switch',
		properties: {
			'1': {
				'@type': 'LevelProperty',
				name: 'level',
				title: 'Level',
				description: 'Level of the switch from 0-100',
				type: 'integer',
				minimum: 0,
				maximum: 100,
			},
		},
	},
	'3': {
		'@type': ['BinarySensor'],
		description: 'A binary sensor',
		properties: {
			'1': booleanProperty,
		},
	},
	'4': {
		'@type': ['MultiLevelSwitch', 'OnOffSwitch'],
		description: 'A multilevel switch with on/off capabilities',
		properties: {
			'1': {
				'@type': 'LevelProperty',
				name: 'level',
				title: 'Level',
				description: 'Level of the switch from 0-255',
				type: 'integer',
				minimum: 0,
				maximum: 255,
			},
			'2': onOffProperty,
			// May also include properties from #48 Hue Lamp
		},
	},
	'5': {
		'@type': ['Lock', 'MultilevelSensor'],
		description: 'A door lock',
		properties: {
			'1': {
				'@type': 'EnumProperty',
				name: 'locked',
				title: 'Lock State',
				description: 'State of the lock',
				type: 'integer',
				// It is likely that these represent "open", "closed",
				// "opening", "closing", and maybe "unknown", but in what order?
				enum: [
					255, // Locked/secured
					0, // Unlocked/unsecured
					17,
					23,
					26,
				],
				minimum: 0,
				maximum: 255,
			},
			'2': {
				'@type': 'Property',
				name: 'config',
				title: 'Config',
				description: 'Door lock configuration',
				type: 'string',
				visible: false,
			},
			'3': batteryLevelProperty,
			'4': {
				'@type': 'LevelProperty',
				name: 'max-users',
				title: 'Maximum users',
				description: 'Maximum users',
				type: 'integer',
				minimum: 0,
				maximum: 20,
			},
		},
	},
	'6': {
		'@type': ['Alarm', 'MultilevelSensor'],
		description: 'An alarm',
		properties: {
			'1': {
				'@type': 'LevelProperty',
				name: 'basic',
				title: 'Basic',
				description: 'Alarm level',
				type: 'integer',
				minimum: 0,
				maximum: 255,
			},
			'2': batteryLevelProperty,
		},
	},
	'7': {
		'@type': ['Thermostat', 'TemperatureSensor'],
		description: 'A thermostat',
		properties: {
			'1': temperatureProperty,
			'2': {
				'@type': 'EnumProperty',
				name: 'mode',
				title: 'Mode',
				description: 'Set operation mode of the thermostat',
				type: 'string',
				enum: [
					// Values unknown
				],
			},
			'3': {
				name: 'operating-state',
				title: 'Operating State',
				description: 'Operation state of the thermostat',
				type: 'string',
				readOnly: true,
			},
			'4': {
				'@type': 'TemperatureProperty',
				name: 'target-heat',
				title: 'Target Heating Temp',
				description: 'Target heating temperature in fahrenheit',
				type: 'number',
				minimum: 35,
				maximum: 95,
				unit: 'degree fahrenheit',
			},
			'5': {
				'@type': 'TemperatureProperty',
				name: 'target-cool',
				title: 'Target Cooling Temp',
				description: 'Target cooling temperature in fahrenheit',
				type: 'number',
				minimum: 35,
				maximum: 95,
				unit: 'degree fahrenheit',
			},
			'6': {
				'@type': 'EnumProperty',
				name: 'fan-mode',
				title: 'Fan Mode',
				description: 'Current mode of the fan',
				type: 'string',
				enum: [ // There may be other states, these are the only ones documented
					'On low',
					'Auto low',
				],
			},
			'7': {
				name: 'fan-state',
				title: 'Fan State',
				description: 'Current state of the fan',
				type: 'string',
				readOnly: true,
			},
			'8': batteryLevelProperty,
			'9': {
				name: 'units',
				title: 'Units',
				description: 'Temperature units',
				type: 'string',
				enum: [
					'C',
					'F',
				],
			},
			'10': humidityProperty,
		},
	},
	/*
	'8': {} // Named "Controller" in documentation, no properties listed
	*/
	'9': {
		'@type': ['SceneController'],
		description: 'Scene actuator config',
		properties: {
			'1': {
				name: 'config',
				title: 'Scene Actuator Config',
				//description: ''
				type: 'integer',
			},
		},
	},
	/*
	...
	*/
	'48': {
		'@type': ['Light'],
		description: 'A Hue lamp',
		properties: {
			'1': {
				name: 'hue-bridge-id',
				title: 'Hue Bridge ID',
				description: 'ID of the Hue Bridge this lamp is paired with',
				type: 'string',
				readOnly: true,
			},
			'2': onOffProperty,
			'3': {
				'@type': ['ColorTemperatureProperty'],
				name: 'hue',
				title: 'Hue',
				description: 'Hue of the Hue lamp in Kelvin',
				type: 'integer',
				minimum: 0,
				maximum: 65535,
				unit: 'kelvin', // maybe?
			},
			'4': {
				'@type': ['LevelProperty'],
				name: 'saturation',
				title: 'Saturation',
				description: 'Saturation of the Hue lamp from 0-255',
				type: 'integer',
				minimum: 0,
				maximum: 255,
			},
			'5': {
				'@type': 'BrightnessProperty',
				name: 'brightness',
				title: 'Brightness',
				description: 'Brightness of the Hue lamp from 0-255',
				type: 'integer',
				minimum: 0,
				maximum: 255,
			},
			'6': {
				name: 'effect',
				title: 'Effect',
				description: 'Applied effect',
				type: 'string',
			},
			'7': {
				name: 'color-mode',
				title: 'Color Mode',
				description: 'Applied color mode',
				type: 'string',
			},
			'8': {
				name: 'hue-bulb-id',
				title: 'Hue Bulb ID',
				description: 'ID of this Hue lamp',
				type: 'integer',
				readOnly: true,
			},
			'9': {
				name: 'user-name',
				title: 'User Name',
				description: 'Philips Hue user',
				type: 'string',
				readOnly: true,
			},
			'10': {
				'@type': 'BooleanProperty',
				name: 'reachable',
				title: 'Reachable',
				description: 'Whether the Hue lamp is currently reachable',
				type: 'boolean',
			},
		},
	},
	/*
	...
	*/
	'57': {
		'@type': ['NestThermostat', 'Thermostat', 'TemperatureSensor'],
		description: 'A Nest Thermostat',
		properties: {
			'1': {
				name: 'nest-id',
				title: 'Nest ID',
				description: 'ID of the Nest Thermostat',
				type: 'string',
				readOnly: true,
			},
			'2': {
				'@type': 'EnumProperty',
				name: 'mode',
				title: 'Mode',
				description: 'Set operation mode of the thermostat',
				type: 'string',
				enum: [
					'heat',
					'cool',
					'heat-cool',
					'off'
				],
			},
			'3': {
				'@type': 'TemperatureProperty',
				name: 'target-temperature',
				title: 'Target Temp',
				description: 'Target temperature in fahrenheit',
				type: 'number',
				minimum: 50,
				maximum: 90,
				unit: 'degree fahrenheit',
			},
			'4': humidityProperty,
			'5': {
				'@type': 'TemperatureProperty',
				name: 'temperature-range-low',
				title: 'Temp Range Low',
				description: 'Low temperature range',
				type: 'number',
				minimum: 50,
				maximum: 90,
				unit: 'degree fahrenheit',
			},
			'6': {
				'@type': 'TemperatureProperty',
				name: 'temperature-range-hight',
				title: 'Temp Range High',
				description: 'High temperature range',
				type: 'number',
				minimum: 50,
				maximum: 90,
				unit: 'degree fahrenheit',
			},
			'7': {
				name: 'units',
				title: 'Units',
				description: 'Temperature units',
				type: 'string',
				enum: [
					'C',
					'F',
				],
			},
			'8': {
				'@type': 'EnumProperty',
				name: 'away-mode',
				title: 'Away Mode',
				description: 'Away mode',
				type: 'string',
				enum: [
					'home',
					'away',
					'auto-away',
					'unknown',
				],
			},
			'9': {
				'@type': 'BooleanProperty',
				name: 'fan-state',
				title: 'Fan State',
				description: 'Current state of the fan',
				type: 'boolean', // docs say 'String'
			},
			'10': temperatureProperty,
			'11': {
				'@type': 'BooleanProperty',
				name: 'is-online',
				title: 'Online',
				description: 'Whether the thermostat is online',
				type: 'boolean', // docs say 'String'
				readOnly: true,
			},
			'12': {
				'@type': 'BooleanProperty',
				name: 'can-cool',
				title: 'Can Cool',
				description: 'Whether the thermostat can cool',
				type: 'boolean',
				readOnly: true,
			},
			'13': {
				'@type': 'BooleanProperty',
				name: 'can-heat',
				title: 'Can Heat',
				description: 'Whether the thermostat can heat',
				type: 'boolean',
				readOnly: true,
			},
			'14': {
				'@type': 'BooleanProperty',
				name: 'using-emergency-heat',
				title: 'Using Emergency Heat',
				description: 'Whether the thermostat is in emergency heat mode, due to the temperature dropping below the safety threshold',
				type: 'boolean',
				readOnly: true,
			},
			'15': {
				'@type': 'BooleanProperty',
				name: 'has-fan',
				title: 'Has Fan',
				description: 'Whether the thermostat has control of a fan',
				type: 'boolean',
				readOnly: true,
			},
			'16': {
				'@type': 'EnumProperty',
				name: 'hvac-state',
				title: 'HVAC State',
				description: 'Current state of the HVAC system',
				type: 'enum',
				enum: [
					'heating',
					'cooling',
					'off',
				],
				readOnly: true,
			},
			'17': {
				'@type': 'BooleanProperty',
				name: 'leaf',
				title: 'Leaf',
				description: 'Whether the thermostat has a "leaf" denoting energy-efficiency',
				type: 'boolean',
				readOnly: true,
			},
			'18': {
				name: 'response-code',
				title: 'Response Code',
				description: 'HTTP response code (should be 200)',
				type: 'integer',
				readOnly: true,
			},
		},
	},
	'58': {
		'@type': ['NestProtect', 'SmokeDetector', 'CODetector'],
		description: 'A Nest Protect Smoke/CO Detector',
		properties: {
			'1': {
				name: 'nest-id',
				title: 'Nest ID',
				description: 'ID of the Nest Thermostat',
				type: 'string',
				readOnly: true,
			},
			'2': {
				'@type': 'EnumProperty',
				name: 'battery',
				title: 'Battery',
				description: 'Battery status',
				type: 'string',
				enum: [
					'ok',
					'replace',
				],
				readOnly: true,
			},
			'3': {
				'@type': 'EnumProperty',
				name: 'co-alarm-state',
				title: 'CO Alarm State',
				description: 'State of the CO detector',
				type: 'string',
				enum: [
					'ok',
					'warning',
					'replace',
				],
				readOnly: true,
			},
			'4': {
				'@type': 'EnumProperty',
				name: 'smoke-alarm-state',
				title: 'Smoke Alarm State',
				description: 'State of the smoke detector',
				type: 'string',
				enum: [
					'ok',
					'warning',
					'replace',
				],
				readOnly: true,
			},
			'5': {
				'@type': 'BooleanProperty',
				name: 'is-online',
				title: 'Online',
				description: 'Whether the detector is online',
				type: 'boolean', // docs say 'String'
				readOnly: true,
			},
			'6': {
				'@type': 'EnumProperty',
				name: 'away-mode',
				title: 'Away Mode',
				description: 'Away mode',
				type: 'string',
				enum: [
					'home',
					'away',
					'auto-away',
					'unknown',
				],
			},
			'7': {
				name: 'response-code',
				title: 'Response Code',
				description: 'HTTP response code (should be 200)',
				type: 'integer',
				readOnly: true,
			},
		},
	},
};
