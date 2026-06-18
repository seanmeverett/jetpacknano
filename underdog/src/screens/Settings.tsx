import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../store';
import { TOPICS } from '../data/seed';
import { Slider } from '../components/Slider';
import { theme } from '../theme';

export function Settings() {
  const {
    opts, prefs, setScreen, setMode, setInverseStrength, toggleDiversity,
    toggleInterest, setInterestWeight, setFreshnessHalfLife, reset,
  } = useApp();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => setScreen('feed')} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Tune the algorithm</Text>
        <View style={{ width: 28 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Mode */}
        <Card>
          <CardHead icon="swap-horizontal" title="Ranking mode" />
          <View style={styles.segment}>
            <SegBtn active={opts.mode === 'inverse'} onPress={() => setMode('inverse')}
              icon="trending-down" label="Inverse" tint={theme.brand} />
            <SegBtn active={opts.mode === 'standard'} onPress={() => setMode('standard')}
              icon="trending-up" label="Standard" tint={theme.warn} />
          </View>
          <Text style={styles.help}>
            {opts.mode === 'inverse'
              ? 'Zero-likes posts reach farthest. Mega posts get suppressed.'
              : 'Like every other app: more likes = more reach. See the difference.'}
          </Text>
        </Card>

        {/* Inverse strength */}
        <Card>
          <CardHead icon="trending-down" title="Inverse strength" />
          <Slider
            value={opts.inverseStrength}
            onValueChange={setInverseStrength}
            display={`${Math.round(opts.inverseStrength * 100)}%`}
            minLabel="Off — no inversion" maxLabel="Max — zero dominates"
            tint={theme.brand}
          />
          <Text style={styles.help}>
            Controls how aggressively low-like posts beat popular ones. At 0% reach is
            neutral; at 100% a post with zero likes can outrank one with millions.
          </Text>
        </Card>

        {/* Diversity */}
        <Card>
          <CardHead icon="people" title="Spread attention" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Creator diversity</Text>
              <Text style={styles.help}>Keep lowering reach for creators you've already seen, so many more people get attention.</Text>
            </View>
            <Switch value={opts.diversityOn} onValueChange={toggleDiversity} trackColor={{ true: theme.brand, false: '#333' }} />
          </View>
        </Card>

        {/* Freshness */}
        <Card>
          <CardHead icon="time" title="Freshness decay" />
          <Slider
            value={Math.min(1, Math.max(0, (opts.freshnessHalfLifeHours - 6) / (240 - 6)))}
            onValueChange={(v) => setFreshnessHalfLife(Math.round(6 + v * (240 - 6)))}
            display={`${Math.round(opts.freshnessHalfLifeHours)}h half-life`}
            minLabel="recent only" maxLabel="age doesn't matter"
            tint={theme.good}
          />
          <Text style={styles.help}>How fast older posts lose reach. A 6h half-life favors brand-new posts; 240h lets older posts stay in play.</Text>
        </Card>

        {/* Interests */}
        <Card>
          <CardHead icon="heart" title="Your interests" />
          <Text style={styles.help}>We read these to deliver relevant content — but reach is still inverted, so it stays authentic.</Text>
          <View style={styles.interests}>
            {TOPICS.map((t) => {
              const w = prefs.interests[t.id as keyof typeof prefs.interests] ?? 0;
              const on = w > 0;
              return (
                <View key={t.id} style={styles.interestItem}>
                  <Pressable
                    onPress={() => toggleInterest(t.id as any, !on)}
                    style={[styles.interestHead, on && { borderColor: t.color }]}
                  >
                    <Ionicons name={t.icon as any} size={16} color={on ? t.color : theme.textFaint} />
                    <Text style={[styles.interestLabel, { color: on ? theme.text : theme.textDim }]}>{t.label}</Text>
                    {on && <Ionicons name="checkmark" size={15} color={t.color} style={{ marginLeft: 'auto' }} />}
                  </Pressable>
                  {on && (
                    <Slider
                      value={w}
                      onValueChange={(v) => setInterestWeight(t.id as any, v)}
                      display={`${Math.round(w * 100)}%`}
                      tint={t.color}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        <Pressable onPress={reset} style={styles.resetBtn}>
          <Ionicons name="refresh" size={16} color={theme.bad} />
          <Text style={styles.resetText}>Reset & re-onboard</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);
const CardHead = ({ icon, title }: { icon: any; title: string }) => (
  <View style={styles.cardHead}>
    <Ionicons name={icon} size={17} color={theme.brand2} />
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
);
const SegBtn = ({ active, onPress, icon, label, tint }: { active: boolean; onPress: () => void; icon: any; label: string; tint: string }) => (
  <Pressable onPress={onPress} style={[styles.seg, active && { backgroundColor: tint, borderColor: tint }]}>
    <Ionicons name={icon} size={15} color={active ? '#fff' : theme.textDim} />
    <Text style={[styles.segText, { color: active ? '#fff' : theme.textDim }]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { padding: 6 },
  title: { color: theme.text, fontSize: 16, fontWeight: '800' },
  scroll: { padding: 16, gap: 14 },
  card: { backgroundColor: theme.panelSolid, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
  segment: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: theme.border },
  segText: { fontSize: 14, fontWeight: '800' },
  help: { color: theme.textFaint, fontSize: 12.5, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowTitle: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  interests: { gap: 12, marginTop: 12 },
  interestItem: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 },
  interestHead: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent' },
  interestLabel: { fontSize: 14, fontWeight: '700' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: theme.bad + '66' },
  resetText: { color: theme.bad, fontSize: 14, fontWeight: '800' },
});
