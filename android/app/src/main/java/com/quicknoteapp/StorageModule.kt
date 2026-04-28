package com.quicknoteapp

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class StorageModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "SimpleStorage"

    @ReactMethod
    fun setItem(key: String, value: String, promise: Promise) {
        try {
            val sharedPref = reactApplicationContext.getSharedPreferences("QuickNoteAppStorage", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putString(key, value)
                apply()
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("StorageError", e)
        }
    }

    @ReactMethod
    fun getItem(key: String, promise: Promise) {
        try {
            val sharedPref = reactApplicationContext.getSharedPreferences("QuickNoteAppStorage", Context.MODE_PRIVATE)
            val value = sharedPref.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("StorageError", e)
        }
    }
}
