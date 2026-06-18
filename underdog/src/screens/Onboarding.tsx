import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { TOPICS } from '../data/seed';
import { theme } from '../theme';

export function Onboarding() {
  const { finishOnboarding } = useApp();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const ready = picked.length >= 3;

  return (
    <ImageBackground
      source={{ uri: 'https://picsum.photos/seed/jetpacknano-hero/900/1600' }}
      style={styles.bg}
      blurRadius={28}
    >
      <View style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.logoRow}>
            <Ionicons name="rocket" size={26} color={theme.brand} />
            <Text style={styles.logo}>Jetpack Nano</Text>
          </View>
          <Text style={styles.h1}>Where zero wins.</Text>
          <Text style={styles.lede}>
            The feed that spreads attention around. Posts with fewer likes reach
            farther — so you meet original people, not the same five accounts. Pick a
            few things you like and we'll show you the originals.
          </Text>

          <Text style={styles.sectionLabel}>Choose at least 3 interests</Text>
          <View style={styles.grid}>
            {TOPICS.map((t) => {
              const on = picked.includes(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => toggle(t.id)}
                  style={[styles.chip, on && { borderColor: t.color, backgroundColor: t.color + '22' }]}
                >
                  <Ionicons name={t.icon as any} size={18} color={on ? t.color : theme.textDim} />
                  <Text style={[styles.chipText, on && { color: theme.text }]}>{t.label}</Text>
                  {on && <Ionicons name="checkmark-circle" size={16} color={t.color} style={{ marginLeft: 2 }} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={!ready}
            onPress={() => finishOnboarding(picked as any)}
            style={[styles.btn, !ready && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>{ready ? 'Enter the feed' : `Pick ${3 - picked.length} more`}</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.text} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 22, paddingTop: 36, paddingBottom: 60 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  logo: { color: theme.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },
  h1: { color: theme.text, fontSize: 38, fontWeight: '800', lineHeight: 42, marginBottom: 14 },
  lede: { color: theme.textDim, fontSize: 15.5, lineHeight: 22, marginBottom: 28 },
  sectionLabel: { color: theme.text, fontSize: 13, fontWeight: '700', marginBottom: 12, letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999,
    borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.panel,
  },
  chipText: { color: theme.textDim, fontSize: 14, fontWeight: '600' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.brand, paddingVertical: 17, borderRadius: 14,
  },
  btnDisabled: { backgroundColor: 'rgba(124,92,255,0.35)' },
  btnText: { color: theme.text, fontSize: 16, fontWeight: '800' },
});
