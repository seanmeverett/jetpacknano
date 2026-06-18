import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Dimensions, Animated, Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../store';
import { POSTS, userById, topicById } from '../data/seed';
import { rankFeed, fmtCount } from '../algo/rank';
import type { RankedPost } from '../types';
import { theme } from '../theme';
import { WhySheet } from '../components/WhySheet';

const H = Dimensions.get('window').height;
const W = Dimensions.get('window').width;

const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function Feed() {
  const { prefs, opts, liked, likeBoosts, setScreen, toggleLike } = useApp();
  const [whyFor, setWhyFor] = useState<RankedPost | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const heartAnim = useRef(new Map<string, Animated.Value>()).current;

  const ranked = useMemo<RankedPost[]>(() => {
    const eff = POSTS.map((p) => ({ ...p, likes: p.likes + (likeBoosts[p.id] ?? 0) }));
    return rankFeed(eff, prefs, opts);
  }, [prefs, opts, likeBoosts]);

  const viewRef = useRef({ viewabilityConfig: { itemVisiblePercentThreshold: 60 }, onViewableItemsChanged: ({ changed }: any) => {
    const vis = changed.find((c: any) => c.isViewable);
    if (vis) setIndex(vis.index);
  } }).current;

  const burst = (id: string) => {
    let v = heartAnim.get(id);
    if (!v) { v = new Animated.Value(0); heartAnim.set(id, v); }
    v.setValue(0);
    Animated.timing(v!, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  };

  const onDouble = useCallback((id: string) => {
    if (!liked[id]) toggleLike(id);
    burst(id);
  }, [liked, toggleLike]);

  const openWhy = (rp: RankedPost) => { setWhyFor(rp); setWhyOpen(true); };

  return (
    <View style={styles.container}>
      <FlatList
        data={ranked}
        keyExtractor={(item) => item.post.id}
        renderItem={({ item }) => (
          <PostCard
            rp={item}
            liked={!!liked[item.post.id]}
            onLike={() => { toggleLike(item.post.id); burst(item.post.id); }}
            onDouble={() => onDouble(item.post.id)}
            onWhy={() => openWhy(item)}
            heartScale={heartAnim.get(item.post.id)}
          />
        )}
        pagingEnabled
        snapToInterval={H}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        {...viewRef}
        getItemLayout={(_, i) => ({ length: H, offset: H * i, index: i })}
        extraData={liked}
      />

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBarWrap} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Text style={styles.brand}>Underdog</Text>
          <Pressable
            onPress={() => setScreen('settings')}
            style={[styles.modePill, { borderColor: opts.mode === 'inverse' ? theme.brand : theme.warn }]}
          >
            <Ionicons name={opts.mode === 'inverse' ? 'trending-down' : 'trending-up'} size={13} color={opts.mode === 'inverse' ? theme.brand : theme.warn} />
            <Text style={[styles.modeText, { color: opts.mode === 'inverse' ? theme.brand : theme.warn }]}>
              {opts.mode === 'inverse' ? 'Inverse' : 'Standard'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setScreen('settings')} hitSlop={10}>
            <Ionicons name="options-outline" size={22} color={theme.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* progress dots */}
      <View style={styles.dotsWrap} pointerEvents="none">
        <Text style={styles.counter}>{index + 1}/{ranked.length}</Text>
      </View>

      <WhySheet ranked={whyFor} visible={whyOpen} onClose={() => setWhyOpen(false)} />
    </View>
  );
}

interface CardProps {
  rp: RankedPost;
  liked: boolean;
  onLike: () => void;
  onDouble: () => void;
  onWhy: () => void;
  heartScale?: Animated.Value;
}

