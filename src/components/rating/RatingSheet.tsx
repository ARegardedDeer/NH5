import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  PanResponder,
  Animated,
} from 'react-native';

type Props = {
  visible: boolean;
  value: number | null;                 // 1.0–10.0 or 11 or null
  onClose: () => void;
  onChange?: (liveValue: number | null) => void; // live updates during drag
  onCommit?: (finalValue: number | null) => void; // Save (snapped to 0.1)
  onClear?: () => void;                 // Clear rating
  onSetEleven?: () => void;             // Set 11/10 (parent persists + overwrite)
  saving?: boolean;                     // show spinner on Save
  allowEleven?: boolean;                // default true
};

const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const snap01 = (v:number)=>Math.round(v*10)/10; // snap to 0.1
const fmt = (v:number|null)=> v===11 ? '11/10' : (v!=null ? v.toFixed(1) : '–');

export default function RatingSheet({
  visible,
  value,
  onClose,
  onChange,
  onCommit,
  onClear,
  onSetEleven,
  saving,
  allowEleven = true,
}: Props) {
  const railRef = useRef<View|null>(null);
  const railWidthRef = useRef(0);
  const railLeftInWindowRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(value ?? null);
  const thumbX = useRef(new Animated.Value(0)).current;

  // measure with absolute screen coords (works on simulator + device)
  const measureRail = () => {
    railRef.current?.measureInWindow((x, _y, w) => {
      railLeftInWindowRef.current = x;
      railWidthRef.current = w;
      const v = value === 11 ? 10 : (value ?? 5);
      const ratio = (clamp(v, 1, 10) - 1) / 9;
      thumbX.setValue(ratio * Math.max(railWidthRef.current - 24, 0));
    });
  };

  useEffect(() => {
    if (!visible) return;
    setTimeout(measureRail, 0);
  }, [visible]);

  useEffect(() => {
    setDragValue(value ?? null);
    if (railWidthRef.current > 0) {
      const v = value === 11 ? 10 : (value ?? 5);
      const ratio = (clamp(v, 1, 10) - 1) / 9;
      thumbX.setValue(ratio * Math.max(railWidthRef.current - 24, 0));
    }
  }, [value]);

  const handleMove = (evt:any) => {
    const pageX = evt.nativeEvent?.pageX ?? 0;
    const localX = pageX - railLeftInWindowRef.current;
    const w = Math.max(railWidthRef.current, 1);
    const ratio = clamp(localX / w, 0, 1);
    const val = 1 + ratio * 9; // 1..10
    setDragValue(val);
    onChange?.(val);
    const track = Math.max(w - 24, 0);
    thumbX.setValue(clamp(ratio * track, 0, track));
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => { setIsDragging(true); handleMove(evt); },
    onPanResponderMove: (evt) => handleMove(evt),
    onPanResponderRelease: () => {
      setIsDragging(false);
      if (dragValue == null) return;
      const snapped = snap01(clamp(dragValue, 1, 10));
      setDragValue(snapped);
      onChange?.(snapped);
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderTerminate: () => setIsDragging(false),
  }), [dragValue]);

  const display = fmt(dragValue ?? value ?? null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Rate This Anime</Text>
          <Text style={styles.value}>{display}</Text>

          {allowEleven && (
            <Pressable
              onPress={onSetEleven}
              style={styles.elevenButton}
              accessibilityRole="button"
              accessibilityLabel="Set as eleven out of ten"
            >
              <Text style={styles.elevenText}>⭐ Set as 11/10 ⭐</Text>
            </Pressable>
          )}

          <View
            ref={railRef}
            style={styles.rail}
            onLayout={measureRail}
            {...pan.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Rating slider"
            accessibilityValue={{ text: display }}
          >
            <View style={styles.fill} pointerEvents="none" />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.thumb,
                { transform: [{ translateX: thumbX }, { scale: isDragging ? 1.2 : 1 }] },
              ]}
            />
          </View>

          <View style={styles.buttons}>
            <Pressable onPress={onClear} style={[styles.btn, styles.btnClear]} accessibilityRole="button">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Clear</Text>}
            </Pressable>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnCancel]} accessibilityRole="button">
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onCommit?.(dragValue == null ? null : snap01(clamp(dragValue, 1, 10)))}
              style={[styles.btn, styles.btnSave]}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator size="small" color="#0B0A16" /> : <Text style={[styles.btnText, styles.btnTextSave]}>Save</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#1A1825',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  value: { color: '#A78BFA', fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  elevenButton: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(251,176,36,0.15)',
    borderColor: 'rgba(251,176,36,0.5)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  elevenText: { color: '#FBB024', fontWeight: '800' },
  rail: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    backgroundColor: 'rgba(167,139,250,0.12)',
    marginTop: 16,
    marginBottom: 20,
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(167,139,250,0.25)',
    borderRadius: 12,
  },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#A78BFA' },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnClear: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  btnCancel: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  btnSave: { backgroundColor: '#A78BFA' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnTextSave: { color: '#0B0A16' },
});
