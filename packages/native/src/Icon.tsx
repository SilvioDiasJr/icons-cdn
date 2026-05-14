import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useIcon } from '@icons/core';
import type { PackName, IconProps } from '@icons/core';

export function Icon<P extends PackName>({
  pack,
  name,
  size = 24,
  color = '#000000',
  style,
  onError,
}: IconProps<P>) {
  const result = useIcon(pack, name, color, onError);

  // ── Error state: bordered placeholder ──
  if (result.status === 'error') {
    return (
      <View
        accessibilityLabel={`${pack}/${String(name)} (failed to load)`}
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderColor: color,
            borderRadius: 4,
            opacity: 0.25,
          },
          style as object,
        ]}
      />
    );
  }

  // ── Loading state: ActivityIndicator ──
  if (result.status === 'loading') {
    return (
      <View
        accessibilityLabel={`${pack}/${String(name)} (loading)`}
        style={[
          styles.center,
          { width: size, height: size },
          style as object,
        ]}
      >
        <ActivityIndicator
          size={size > 32 ? 'large' : 'small'}
          color={color}
          style={{ opacity: 0.35 }}
        />
      </View>
    );
  }

  // ── Ready: rendered SVG ──
  return (
    <SvgXml
      xml={result.xml}
      width={size}
      height={size}
      style={style as object}
      accessibilityLabel={`${pack}/${String(name)}`}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1.5,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
