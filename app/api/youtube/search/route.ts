import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { Video, YoutubeSearchItem } from '@/types/youtube'

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

const CHANNEL_IDS = [
    process.env.CHANNEL_ID_RYUJI!,
    process.env.CHANNEL_ID_DAREUMA!,
    process.env.CHANNEL_ID_KOHKENTETSU!,
];

const MAX_TOTAL_RESULTS = 10;

export async function POST(req: NextRequest) {
    try {
        const { keywords } = await req.json();

        const searchPromises = CHANNEL_IDS.map(async (channelId) => {
            const response = await youtube.search.list({
                part: ['snippet'],
                channelId: channelId,
                q: keywords,
                maxResults: 3,
                order: 'relevance',
                type: ['video'],
            });

            return (response.data.items || []) as YoutubeSearchItem[];
        });

        const results = await Promise.all(searchPromises);
        const allVideos = results.flat();

        const videos: Video[] = allVideos.map((item) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

         const limitedVideos = videos.slice(0, MAX_TOTAL_RESULTS);

        return NextResponse.json({ videos: limitedVideos });
    } catch (error) {
        console.error('Youtube APIエラー', error);
        return NextResponse.json(
            { error: '動画の検索に失敗しました' },
            { status: 500 },
        )
    }
}