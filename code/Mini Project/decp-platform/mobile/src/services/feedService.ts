import { api } from './api';
import { Post, PaginatedResponse, PaginationParams } from '../types';
import { extractData, mapUser, toPaginated } from './utils';

const mapComment = (raw: any) => ({
  id: raw?._id || raw?.id || '',
  author: mapUser(raw?.author || { id: raw?.userId || '', firstName: 'User' }),
  content: raw?.content || '',
  createdAt: raw?.createdAt || new Date().toISOString(),
});

const toLikesArray = (rawLikes: any): string[] => {
  if (Array.isArray(rawLikes)) {
    return rawLikes;
  }
  const count = Number(rawLikes || 0);
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }
  return Array.from({ length: count }, (_, index) => `like-${index}`);
};

const mapPost = (raw: any): Post => {
  const id = raw?._id || raw?.id || '';
  const author = mapUser(raw?.author || { id: raw?.userId || '', firstName: 'Community', lastName: 'Member' });
  const mediaUrls = Array.isArray(raw?.mediaUrls) ? raw.mediaUrls : [];
  const comments = Array.isArray(raw?.comments) ? raw.comments.map(mapComment) : [];

  return {
    id,
    author,
    content: raw?.content || '',
    media: mediaUrls.map((url: string, index: number) => ({
      id: `${id}-media-${index}`,
      type: /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image',
      url,
    })),
    likes: toLikesArray(raw?.likes),
    comments,
    shares: Number(raw?.shares || 0),
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
    isLiked: false,
  };
};

export const feedService = {
  getPosts: async (params: PaginationParams = {}): Promise<PaginatedResponse<Post>> => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const response = await api.get('/posts/feed', {
      params: { page, limit, sortBy, sortOrder },
    });
    return toPaginated<Post>(response, mapPost);
  },

  getPostById: async (postId: string): Promise<Post> => {
    const response = await api.get(`/posts/${postId}`);
    const data = extractData<any>(response);
    return mapPost(data.post || data);
  },

  createPost: async (postData: { content: string; media?: any[] }): Promise<Post> => {
    const formData = new FormData();
    formData.append('content', postData.content);
    
    if (postData.media && postData.media.length > 0) {
      postData.media.forEach((media, index) => {
        formData.append('media', {
          uri: media.uri,
          type: media.type,
          name: media.name || `media_${index}`,
        } as any);
      });
      const hasVideo = postData.media.some((media) => String(media?.type || '').startsWith('video/'));
      formData.append('type', hasVideo ? 'video' : 'image');
    }

    const response = await api.post('/posts', formData);
    const data = extractData<any>(response);
    return mapPost(data.post || data);
  },

  updatePost: async (postId: string, data: Partial<Post>): Promise<Post> => {
    const response = await api.put(`/posts/${postId}`, data);
    const payload = extractData<any>(response);
    return mapPost(payload.post || payload);
  },

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  likePost: async (postId: string): Promise<{ likes: string[] }> => {
    const response = await api.post(`/posts/${postId}/like`);
    const data = extractData<any>(response);
    return { likes: data?.liked ? ['liked'] : [] };
  },

  unlikePost: async (postId: string): Promise<{ likes: string[] }> => {
    const response = await api.delete(`/posts/${postId}/like`);
    const data = extractData<any>(response);
    return { likes: data?.liked ? ['liked'] : [] };
  },

  addComment: async (postId: string, content: string): Promise<Post['comments'][0]> => {
    const response = await api.post(`/posts/${postId}/comments`, {
      content,
    });
    const data = extractData<any>(response);
    return mapComment(data.comment || data);
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  },

  sharePost: async (postId: string): Promise<void> => {
    await api.post(`/posts/${postId}/share`);
  },

  getUserPosts: async (userId: string, params: PaginationParams = {}): Promise<PaginatedResponse<Post>> => {
    const { page = 1, limit = 10 } = params;
    const response = await api.get('/posts/feed', {
      params: { page, limit },
    });
    const paginated = toPaginated<Post>(response, mapPost);
    return {
      ...paginated,
      data: paginated.data.filter((post) => post.author.id === userId),
      total: paginated.data.filter((post) => post.author.id === userId).length,
      hasMore: false,
    };
  },
};
