package com.vexpaer.deepshek;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Locale;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {
    @PluginMethod
    public void install(PluginCall call) {
        String digest = call.getString("digest");
        if (digest == null || !digest.matches("[0-9a-f]{64}")) {
            call.reject("Invalid release digest");
            return;
        }
        try {
            File apk = new File(getContext().getCacheDir(), "update-" + digest + ".apk");
            MessageDigest hash = MessageDigest.getInstance("SHA-256");
            try (FileInputStream input = new FileInputStream(apk)) {
                byte[] buffer = new byte[65536];
                int count;
                while ((count = input.read(buffer)) != -1) hash.update(buffer, 0, count);
            }
            StringBuilder actual = new StringBuilder();
            for (byte value : hash.digest()) actual.append(String.format(Locale.ROOT, "%02x", value));
            if (!digest.contentEquals(actual)) {
                call.reject("APK checksum mismatch");
                return;
            }
            String packageName = getContext().getPackageName();
            boolean needsPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && !getContext().getPackageManager().canRequestPackageInstalls();
            Intent intent;
            if (needsPermission) {
                intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + packageName));
            } else {
                Uri uri = FileProvider.getUriForFile(getContext(), packageName + ".fileprovider", apk);
                intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
            getActivity().startActivity(intent);
            JSObject result = new JSObject();
            result.put("permission", needsPermission);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Cannot open the Android installer", error);
        }
    }
}
