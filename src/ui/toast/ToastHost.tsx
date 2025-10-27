import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Animated, Easing, Text, View, StyleSheet } from 'react-native';

type ToastAPI = { show: (msg: string, ms?: number) => void };
const ToastCtx = createContext<ToastAPI | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = (text: string, ms = 1200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(text);
    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true })
        .start(({ finished }) => finished && setVisible(false));
    }, ms);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {visible ? (
        <Animated.View style={[styles.wrap, { opacity }]}>
          <View style={styles.toast}><Text style={styles.text}>{msg}</Text></View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 88, alignItems: 'center', pointerEvents: 'none', zIndex: 9999 },
  toast: { backgroundColor: 'rgba(0,0,0,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  text: { color: '#fff', fontWeight: '600' },
});
