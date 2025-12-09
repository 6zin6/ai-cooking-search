export interface Video {
    videoId: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    url: string;
}

export interface YoutubeSearchItem {
    id: {
        videoId: string;
    };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            medium: {
                url: string;
            };
        };
        channelTitle: string;
        publishedAt: string;
    }
}