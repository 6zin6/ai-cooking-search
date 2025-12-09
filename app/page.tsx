'use client'

import { useState } from "react"
import { Video } from '@/types/youtube'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, ChefHat, Loader2, ExternalLink, Sparkles } from "lucide-react"

interface ScoredVideo extends Video {
    score: number;
    reason: string;
}

export default function TestPage() {
    const [mood, setMood] = useState('')
    const [ingredients, setIngredients] = useState('')
    const [maxCookingTime, setMaxCookingTime] = useState('30')
    const [videos, setVideos] = useState<ScoredVideo[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearch = async () => {
        setLoading(true)
        try {
            const keywordResponse = await fetch('/api/ai/generate-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    mood,
                    ingredients: ingredients.split(',').map(i => i.trim()),
                    maxCookingTime: parseInt(maxCookingTime),
                })
            })
            const { keyword } = await keywordResponse.json()
            console.log('生成されたキーワード', keyword)

            const searchResponse = await fetch('/api/youtube/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ keywords: keyword }),
            })
            const { videos: searchVideos } = await searchResponse.json()

            const scoreResponse = await fetch('/api/ai/score-videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInput: {
                        mood,
                        ingredients: ingredients.split(',').map(i => i.trim()),
                        maxCookingTime: parseInt(maxCookingTime),
                    },
                    videos: searchVideos
                }),
            })
            const { videos: scoreVideos } = await scoreResponse.json()

            setVideos(scoreVideos)

        } catch (error) {
            console.error('エラー', error)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* ヘッダー */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center flex-col sm:flex-row gap-3 mb-4">
                        <ChefHat className="w-10 h-10 text-orange-500" />
                        <h1 className="text-5xl font-bold bg-linear-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">
                            AI料理動画サーチ
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        今日の気分と食材から、ぴったりのレシピ動画を見つけます
                    </p>
                </div>

                {/* 検索フォーム */}
                <Card className="mb-8 shadow-lg border-2 border-orange-100">
                    <CardHeader className="bg-linear-to-br from-orange-50 to-red-50 py-5">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                            レシピを検索
                        </CardTitle>
                        <CardDescription>
                            あなたの条件に合った料理動画をAIが見つけます
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="mood" className="text-base font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                今日の気分
                            </Label>
                            <Input
                                id="mood"
                                type="text"
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                placeholder="例: 疲れてて簡単なものがいい"
                                className="text-base"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="ingredients" className="text-base font-semibold flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                使いたい食材
                            </Label>
                            <Input
                                id="ingredients"
                                type="text"
                                value={ingredients}
                                onChange={(e) => setIngredients(e.target.value)}
                                placeholder="例: 鶏肉, トマト, 玉ねぎ"
                                className="text-base"
                            />
                            <p className="text-sm text-gray-500">複数の食材はカンマ(,)で区切ってください</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="time" className="text-base font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                調理時間（分以内）
                            </Label>
                            <Input
                                id="time"
                                type="number"
                                value={maxCookingTime}
                                onChange={(e) => setMaxCookingTime(e.target.value)}
                                className="text-base"
                                min="5"
                                max="120"
                            />
                        </div>
                        
                        <Button
                            onClick={handleSearch}
                            disabled={loading || !mood || !ingredients}
                            className="w-full h-12 text-base font-semibold bg-linear-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    検索中...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-5 w-5" />
                                    動画を探す
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* 検索結果 */}
                {videos.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                おすすめの動画 ({videos.length}件)
                            </h2>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                スコア順
                            </Badge>
                        </div>
                        
                        <div className="grid gap-6">
                            {videos.slice(0, 10).map((video: ScoredVideo, index: number) => (
                                <Card key={video.videoId} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 hover:border-orange-200">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row gap-0 md:gap-6">
                                            {/* サムネイル */}
                                            <div className="relative md:w-80 w-full h-48 md:h-auto shrink-0">
                                                <Image 
                                                    src={video.thumbnail} 
                                                    alt={video.title}
                                                    width={320}
                                                    height={180}
                                                    className="w-full h-full object-cover"
                                                />
                                                {index < 3 && (
                                                    <Badge className="absolute top-3 left-3 bg-linear-to-br from-yellow-400 to-orange-500 text-white border-0">
                                                        TOP {index + 1}
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            {/* コンテンツ */}
                                            <div className="flex-1 p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <h3 className="font-bold text-xl text-gray-900 leading-tight line-clamp-2">
                                                            {video.title}
                                                        </h3>
                                                        <Badge 
                                                            variant={video.score >= 80 ? "default" : "secondary"}
                                                            className={`shrink-0 text-base px-3 py-1 ${
                                                                video.score >= 80 
                                                                    ? 'bg-linear-to-br from-green-500 to-emerald-500' 
                                                                    : ''
                                                            }`}
                                                        >
                                                            {video.score}点
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge variant="outline" className="text-sm">
                                                            {video.channelTitle}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <p className="text-gray-700 mb-4 leading-relaxed">
                                                        {video.reason}
                                                    </p>
                                                </div>
                                                
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="w-full md:w-auto border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                                                >
                                                    <a 
                                                        href={video.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        YouTubeで見る
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* 結果なしメッセージ */}
                {!loading && videos.length === 0 && mood && ingredients && (
                    <Card className="text-center py-12">
                        <CardContent>
                            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">
                                条件に合う動画が見つかりませんでした
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                検索条件を変えて再度お試しください
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}