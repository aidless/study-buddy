package com.haolo.studybuddy;

import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 专注锁 / 考试锁：Android 屏幕固定（startLockTask）+ 保持亮屏。
 * 依赖系统设置里开启"屏幕固定"（多数设备默认开启），首次可能弹出系统确认。
 */
@CapacitorPlugin(name = "ScreenLock")
public class ScreenLockPlugin extends Plugin {

  @PluginMethod
  public void enable(PluginCall call) {
    getActivity().runOnUiThread(() -> {
      try {
        getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getActivity().startLockTask();
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
      } catch (Exception e) {
        call.reject("startLockTask failed: " + e.getMessage());
      }
    });
  }

  @PluginMethod
  public void disable(PluginCall call) {
    getActivity().runOnUiThread(() -> {
      try {
        getActivity().stopLockTask();
        getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
      } catch (Exception e) {
        call.reject("stopLockTask failed: " + e.getMessage());
      }
    });
  }
}
