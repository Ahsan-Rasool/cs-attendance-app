import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { Card, Empty, ErrorBanner, Skeleton, Txt } from '../../src/components/ui.tsx';
import { useNotices } from '../../src/hooks/queries.ts';
import { formatDate } from '../../src/lib/format.ts';

export default function Notices() {
  const { colors } = useTheme();
  const router = useRouter();
  const q = useNotices();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={q.notices}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        ListHeaderComponent={<View style={{ gap: 12 }}><Txt variant="title">Notices</Txt>{q.error ? <ErrorBanner error={q.error} onRetry={() => q.refetch()} /> : null}</View>}
        refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => q.refetch()} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.card} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage(); }}
        ListEmptyComponent={q.isPending ? <View style={{ gap: 12 }}><Skeleton /><Skeleton /></View> : <Empty icon="megaphone-outline" title="No notices yet" />}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ margin: 16 }} /> : null}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/notice/${item.id}`)} style={{ gap: 6 }}>
            <Txt variant="heading">{item.title}</Txt>
            {item.description ? <Txt color="textMuted" numberOfLines={2}>{item.description}</Txt> : null}
            <Txt variant="caption" color="textFaint">{[item.creatorName, formatDate(item.createdAt)].filter(Boolean).join(' · ')}{item.files?.length ? ` · ${item.files.length} attachment${item.files.length > 1 ? 's' : ''}` : ''}</Txt>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
