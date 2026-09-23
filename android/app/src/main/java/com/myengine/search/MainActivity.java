package com.myengine.search;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(android.os.Bundle savedInstanceState) {
		registerPlugin(DeviceRpaPlugin.class);
		super.onCreate(savedInstanceState);
	}
}