function PostCard({ rp, liked, onLike, onDouble, onWhy, heartScale }: CardProps) {
  const { post, factors } = rp;
  const creator = userById(post.creatorId);
  const topic = topicById(post.topic);
  const lastTap = useRef(0);
  const freshFace = creator.followers < 100;

  const tapBg = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) onDouble();
    else lastTap.current = now;
  };

  return (
    <View style={[styles.card, { height: H, width: W, backgroundColor: post.bgFrom }]}>
      {post.kind === 'image' && post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <LinearGradient
          colors={[post.bgFrom ?? '#333', post.bgTo ?? '#111']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* readability gradients */}
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', 'transparent']} style={styles.topGrad} />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.82)']}
        style={styles.bottomGrad}
      />

      {/* tap layer for double-tap like */}
      <Pressable onPress={tapBg} style={StyleSheet.absoluteFill} />

      {/* burst heart */}
      {heartScale && (
        <Animated.View pointerEvents="none" style={[styles.burst, {
          opacity: heartScale.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 0] }),
          transform: [{ scale: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.5] }) }],
        }]}>
          <Ionicons name="heart" size={92} color={theme.brand2} />
        </Animated.View>
      )}

      {/* right action rail */}
      <View style={styles.rail}>
        <RailButton icon={liked ? 'heart' : 'heart-outline'} color={liked ? theme.brand2 : theme.text}
          label={fmtCount(post.likes + (liked ? 1 : 0))} onPress={onLike} />
        <RailButton icon="chatbubble-outline" color={theme.text} label={fmtCount(post.comments)} onPress={() => {}} />
        <RailButton icon="arrow-redo-outline" color={theme.text} label={fmtCount(post.shares)} onPress={() => {}} />
        <Pressable onPress={onWhy} style={styles.whyBtn}>
          <Ionicons name="help-circle-outline" size={34} color={theme.text} />
          <Text style={styles.whyLabel}>Why?</Text>
        </Pressable>
      </View>

      {/* reach meter */}
      <View style={styles.reachMeter} pointerEvents="none">
        <Text style={styles.reachTitle}>REACH BOOST</Text>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${Math.max(4, factors.reach * 100)}%`, backgroundColor: theme.accent }]} />
        </View>
        <Text style={styles.reachSub}>
          {factors.reach > 0.7 ? 'high — low likes spread far' : factors.reach < 0.25 ? 'low — crowded post' : 'mid'}
        </Text>
      </View>

      {/* bottom info */}
      <SafeAreaView edges={['bottom']} style={styles.bottomInfo}>
        <View style={styles.creatorRow}>
          <View style={[styles.avatar, { backgroundColor: topic.color }]}>
            <Text style={styles.avatarText}>{initials(creator.name)}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{creator.name}</Text>
              {creator.verified && <Ionicons name="checkmark-circle" size={13} color={theme.accent} />}
              {freshFace && <View style={styles.freshBadge}><Text style={styles.freshText}>FRESH FACE</Text></View>}
            </View>
            <Text style={styles.handle}>@{creator.handle} · {fmtCount(creator.followers)} followers</Text>
          </View>
          <Pressable style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </Pressable>
        </View>

        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: topic.color + '33' }]}>
            <Ionicons name={topic.icon as any} size={12} color={topic.color} />
            <Text style={[styles.tagText, { color: topic.color }]}>{topic.label}</Text>
          </View>
          <Text style={styles.age}>{ageText(post.ageHours)}</Text>
        </View>

        <Text style={styles.caption}>{post.caption}</Text>

        <Pressable onPress={onWhy} style={styles.whyLink}>
          <Ionicons name="sparkles" size={13} color={theme.accent} />
          <Text style={styles.whyLinkText}>Why am I seeing this?</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const RailButton = ({ icon, color, label, onPress }: { icon: any; color: string; label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.railBtn}>
    <Ionicons name={icon} size={32} color={color} />
    <Text style={[styles.railLabel, { color }]}>{label}</Text>
  </Pressable>
);

const ageText = (h: number) =>
  h < 1 ? 'just now' : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  card: { overflow: 'hidden' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  bottomGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 320 },
  burst: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  topBarWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 10,
  },
  brand: { color: theme.text, fontSize: 19, fontWeight: '900', letterSpacing: 0.4 },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modeText: { fontSize: 12, fontWeight: '800' },
  dotsWrap: { position: 'absolute', top: 56, left: 0, right: 0, alignItems: 'center' },
  counter: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rail: { position: 'absolute', right: 12, bottom: 150, alignItems: 'center', gap: 20 },
  railBtn: { alignItems: 'center', gap: 3 },
  railLabel: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  whyBtn: { alignItems: 'center', gap: 1, marginTop: 2 },
  whyLabel: { color: theme.text, fontSize: 11, fontWeight: '700' },
  reachMeter: { position: 'absolute', right: 12, top: 100, width: 120 },
  reachTitle: { color: theme.textDim, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  meterTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  meterFill: { height: 5, borderRadius: 3 },
  reachSub: { color: theme.textFaint, fontSize: 9.5, marginTop: 4 },
  bottomInfo: { position: 'absolute', left: 0, right: 78, bottom: 0, padding: 18, paddingBottom: 26 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: theme.text, fontSize: 15.5, fontWeight: '800' },
  handle: { color: theme.textDim, fontSize: 12.5, marginTop: 1 },
  freshBadge: { backgroundColor: theme.good, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freshText: { color: '#062', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },
  followBtn: { borderWidth: 1.5, borderColor: theme.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginLeft: 'auto' },
  followText: { color: theme.text, fontWeight: '800', fontSize: 13 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontSize: 12, fontWeight: '800' },
  age: { color: theme.textDim, fontSize: 12 },
  caption: { color: theme.text, fontSize: 15, lineHeight: 21, fontWeight: '500', maxWidth: '92%' },
  whyLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  whyLinkText: { color: theme.accent, fontSize: 12.5, fontWeight: '700' },
});
