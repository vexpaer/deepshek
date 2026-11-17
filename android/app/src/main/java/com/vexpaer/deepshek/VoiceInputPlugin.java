package com.vexpaer.deepshek;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(name = "VoiceInput", permissions = {
    @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
})
public class VoiceInputPlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private PluginCall pending;

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphoneGranted");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void microphoneGranted(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(call);
        else call.reject("Microphone permission denied");
    }

    private void begin(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("No speech recognition service is installed");
                return;
            }
            finish("", null);
            pending = call;
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new RecognitionListener() {
                public void onReadyForSpeech(Bundle params) {}
                public void onBeginningOfSpeech() {}
                public void onRmsChanged(float rmsdB) {}
                public void onBufferReceived(byte[] buffer) {}
                public void onEndOfSpeech() {}
                public void onPartialResults(Bundle results) {}
                public void onEvent(int eventType, Bundle params) {}
                public void onError(int error) { finish("", "Speech recognition error: " + error); }
                public void onResults(Bundle results) {
                    ArrayList<String> texts = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    finish(texts != null && !texts.isEmpty() ? texts.get(0) : "", null);
                }
            });
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, call.getString("language", "zh-CN"));
            try { recognizer.startListening(intent); }
            catch (Exception error) { finish("", error.getMessage()); }
        });
    }

    private void finish(String text, String error) {
        PluginCall call = pending;
        pending = null;
        if (recognizer != null) { recognizer.destroy(); recognizer = null; }
        if (call != null) {
            if (error != null) call.reject(error);
            else { JSObject result = new JSObject(); result.put("text", text); call.resolve(result); }
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (recognizer != null) recognizer.stopListening(); call.resolve(); });
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        getActivity().runOnUiThread(() -> { finish("", null); call.resolve(); });
    }

    @Override
    protected void handleOnDestroy() {
        getActivity().runOnUiThread(() -> finish("", null));
    }
}
