import React, { useRef } from 'react';
import { PanResponder, View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Props {
  value: number; // 0..1
  onValueChange: (v: number) => void;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  display?: string;
  tint?: string;
}

export function Slider({ value, onValueChange, label, minLabel, maxLabel, display, tint }: Props) {
  const widthRef = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handle(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handle(e.nativeEvent.locationX),
    })
  ).current;

  const handle = (x: number) => {
    if (widthRef.current <= 0) return;
    const v = Math.max(0, Math.min(1, x / widthRef.current));
    onValueChange(v);
  };

  const color = tint ?? theme.brand;

  return (
    <View style={styles.wrap}>
      {(label || display !== undefined) && (
        <View style={styles.row}>
          {label && <Text style={styles.label}>{label}</Text>}
          {display !== undefined && <Text style={[styles.value, { color }]}>{display}</Text>}
        </View>
      )}
      <View
        style={styles.trackWrap}
        onLayout={(e) => (widthRef.current = e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        <View style={styles.track} />
        <View style={[styles.fill, { width: `${value * 100}%`, backgroundColor: color }]} />
        <View style={[styles.thumb, { left: `${value * 100}%`, borderColor: color }]} />
      </View>
      {(minLabel || maxLabel) && (
        <View style={styles.row}>
          {minLabel && <Text style={styles.cap}>{minLabel}</Text>}
          {maxLabel && <Text style={[styles.cap, { textAlign: 'right' }]}>{maxLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: theme.text, fontSize: 14, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  trackWrap: { height: 44, justifyContent: 'center', position: 'relative' },
  track: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  fill: { position: 'absolute', left: 0, height: 6, borderRadius: 3 },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    backgroundColor: '#fff',
    borderWidth: 3,
    elevation: 3,
  },
  cap: { color: theme.textFaint, fontSize: 11, flex: 1 },
});
