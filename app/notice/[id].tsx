import React from 'react';
import { Image, Linking, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { Card, ErrorBanner, Row, Screen, Skeleton, Txt } from '../../src/components/ui.tsx';
import { useNotice } from '../../src/hooks/queries.ts';
import { formatDate } from '../../src/lib/format.ts';

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const q = useNotice(id);
  const n = q.data;
  return (
    <Screen edges={[]} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'Notice' }} />
      {q.isPending ? <Skeleton height={160} /> : q.error ? <ErrorBanner error={q.error} onRetry={() => q.refetch()} /> : n ? (
        <>
          <Card style={{ gap: 8 }}>
            <Txt variant="title">{n.title}</Txt>
            <Txt variant="caption" color="textFaint">{[n.creatorName, formatDate(n.createdAt)].filter(Boolean).join(' · ')}</Txt>
            {n.description ? <Txt style={{ marginTop: 6 }}>{n.description}</Txt> : null}
          </Card>
          {(n.files ?? []).map((f, i) => (
            f.mimeType?.startsWith('image/') ? (
              <Pressable key={i} onPress={() => Linking.openURL(f.url)}><Image source={{ uri: f.url }} style={{ width: '100%', aspectRatio: 1.4, borderRadius: 14, backgroundColor: colors.cardAlt }} resizeMode="cover" /></Pressable>
            ) : (
              <Card key={i} onPress={() => Linking.openURL(f.url)}>
                <Row><Ionicons name="document-attach" size={22} color={colors.primary} /><Txt style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>{f.name ?? 'Attachment'}</Txt><Ionicons name="open-outline" size={18} color={colors.textFaint} /></Row>
              </Card>
            )
          ))}
        </>
      ) : null}
    </Screen>
  );
}
