package com.myengine.search;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.os.Bundle;

import java.util.List;

public class DeviceRpaService extends AccessibilityService {
    private static DeviceRpaService instance;

    public static DeviceRpaService getInstance() {
        return instance;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        AccessibilityServiceInfo info = getServiceInfo();
        if (info != null) {
            info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                    | AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
                    | AccessibilityEvent.TYPE_VIEW_CLICKED;
            info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
            info.flags |= AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
                    | AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
            setServiceInfo(info);
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {}

    @Override
    public void onInterrupt() {}

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    public boolean tap(String text, String viewId) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;
        AccessibilityNodeInfo target = findNode(root, text, viewId);
        if (target == null) return false;
        return clickNode(target);
    }

    public boolean type(String text, String viewId) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;
        AccessibilityNodeInfo target = findNode(root, null, viewId);
        if (target == null) return false;
        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
        return target.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
    }

    public boolean scroll(boolean forward) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;
        return root.performAction(forward
                ? AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
                : AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD);
    }

    private AccessibilityNodeInfo findNode(AccessibilityNodeInfo root, String text, String viewId) {
        if (viewId != null && !viewId.isEmpty()) {
            List<AccessibilityNodeInfo> byId = root.findAccessibilityNodeInfosByViewId(viewId);
            if (!byId.isEmpty()) return byId.get(0);
        }
        if (text != null && !text.isEmpty()) {
            List<AccessibilityNodeInfo> byText = root.findAccessibilityNodeInfosByText(text);
            if (!byText.isEmpty()) return byText.get(0);
        }
        return null;
    }

    private boolean clickNode(AccessibilityNodeInfo node) {
        AccessibilityNodeInfo current = node;
        while (current != null) {
            if (current.isClickable()) {
                return current.performAction(AccessibilityNodeInfo.ACTION_CLICK);
            }
            current = current.getParent();
        }
        return false;
    }
}
