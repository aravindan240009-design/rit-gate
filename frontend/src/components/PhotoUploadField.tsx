import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ThemedText from './ThemedText';
import imagePicker from '../utils/safeImagePicker';

interface PhotoUploadFieldProps {
  value: string | null;
  onChange: (dataUri: string | null) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Upload cap. Must stay in sync with the backend's
 * ImageValidation.MAX_DECODED_BYTES (5MB decoded) — the server rejects anything
 * larger, so we check here to fail fast with a clear message instead of after
 * a wasted upload.
 */
const MAX_PHOTO_MB = 5;
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;

/** Decoded byte length of a base64 payload, without materialising the buffer. */
const base64Bytes = (base64: string): number => {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

/** Guest-photo uploader for staff pre-registration — gallery/file picker only, no camera. */
const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);

  const pick = async () => {
    setError('');
    const perm = await imagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library access is required to upload a guest photo.');
      return;
    }
    const result = await imagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
      maxWidth: 900,
      maxHeight: 900,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType: string = asset.type && ALLOWED_TYPES.includes(asset.type) ? asset.type : 'image/jpeg';
    if (asset.type && !ALLOWED_TYPES.includes(asset.type)) {
      setError('Please choose a JPEG, PNG, or WEBP image.');
      return;
    }
    if (!asset.base64) {
      setError('Could not read the selected photo. Please try another.');
      return;
    }
    const sizeBytes = base64Bytes(asset.base64);
    if (sizeBytes > MAX_PHOTO_BYTES) {
      const actualMb = (sizeBytes / (1024 * 1024)).toFixed(1);
      setError(`Photo is too large (${actualMb}MB). Maximum size is ${MAX_PHOTO_MB}MB.`);
      return;
    }
    setFailed(false);
    onChange(`data:${mimeType};base64,${asset.base64}`);
  };

  const remove = () => {
    onChange(null);
    setError('');
    setFailed(false);
  };

  return (
    <View>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>{error}</ThemedText>
      ) : null}

      {!value ? (
        <TouchableOpacity
          style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
          onPress={pick}
        >
          <Ionicons name="camera-outline" size={28} color={theme.textTertiary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>Upload guest photo</ThemedText>
          <ThemedText style={[styles.hintText, { color: theme.textTertiary }]}>
            JPEG, PNG or WEBP · max {MAX_PHOTO_MB}MB
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.previewRow}>
          {!failed ? (
            <Image source={{ uri: value }} style={[styles.thumb, { borderColor: theme.border }]} onError={() => setFailed(true)} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
              <Ionicons name="image-outline" size={22} color={theme.textTertiary} />
            </View>
          )}
          <View style={styles.previewActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]} onPress={pick}>
              <ThemedText style={[styles.actionText, { color: theme.text }]}>Replace</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.inputBackground }]} onPress={remove}>
              <ThemedText style={[styles.actionText, { color: theme.error }]}>Remove</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  error: { fontSize: 12, marginBottom: 8 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 13, fontWeight: '600' },
  hintText: { fontSize: 11, fontWeight: '500' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 64, height: 64, borderRadius: 12, borderWidth: 1 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  previewActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
});

export default PhotoUploadField;
