import React, { forwardRef } from 'react';
import { Platform, ScrollView } from 'react-native';

// Preserve native props and refs. Forms remain tappable while the keyboard is open.
export default forwardRef(function AppScrollView(props, ref) {
  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      {...props}
    />
  );
});
