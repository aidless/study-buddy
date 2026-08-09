package com.haolo.studybuddy;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(ScreenLockPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
