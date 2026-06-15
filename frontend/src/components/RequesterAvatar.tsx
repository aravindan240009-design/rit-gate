/**
 * RequesterAvatar
 *
 * Shows a user's IMS profile photo, looked up by their code (regNo/staffCode).
 * Falls back to the initials avatar when there's no photo or it fails to load.
 * Self-contained so it works inside FlatList rows without per-row parent state.
 */
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import ThemedText from './ThemedText';
import { apiService } from '../services/api';

interface Props {
  code?: string | null;          // regNo or staffCode to look up
  name?: string | null;          // used for initials fallback
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const getInitials = (name?: string | null) =>
  (name || 'ST').trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().substring(0, 2);

// Tiny in-memory cache so the same code isn't re-fetched for every card render.
const photoCache = new Map<string, string | null>();

const RequesterAvatar: React.FC<Props> = ({ code, name, size = 48, containerStyle, textStyle }) => {
  const [photo, setPhoto] = useState<string | null>(code ? photoCache.get(code) ?? null : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!code) { setPhoto(null); return; }
    if (photoCache.has(code)) { setPhoto(photoCache.get(code) ?? null); return; }
    let active = true;
    apiService.getProfilePhoto(String(code)).then(url => {
      photoCache.set(code, url);
      if (active) setPhoto(url);
    });
    return () => { active = false; };
  }, [code]);

  const dim = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.container, dim, containerStyle]}>
      {photo && !failed ? (
        <Image source={{ uri: photo }} style={dim} onError={() => setFailed(true)} />
      ) : (
        <ThemedText style={textStyle}>{getInitials(name)}</ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

export default RequesterAvatar;
