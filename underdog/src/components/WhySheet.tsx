import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RankedPost } from '../types';
import { theme } from '../theme';
import { userById, topicById } from '../data/seed';
import { fmtCount } from '../algo/rank';

interface Props {
  ranked?: RankedPost | null;
  visible: boolean;
  onClose: () => void;
}

const Bar = ({ label, value, color, note }: { label: string; value: number; color: string; note: string }) => (
  <View style={styles.barRow}>
    <View style={styles.barHead}>
      <Text style={styles.barLabel}>{label}</Text>
      <Text style={[styles.barVal, { color }]}>{Math.round(value * 100)}</Text>
    </View>
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(3, value * 100)}%`, backgroundColor: color }]} />
    </View>
    <Text style={styles.barNote}>{note}</Text>
  </View>
);

export function WhySheet({ ranked, visible, onClose }: Props) {
  const post = ranked?.post;
  const f = ranked?.factors;
  const creator = post ? userById(post.creatorId) : null;
  const topic = post ? topicById(post.topic) : null;
  const inverse = true;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headRow}>
            <Text style={styles.title}>Why you're seeing this</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.textDim} />
            </Pressable>
          </View>

          {post && creator && f && (
            <>
              <View style={styles.postLine}>
                <View style={[styles.dot, { backgroundColor: topic?.color }]} />
                <Text style={styles.postText} numberOfLines={1}>
                  {creator.name} · {topic?.label} · {fmtCount(post.likes)} likes
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <Bar label="Reach boost" value={f.reach} color={theme.accent}
                  note={inverse
                    ? (post.likes === 0
                      ? 'Zero likes = maximum reach. This is the core inversion.'
                      : `Low likes beat high likes. A mega post with ${fmtCount(post.likes)} likes would score ~0 here.`)
                    : 'Popularity-weighted: more likes = more reach.'} />
                <Bar label="Relevance to you" value={f.relevance} color={theme.brand2}
                  note={f.relevance > 0.5 ? 'Matches an interest you picked.' : 'Discovery baseline — outside your picks, surfaced for variety.'} />
                <Bar label="Freshness" value={f.freshness} color={theme.good}
                  note={f.freshness > 0.7 ? 'Posted recently.' : 'Older post, freshness decay applies.'} />
                <Bar label="Creator diversity" value={f.diversity} color={theme.warn}
                  note={f.diversity > 0.8 ? 'You haven\'t seen much from this creator.' : 'You\'ve seen this creator recently, so reach is lowered to spread attention.'} />
              </ScrollView>

              <View style={styles.explainer}>
                <Ionicons name="information-circle" size={16} color={theme.textFaint} />
                <Text style={styles.explainerText}>
                  Standard apps rank by likes, so attention concentrates on a few huge
                  accounts. Underdog multiplies relevance by an inverse-reach boost:
                  the fewer the likes, the farther it spreads. Combined with creator
                  diversity, attention gets shared across many more people.
                </Text>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: theme.panelSolid, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 18, paddingBottom: 34, maxHeight: '82%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 12 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { color: theme.text, fontSize: 18, fontWeight: '800' },
  postLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  postText: { color: theme.textDim, fontSize: 13, fontWeight: '600' },
  barRow: { marginBottom: 16 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { color: theme.text, fontSize: 13.5, fontWeight: '700' },
  barVal: { fontSize: 13.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  barNote: { color: theme.textFaint, fontSize: 12, marginTop: 6, lineHeight: 17 },
  explainer: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border },
  explainerText: { color: theme.textFaint, fontSize: 12.5, lineHeight: 18, flex: 1 },
});
