import React from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
} from '@mui/material';
import { Bookmark } from '@mui/icons-material';
import { useGetBookmarkedPostsQuery } from '@services/postApi';
import { PostCard } from '@components/feed/PostCard';
import { EmptyState } from '@components/common';

export const SavedPostsPage: React.FC = () => {
    const { data, isLoading, refetch } = useGetBookmarkedPostsQuery();

    const posts = Array.isArray(data?.data) ? data.data : [];

    return (
        <Box className="page-enter max-w-2xl mx-auto">
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    mb: 3,
                    position: 'relative',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)',
                }}
            >
                <Box
                    className="absolute inset-0 opacity-15"
                    sx={{
                        backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`,
                        backgroundSize: '30px 30px',
                    }}
                />
                <Box className="relative p-6">
                    <Box className="flex items-center gap-3">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '14px',
                                background: 'rgba(129,140,248,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Bookmark sx={{ color: '#a5b4fc', fontSize: 26 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                                Saved Posts
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                Posts you've bookmarked for later
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : posts.length === 0 ? (
                <EmptyState
                    icon="empty"
                    title="No saved posts yet"
                    description="When you bookmark posts, they'll appear here for easy access."
                />
            ) : (
                <Box className="stagger-children">
                    {posts.map((post: any) => (
                        <PostCard
                            key={post._id || post.id}
                            post={post}
                            onPostUpdated={refetch}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default SavedPostsPage;
