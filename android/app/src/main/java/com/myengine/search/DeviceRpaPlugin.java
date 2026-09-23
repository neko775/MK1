package com.myengine.search;

import android.content.Intent;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceRpa")
public class DeviceRpaPlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", DeviceRpaService.getInstance() != null);
        call.resolve(result);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        getContext().startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        call.resolve();
    }

    @PluginMethod
    public void executeAction(PluginCall call) {
        String action = call.getString("action", "");
        String text = call.getString("text", "");
        String viewId = call.getString("viewId", "");
        DeviceRpaService service = DeviceRpaService.getInstance();
        if (service == null) {
            call.reject("AccessibilityServiceが有効ではありません");
            return;
        }

        boolean executed;
        if ("tap".equals(action)) {
            executed = service.tap(text, viewId);
        } else if ("type".equals(action) && text.length() <= 2_000) {
            executed = service.type(text, viewId);
        } else if ("scroll-forward".equals(action)) {
            executed = service.scroll(true);
        } else if ("scroll-backward".equals(action)) {
            executed = service.scroll(false);
        } else {
            call.reject("許可されていないRPA操作です");
            return;
        }

        JSObject result = new JSObject();
        result.put("executed", executed);
        call.resolve(result);
    }
}
