import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { COLORS } from '../constants/colors';

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  length?: number;
  error?: string;
  label?: string;
  autoFocus?: boolean;
}

export function PinInput({ value, onChange, length = 4, error, label, autoFocus = false }: PinInputProps) {
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(numericText);
  };

  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View style={[styles.pinContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <TouchableOpacity onPress={handlePress} style={styles.dotsContainer} activeOpacity={1}>
          {Array.from({ length }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                value.length > index && styles.dotFilled,
                error && styles.dotError,
              ]}
            >
              {value.length > index && (
                <View style={styles.dotInner} />
              )}
            </View>
          ))}
        </TouchableOpacity>
      </Animated.View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        secureTextEntry
        autoFocus={autoFocus}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 16,
    fontWeight: '500',
  },
  pinContainer: {
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  dot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotFilled: {
    backgroundColor: COLORS.softBlue,
    borderColor: COLORS.softBlue,
  },
  dotError: {
    borderColor: COLORS.warmCoral,
  },
  dotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: COLORS.warmCoral,
    marginTop: 12,
    fontSize: 14,
  },
});
