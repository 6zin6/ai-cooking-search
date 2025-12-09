import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Video } from '@/types/youtube'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface ScoredVideo extends Video {
    score: number;
    reason: string;
}

interface UserInput {
    mood: string;
    ingredients: string[];
    maxCookingTime: number;
}

interface RequestBody {
    userInput: UserInput;
    videos: Video[];
}

export async function POST(req: NextRequest) {
    try {
        const { userInput, videos }: RequestBody = await req.json()

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

         const videosText = videos.map((video, index) => `
動画${index + 1}:
- タイトル: ${video.title}
- 説明文: ${video.description.substring(0, 200)}
- チャンネル: ${video.channelTitle}
`).join('\n');

    const prompt = `
あなたは料理動画の評価アシスタントです。
ユーザーの要望と複数の動画情報を比較し、それぞれの適合度を0-100で評価してください。

# ユーザーの要望
気分: ${userInput.mood}
食材: ${userInput.ingredients.join(', ')}
調理時間: ${userInput.maxCookingTime}分以内

# 動画リスト
${videosText}

# 評価基準
- 指定食材が使われている: 重要度 高
- タイトルや説明に「簡単」「時短」などのキーワード: 重要度 中
- 気分に合っている: 重要度 中
- リュウジ、だれウマのチャンネルは簡単レシピが多い: 参考情報

# 出力形式
必ずJSON配列形式で返してください。動画の順番通りに評価を返してください:
[
  {"score": 85, "reason": "評価理由を簡潔に"},
  {"score": 70, "reason": "評価理由を簡潔に"},
  ...
]

# 例
[
  {"score": 90, "reason": "鶏肉とトマトを使用し、簡単に作れるレシピです"},
  {"score": 75, "reason": "鶏肉を使っていますが、調理時間がやや長めです"}
]
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSONを抽出
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const scores = JSON.parse(jsonText);
    
    // 動画とスコアを結合
    const scoredVideos: ScoredVideo[] = videos.map((video, index) => ({
      ...video,
      score: scores[index]?.score || 0,
      reason: scores[index]?.reason || '評価できませんでした',
    }));
    
    // スコア順にソート
    scoredVideos.sort((a, b) => b.score - a.score);
    
    return NextResponse.json({ videos: scoredVideos });

    } catch (error) {
        console.error('Gemini APIエラー', error)
        return NextResponse.json(
            { error: '動画評価に失敗しました' },
            { status: 500 }
        )
    }
}